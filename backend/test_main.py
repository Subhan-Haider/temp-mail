from fastapi.testclient import TestClient
from main import app
from database import Base, engine

# Make sure tables exist for testing
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Synthetic Data Generator API"}

def test_get_jobs():
    response = client.get("/jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_generate_data_validation_error():
    # Missing required fields like num_records
    response = client.post("/generate", json={
        "output_format": "csv",
        "locale": "en_US",
        "fields": ["First Name"]
    })
    assert response.status_code == 422
