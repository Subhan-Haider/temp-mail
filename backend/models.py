from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    progress = Column(Float, default=0.0)
    total_records = Column(Integer, default=0)
    output_format = Column(String)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(String, nullable=True)

class Inbox(Base):
    __tablename__ = "inboxes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email_address = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    messages = relationship("Message", back_populates="inbox", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    inbox_id = Column(String, ForeignKey("inboxes.id"), index=True)
    sender = Column(String, nullable=False)
    subject = Column(String, default="(No Subject)")
    body = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    
    inbox = relationship("Inbox", back_populates="messages")
