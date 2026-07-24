import os
import uuid
import zipfile
import json
import csv
import io
import time
from datetime import datetime
from celery import Celery
from faker import Faker
import requests
from database import SessionLocal
from models import Job
import sqlalchemy
from generator import generate_record

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "sqla+sqlite:///celery_broker.sqlite")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "db+sqlite:///celery_results.sqlite")
DATA_DIR = "./data"

celery_app = Celery("worker", broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)



@celery_app.task(bind=True)
def generate_data_task(self, job_id, num_records, output_format, locale, fields, age_range, random_seed, country_specific, webhook_url=None):
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        db.close()
        return

    job.status = "processing"
    db.commit()

    try:
        if random_seed is not None:
            Faker.seed(random_seed)
        
        fake = Faker(locale)
        
        # Open file for streaming
        raw_file_name = f"{job_id}.{output_format}"
        raw_file_path = os.path.join(DATA_DIR, raw_file_name)
        
        records_generated = 0
        batch_size = min(10000, num_records)
        
        # Start generation
        if output_format == "csv":
            with open(raw_file_path, "w", newline='', encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=[f.split(" (optional)")[0] for f in fields])
                writer.writeheader()
                for _ in range(num_records):
                    record = generate_record(fake, fields, age_range, country_specific)
                    # Normalize keys
                    writer.writerow({k: v for k, v in record.items()})
                    records_generated += 1
                    if records_generated % batch_size == 0:
                        job.progress = (records_generated / num_records) * 100
                        db.commit()
                        
        elif output_format == "json":
            with open(raw_file_path, "w", encoding="utf-8") as f:
                f.write("[\n")
                for i in range(num_records):
                    record = generate_record(fake, fields, age_range, country_specific)
                    f.write(json.dumps(record))
                    if i < num_records - 1:
                        f.write(",\n")
                    else:
                        f.write("\n")
                    records_generated += 1
                    if records_generated % batch_size == 0:
                        job.progress = (records_generated / num_records) * 100
                        db.commit()
                f.write("]")
                
        elif output_format == "sql":
            table_name = "synthetic_data"
            with open(raw_file_path, "w", encoding="utf-8") as f:
                clean_fields = [f.split(" (optional)")[0].replace(" ", "_").replace("/", "_").lower() for f in fields]
                f.write(f"CREATE TABLE {table_name} ({', '.join([f'{cf} VARCHAR(255)' for cf in clean_fields])});\n")
                
                for _ in range(num_records):
                    record = generate_record(fake, fields, age_range, country_specific)
                    vals = [f"'{str(v).replace(chr(39), chr(39)+chr(39))}'" if v is not None else "NULL" for v in record.values()]
                    f.write(f"INSERT INTO {table_name} ({', '.join(clean_fields)}) VALUES ({', '.join(vals)});\n")
                    records_generated += 1
                    if records_generated % batch_size == 0:
                        job.progress = (records_generated / num_records) * 100
                        db.commit()
                        
        elif output_format == "xlsx":
            import pandas as pd
            # For XLSX, we might need to write in chunks if memory is an issue,
            # but for simplicity, we'll collect and use pandas, or better, openpyxl in write-only mode
            from openpyxl import Workbook
            wb = Workbook(write_only=True)
            ws = wb.create_sheet()
            ws.append([f.split(" (optional)")[0] for f in fields])
            for _ in range(num_records):
                record = generate_record(fake, fields, age_range, country_specific)
                ws.append(list(record.values()))
                records_generated += 1
                if records_generated % batch_size == 0:
                    job.progress = (records_generated / num_records) * 100
                    db.commit()
            wb.save(raw_file_path)

        # Compress to ZIP for large files
        if num_records > 5000:
            zip_file_path = os.path.join(DATA_DIR, f"{job_id}.zip")
            with zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(raw_file_path, arcname=raw_file_name)
            
            # Clean up raw file
            if os.path.exists(raw_file_path):
                os.remove(raw_file_path)
            job.file_path = zip_file_path
        else:
            job.file_path = raw_file_path

        job.status = "completed"
        job.progress = 100.0
        job.completed_at = datetime.utcnow()
        db.commit()
        
        # Fire webhook if provided
        if webhook_url:
            try:
                requests.post(webhook_url, json={
                    "job_id": job_id,
                    "status": "completed",
                    "download_url": f"http://127.0.0.1:8000/download/{job_id}",
                    "total_records": num_records
                }, timeout=5)
            except Exception as e:
                print(f"Webhook failed: {e}")
                
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
celery_app.conf.beat_schedule = {
    'cleanup-expired-inboxes': {
        'task': 'worker.cleanup_inboxes',
        'schedule': 60.0, # Run every 60 seconds
    },
}
celery_app.conf.timezone = 'UTC'

@celery_app.task
def cleanup_inboxes():
    db = SessionLocal()
    try:
        from models import Inbox
        import datetime
        now = datetime.datetime.utcnow()
        expired_inboxes = db.query(Inbox).filter(Inbox.expires_at < now).all()
        
        count = 0
        for inbox in expired_inboxes:
            db.delete(inbox)
            count += 1
            
        if count > 0:
            db.commit()
            print(f"Cleaned up {count} expired inboxes.")
    except Exception as e:
        print(f"Error cleaning up inboxes: {e}")
        db.rollback()
    finally:
        db.close()
