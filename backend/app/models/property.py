from app import db
from datetime import datetime

class Property(db.Model):
    __tablename__ = 'properties'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    zip = db.Column(db.String(20), nullable=False)
    property_type = db.Column(db.String(50), nullable=False)  # residential, commercial, vacation, etc.
    status = db.Column(db.String(20), default='active')  # active, vacant, maintenance, inactive
    purchase_date = db.Column(db.Date, nullable=True)
    purchase_price = db.Column(db.Float, nullable=True)
    current_value = db.Column(db.Float, nullable=True)
    bedrooms = db.Column(db.Integer, nullable=True)
    bathrooms = db.Column(db.Float, nullable=True)  # Float to handle 1.5, 2.5 etc.
    square_footage = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
   
    # Define relationship with user (single owner only in open source)
    user = db.relationship('User', back_populates='properties')
    documents = db.relationship('Document', back_populates='property', cascade='all, delete-orphan')
    maintenance_requests = db.relationship('Maintenance', back_populates='property', cascade='all, delete-orphan')
    appliances = db.relationship('Appliance', back_populates='property', cascade='all, delete-orphan')
    projects = db.relationship('Project', back_populates='property', cascade='all, delete-orphan')
    expenses = db.relationship('Expense', back_populates='property', cascade='all, delete-orphan')
    budgets = db.relationship('Budget', back_populates='property', cascade='all, delete-orphan')
    is_primary_residence = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<Property {self.id}: {self.address}>'