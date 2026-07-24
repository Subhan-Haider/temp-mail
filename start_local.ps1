# start_local.ps1

Write-Host "Installing Backend Dependencies..."
cd backend
python -m pip install -r requirements.txt
python -m pip install celery[sqlalchemy]

Write-Host "Starting Celery Worker in background..."
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd backend; .\venv\Scripts\activate; python -m celery -A worker.celery_app worker --loglevel=info -B --pool=solo`""

Write-Host "Starting Mock SMTP Server (Port 2525)..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd backend; .\venv\Scripts\activate; python smtp_server.py`""

Write-Host "Starting FastAPI Backend in background..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd backend; .\venv\Scripts\activate; python -m uvicorn main:app --host 127.0.0.1 --port 8000`""

cd ..

Write-Host "Installing Frontend Dependencies..."
cd frontend
npm install

Write-Host "Starting Next.js Frontend..."
npm run dev
