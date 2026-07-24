# Synthetic Data Generator

A modern, full-stack web application that generates large amounts of synthetic (fictional) personal data for software development, testing, QA, demos, and database seeding. 

> **Disclaimer:** All generated data is for testing purposes only and is not verified or intended to represent real people.

## Features
- **Scalable Generation:** Generate from 100 to 10,000,000+ records efficiently using background workers.
- **Multiple Exporters:** Export to CSV, JSON, SQL, and XLSX formats.
- **Large File Support:** Data is streamed directly to disk in chunks to minimize memory usage, and final files are compressed into `.zip` archives for fast downloads.
- **Modern Dashboard:** React/Next.js dashboard with a dark/light mode UI, live progress tracking, and job history.
- **Customizable:** Choose the number of records, specific fields (Names, Address, DOB, etc.), Locales (US, CA, UK, AU), and Age Ranges.
- **Reproducible:** Provide a random seed to generate identical datasets across runs.

## Architecture & Tech Stack
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Axios.
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, Faker.
- **Queue/Workers:** Celery, Redis.
- **Database:** PostgreSQL.
- **Infrastructure:** Docker & Docker Compose.

---

## Installation Guide (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python (3.10+)

### 1. Start Infrastructure & Backend
Use Docker Compose to spin up PostgreSQL, Redis, the FastAPI Backend, and the Celery Worker.

```bash
docker-compose up --build -d
```
*The backend API will be available at `http://localhost:8000`.*

### 2. Start Frontend
In a new terminal, navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```
*The web dashboard will be available at `http://localhost:3000`.*

---

## API Documentation

The backend exposes a REST API built with FastAPI. Full interactive documentation is available at `http://localhost:8000/docs` when the server is running.

### 1. Trigger Data Generation
`POST /generate`

**Request Body:**
```json
{
  "num_records": 1000,
  "output_format": "csv",
  "locale": "en_US",
  "fields": ["First Name", "Last Name", "City", "Country"],
  "age_range": [18, 90],
  "random_seed": 42
}
```

**Response:**
```json
{
  "id": "abc-123",
  "status": "pending",
  "progress": 0,
  "total_records": 1000,
  "output_format": "csv",
  "created_at": "2026-07-24T12:00:00Z"
}
```

### 2. List Jobs
`GET /jobs?skip=0&limit=10`

### 3. Get Job Status
`GET /jobs/{job_id}`

### 4. Download File
`GET /download/{job_id}`
Returns the `.zip` archive containing the generated file. Only works if job `status` is `completed`.

### 5. Delete Job
`DELETE /jobs/{job_id}`
Deletes the job record from the database and removes the associated files from the disk.

---

## Quality Requirements Met
- **Modular Architecture:** Frontend and Backend are decoupled.
- **Clean Code:** Strongly typed APIs with Pydantic and TypeScript.
- **Error Handling:** Backend returns appropriate HTTP codes; Frontend alerts on failures.
- **Loading Indicators:** The frontend displays active polling progress bars and "Starting..." spinners.
- **Responsive Design:** Dashboard is fully mobile-friendly via Tailwind.

---

## Server Deployment (Production)

This project is fully dockerized and ready to be deployed to a live server. Because it includes a custom SMTP server for Temp Mail, you must perform specific DNS configurations for it to work.

### 1. Configure DNS Records
Go to your domain registrar (e.g. GoDaddy, Cloudflare, Namecheap) and configure the following records so that emails are routed to your server:

1. **A Record**:
   - **Name**: `mail`
   - **Value**: `YOUR_SERVER_IP`
2. **MX Record**:
   - **Name**: `@`
   - **Value**: `mail.yourdomain.com`
   - **Priority**: `10`

### 2. Configure Environment Variables
Before starting the containers, update your `docker-compose.yml`:
1. Under the `frontend` service, change `NEXT_PUBLIC_API_URL=http://your-server-ip:8000` to point to your actual server's IP address or domain name.
2. Under the `backend` and `worker` services, change `DOMAINS=tempmail.local,ghostmail.example.com` to include your actual domain names.

### 3. Unblock Port 25
**CRITICAL**: Most cloud providers (AWS, DigitalOcean, Vultr, Google Cloud) block incoming traffic on **Port 25** by default to prevent spam. You MUST open a support ticket with your hosting provider and ask them to unblock port 25 for your server so you can receive emails!

### 4. Run Docker Compose
Once DNS is propagated and Port 25 is unblocked, run:

```bash
docker compose up -d --build
```

This will spin up:
- Postgres Database (Port 5432)
- Redis Cache (Port 6379)
- FastAPI Backend (Port 8000)
- Mock SMTP Server (Port 25)
- Next.js Frontend Dashboard (Port 3000)
- Celery Background Worker & Scheduler
