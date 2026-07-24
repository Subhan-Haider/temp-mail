from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GenerateRequest(BaseModel):
    num_records: int
    output_format: str  # csv, json, sql, xlsx
    locale: str = "en_US"  # en_US, en_CA, en_GB, en_AU
    fields: List[str]
    age_range: Optional[tuple[int, int]] = (18, 90)
    random_seed: Optional[int] = None
    country_specific: Optional[dict] = None  # e.g., for Canada province/city
    webhook_url: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    status: str
    progress: float
    total_records: int
    output_format: str
    file_path: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    id: str
    sender: str
    subject: str
    received_at: datetime
    
class MessageDetail(MessageBase):
    body: Optional[str] = None
    body_html: Optional[str] = None
    
    class Config:
        from_attributes = True

class MessageList(MessageBase):
    class Config:
        from_attributes = True

class InboxResponse(BaseModel):
    id: str
    email_address: str
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True

class InboxDetail(InboxResponse):
    messages: List[MessageList] = []

class CreateInboxRequest(BaseModel):
    domain: Optional[str] = None

class CustomInboxRequest(BaseModel):
    username: str
    domain: Optional[str] = None
