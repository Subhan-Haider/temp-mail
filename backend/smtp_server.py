import asyncio
import os
import email
from email.message import Message as EmailMessage
from email.policy import default
from aiosmtpd.controller import Controller
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Inbox, Message

class TempMailHandler:
    async def handle_DATA(self, server, session, envelope):
        print(f"Receiving message from: {envelope.mail_from}")
        print(f"Message for: {envelope.rcpt_tos}")
        
        # Parse the email
        msg = email.message_from_bytes(envelope.content, policy=default)
        
        # Extract fields
        sender = envelope.mail_from
        subject = msg.get('subject', '(No Subject)')
        
        # Extract body
        body = ""
        body_html = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get('Content-Disposition'))
                
                if 'attachment' not in content_disposition:
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            decoded = payload.decode(errors='ignore')
                            if content_type == 'text/plain':
                                body += decoded
                            elif content_type == 'text/html':
                                body_html += decoded
                    except Exception as e:
                        print(f"Error decoding part: {e}")
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                decoded = payload.decode(errors='ignore')
                if msg.get_content_type() == 'text/html':
                    body_html = decoded
                else:
                    body = decoded
                    
        # Add to database for each valid recipient
        db = SessionLocal()
        try:
            for rcpt in envelope.rcpt_tos:
                rcpt_lower = rcpt.lower()
                
                # Find inbox
                inbox = db.query(Inbox).filter(Inbox.email_address == rcpt_lower).first()
                if inbox:
                    print(f"Saving message to inbox: {rcpt_lower}")
                    new_msg = Message(
                        inbox_id=inbox.id,
                        sender=sender,
                        subject=subject,
                        body=body,
                        body_html=body_html
                    )
                    db.add(new_msg)
                else:
                    print(f"Inbox not found for: {rcpt_lower}")
                    
            db.commit()
        except Exception as e:
            print(f"Database error: {e}")
            db.rollback()
        finally:
            db.close()
            
        return '250 Message accepted for delivery'

if __name__ == '__main__':
    port = int(os.getenv("SMTP_PORT", "2525"))
    handler = TempMailHandler()
    controller = Controller(handler, hostname='0.0.0.0', port=port)
    
    print(f"Starting Mock SMTP Server on port {port}...")
    controller.start()
    
    # Keep the main thread alive
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print("Stopping Mock SMTP Server...")
    finally:
        controller.stop()
