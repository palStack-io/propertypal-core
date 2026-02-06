# models/document.py
from app import db
from datetime import datetime

class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey('properties.id'), nullable=True)
    appliance_id = db.Column(db.Integer, db.ForeignKey('appliances.id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    category = db.Column(db.String(50), nullable=False)
    expiration_date = db.Column(db.Date, nullable=True)  # For documents that expire (leases, IDs)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='documents')
    property = db.relationship('Property', back_populates='documents')
    appliance = db.relationship('Appliance', back_populates='documents')

    def __repr__(self):
        return f'<Document {self.id}: {self.title}>'