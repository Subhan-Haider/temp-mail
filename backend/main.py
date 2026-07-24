import os
import uuid
import json
import zipfile
import csv
import datetime
import random
import string
import bleach
from typing import List
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import Job, Inbox, Message
from schemas import (
    GenerateRequest, JobResponse,
    InboxResponse, InboxDetail, MessageDetail, CustomInboxRequest,
    CreateInboxRequest
)
from worker import generate_data_task
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.security.api_key import APIKeyHeader
from generator import generate_record
from faker import Faker

API_KEY = os.getenv("API_KEY", "sk_test_12345")
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

def get_api_key(api_key_header: str = Security(api_key_header)):
    if not api_key_header or api_key_header.replace("Bearer ", "") != API_KEY:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key_header

limiter = Limiter(key_func=get_remote_address)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Synthetic Data Generator API",
    description="A powerful API for instantly generating localized synthetic data and triggering massive background generation jobs.",
    version="1.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["System"], summary="Health Check")
@limiter.limit("10/minute")
def read_root(request: Request):
    return {"message": "Welcome to the Synthetic Data Generator API"}

@app.post("/generate", response_model=JobResponse, tags=["Generation"], summary="Start Async Generation Job")
@limiter.limit("100/minute")
def generate_data(request: Request, body: GenerateRequest, db: Session = Depends(get_db)):
    job_id = str(uuid.uuid4())
    
    new_job = Job(
        id=job_id,
        status="pending",
        progress=0.0,
        total_records=body.num_records,
        output_format=body.output_format
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # Send to Celery worker
    generate_data_task.delay(
        job_id=job_id,
        num_records=body.num_records,
        output_format=body.output_format,
        locale=body.locale,
        fields=body.fields,
        age_range=body.age_range,
        random_seed=body.random_seed,
        country_specific=body.country_specific,
        webhook_url=body.webhook_url
    )
    
    return new_job

@app.post("/api/v1/generate-instant", tags=["Generation"], summary="Instant Sync Generation")
@limiter.limit("100/minute")
def generate_instant(request: Request, body: GenerateRequest, api_key: str = Depends(get_api_key)):
    if body.num_records > 5000:
        raise HTTPException(status_code=400, detail="Instant generation is limited to 5000 records. Use /generate for larger datasets.")
        
    if body.random_seed is not None:
        Faker.seed(body.random_seed)
        
    fake = Faker(body.locale)
    
    records = []
    for _ in range(body.num_records):
        record = generate_record(fake, body.fields, body.age_range, body.country_specific)
        records.append(record)
        
    return {"data": records}

PRESETS = {
    "identity": ["First Name", "Last Name", "Email", "Phone", "Job Title", "SSN"],
    "address": ["Address", "City", "State", "Zip Code", "Country"],
    "company": ["Company Name", "Catchphrase", "Industry", "Website"]
}

@app.get("/api/v1/{entity_type}", tags=["Simple Presets"], summary="Generate Preset Entity")
@limiter.limit("100/minute")
def generate_simple_get(
    request: Request, 
    entity_type: str, 
    count: int = 1, 
    locale: str = "en_US", 
    api_key: str = Depends(get_api_key)
):
    if entity_type not in PRESETS:
        raise HTTPException(status_code=400, detail=f"Invalid entity type. Supported types: {', '.join(PRESETS.keys())}")
        
    if count < 1 or count > 5000:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 5000")
        
    fake = Faker(locale)
    fields = PRESETS[entity_type]
    
    records = []
    for _ in range(count):
        record = generate_record(fake, fields, (18, 90), None)
        records.append(record)
        
    # If count is 1, return a single object, otherwise return an array
    if count == 1:
        return records[0]
    return {"data": records}

@app.get("/jobs", response_model=list[JobResponse], tags=["Jobs"], summary="List All Jobs")
def get_jobs(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return jobs

@app.get("/jobs/{job_id}", response_model=JobResponse, tags=["Jobs"], summary="Get Job Details")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/download/{job_id}", tags=["Jobs"], summary="Download Job File")
def download_data(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job is not completed yet")
        
    if not job.file_path or not os.path.exists(job.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    ext = job.file_path.split('.')[-1]
    media_types = {
        "zip": "application/zip",
        "csv": "text/csv",
        "json": "application/json",
        "sql": "application/sql",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    
    return FileResponse(
        path=job.file_path,
        filename=os.path.basename(job.file_path),
        media_type=media_types.get(ext, "application/octet-stream")
    )

@app.get("/jobs/{job_id}/preview", tags=["Jobs"], summary="Preview Generated File")
def preview_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.file_path or not os.path.exists(job.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    ext = job.file_path.split('.')[-1]
    is_zip = ext == "zip"
    
    try:
        if is_zip:
            with zipfile.ZipFile(job.file_path, 'r') as zf:
                name = zf.namelist()[0]
                inner_ext = name.split('.')[-1]
                with zf.open(name) as f:
                    content = f.read(1024 * 50).decode('utf-8', errors='ignore') # Read first 50KB
        else:
            inner_ext = ext
            # Excel files are hard to preview raw, so we skip them
            if inner_ext == 'xlsx':
                return {"format": "xlsx", "content": "Preview not available for Excel files. Please download to view.", "columns": [], "rows": []}
                
            with open(job.file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(1024 * 50) # Read first 50KB
                
        # Parse content based on extension
        lines = content.split('\n')
        
        if inner_ext == 'csv':
            reader = csv.reader(lines)
            data = list(reader)
            if not data:
                return {"format": "csv", "columns": [], "rows": []}
            columns = data[0]
            rows = data[1:101]
            return {"format": "csv", "columns": columns, "rows": rows}
            
        elif inner_ext == 'json':
            # JSON might be an array, try to parse it if valid, otherwise return raw string
            try:
                # We might have cut off the end of the JSON array, try to fix it
                if content.strip().startswith('['):
                    last_brace = content.rfind('}')
                    if last_brace != -1:
                        valid_json = content[:last_brace+1] + ']'
                        data = json.loads(valid_json)
                        if isinstance(data, list) and len(data) > 0:
                            columns = list(data[0].keys())
                            rows = [[str(row.get(col, '')) for col in columns] for row in data[:100]]
                            return {"format": "json", "columns": columns, "rows": rows}
            except:
                pass
            
            # Fallback to raw text
            preview_text = '\n'.join(lines[:100])
            return {"format": "raw", "content": preview_text}
            
        else:
            # SQL or anything else
            preview_text = '\n'.join(lines[:100])
            return {"format": "raw", "content": preview_text}
            
    except Exception as e:
        print(f"Error previewing file: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate preview")

@app.delete("/jobs/{job_id}", tags=["Jobs"], summary="Delete Single Job")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.file_path and os.path.exists(job.file_path):
        try:
            os.remove(job.file_path)
        except Exception as e:
            print(f"Failed to delete file: {e}")
            
    db.delete(job)
    db.commit()
    return {"status": "success", "message": "Job deleted"}

class BulkDeleteRequest(BaseModel):
    job_ids: List[str]

@app.post("/jobs/bulk-delete", tags=["Jobs"], summary="Bulk Delete Jobs")
def bulk_delete_jobs(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.id.in_(request.job_ids)).all()
    
    for job in jobs:
        if job.file_path and os.path.exists(job.file_path):
            try:
                os.remove(job.file_path)
            except Exception as e:
                print(f"Error removing file {job.file_path}: {e}")
        db.delete(job)
        
    db.commit()
    return {"status": "success", "deleted_count": len(jobs)}

# ==========================================
# TEMP MAIL ENDPOINTS
# ==========================================

DOMAINS = [d.strip() for d in os.getenv("DOMAINS", "tempmail.local,ghostmail.example.com").split(',')]
INBOX_EXPIRATION_MINUTES = int(os.getenv("INBOX_EXPIRATION_MINUTES", "60"))

def generate_random_string(length: int = 10) -> str:
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for i in range(length))

@app.get("/domains", tags=["Inboxes"], summary="Get list of available domains")
def get_domains():
    return {"domains": DOMAINS}

@app.post("/create-inbox", response_model=InboxResponse, tags=["Inboxes"], summary="Create a new disposable inbox")
@limiter.limit("10/minute")
def create_inbox(request: Request, body: CreateInboxRequest = None, db: Session = Depends(get_db)):
    username = generate_random_string()
    
    domain = DOMAINS[0]
    if body and body.domain and body.domain in DOMAINS:
        domain = body.domain
        
    email_address = f"{username}@{domain}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=INBOX_EXPIRATION_MINUTES)
    inbox = Inbox(email_address=email_address, expires_at=expires_at)
    db.add(inbox)
    db.commit()
    db.refresh(inbox)
    return inbox

@app.post("/create-inbox/custom", response_model=InboxResponse, tags=["Inboxes"], summary="Create a custom vanity inbox")
@limiter.limit("5/minute")
def create_custom_inbox(request: Request, body: CustomInboxRequest, db: Session = Depends(get_db)):
    username = ''.join(c for c in body.username if c.isalnum() or c == '.').lower()[:30]
    if not username:
        raise HTTPException(status_code=400, detail="Invalid username")
        
    domain = DOMAINS[0]
    if body.domain and body.domain in DOMAINS:
        domain = body.domain
        
    email_address = f"{username}@{domain}"
    existing = db.query(Inbox).filter(Inbox.email_address == email_address).first()
    if existing:
        if existing.expires_at > datetime.datetime.utcnow():
            raise HTTPException(status_code=400, detail="This email address is currently in use")
        else:
            db.delete(existing)
            db.commit()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=INBOX_EXPIRATION_MINUTES)
    inbox = Inbox(email_address=email_address, expires_at=expires_at)
    db.add(inbox)
    db.commit()
    db.refresh(inbox)
    return inbox

@app.get("/inbox/{inbox_id}", response_model=InboxDetail, tags=["Inboxes"], summary="Fetch messages for an inbox")
@limiter.limit("60/minute")
def get_inbox(request: Request, inbox_id: str, db: Session = Depends(get_db)):
    inbox = db.query(Inbox).filter(Inbox.id == inbox_id).first()
    if not inbox:
        raise HTTPException(status_code=404, detail="Inbox not found")
    if inbox.expires_at < datetime.datetime.utcnow():
        db.delete(inbox)
        db.commit()
        raise HTTPException(status_code=404, detail="Inbox has expired")
    return inbox

@app.get("/message/{message_id}", response_model=MessageDetail, tags=["Messages"], summary="Read a specific message")
@limiter.limit("120/minute")
def get_message(request: Request, message_id: str, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.inbox.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=404, detail="Inbox has expired")
    if message.body_html:
        allowed_tags = bleach.ALLOWED_TAGS.copy()
        allowed_tags.extend(['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'style', 'img'])
        allowed_attributes = bleach.ALLOWED_ATTRIBUTES.copy()
        allowed_attributes['*'] = ['style', 'class']
        allowed_attributes['img'] = ['src', 'alt', 'width', 'height']
        message.body_html = bleach.clean(
            message.body_html,
            tags=allowed_tags,
            attributes=allowed_attributes,
            strip=True
        )
    return message

@app.put("/inbox/{inbox_id}/extend", response_model=InboxResponse, tags=["Inboxes"], summary="Extend inbox expiration by 30 minutes")
@limiter.limit("10/minute")
def extend_inbox(request: Request, inbox_id: str, db: Session = Depends(get_db)):
    inbox = db.query(Inbox).filter(Inbox.id == inbox_id).first()
    if not inbox:
        raise HTTPException(status_code=404, detail="Inbox not found")
        
    inbox.expires_at = inbox.expires_at + datetime.timedelta(minutes=30)
    db.commit()
    db.refresh(inbox)
    return inbox

@app.delete("/inbox/{inbox_id}", tags=["Inboxes"], summary="Delete an inbox manually")
@limiter.limit("10/minute")
def delete_inbox(request: Request, inbox_id: str, db: Session = Depends(get_db)):
    inbox = db.query(Inbox).filter(Inbox.id == inbox_id).first()
    if inbox:
        db.delete(inbox)
        db.commit()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
