#!/usr/bin/env python3
"""
Script to seed demo accounts for PropertyPal Core demo mode
Creates multiple demo accounts with sample data for testing
"""

import os
import sys
from datetime import datetime, timedelta
from app import create_app, db
from app.models.user import User
from app.models.property import Property
from config import DemoConfig

# Demo accounts configuration
DEMO_ACCOUNTS = [
    {
        'email': 'demo@propertypal.com',
        'password': 'Demo123!',
        'first_name': 'Demo',
        'last_name': 'User',
        'property': {
            'address': '123 Maple Street',
            'city': 'Springfield',
            'state': 'IL',
            'zip': '62701',
            'property_type': 'Single Family',
            'bedrooms': 3,
            'bathrooms': 2,
            'square_footage': 1800,
            'purchase_price': 250000,
            'purchase_date': '2020-03-15'
        }
    },
    {
        'email': 'demo2@propertypal.com',
        'password': 'Demo123!',
        'first_name': 'Jane',
        'last_name': 'Smith',
        'property': {
            'address': '456 Oak Avenue',
            'city': 'Portland',
            'state': 'OR',
            'zip': '97201',
            'property_type': 'Condo',
            'bedrooms': 2,
            'bathrooms': 2,
            'square_footage': 1200,
            'purchase_price': 320000,
            'purchase_date': '2021-06-20'
        }
    },
    {
        'email': 'demo3@propertypal.com',
        'password': 'Demo123!',
        'first_name': 'Mike',
        'last_name': 'Johnson',
        'property': {
            'address': '789 Pine Road',
            'city': 'Austin',
            'state': 'TX',
            'zip': '78701',
            'property_type': 'Townhouse',
            'bedrooms': 4,
            'bathrooms': 3,
            'square_footage': 2400,
            'purchase_price': 385000,
            'purchase_date': '2019-11-10'
        }
    }
]

def seed_demo_accounts(silent=False):
    """Seed demo accounts with sample property data"""

    def log(msg):
        if not silent:
            print(msg)

    log("Starting demo account seeding...")
    created_count = 0

    for user_data in DEMO_ACCOUNTS:
        # Check if user already exists
        existing_user = User.query.filter_by(email=user_data['email']).first()
        if existing_user:
            log(f"User {user_data['email']} already exists, skipping...")
            continue

        # Create user
        user = User(
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            email_verified=True
        )
        user.password = user_data['password']
        db.session.add(user)
        db.session.flush()

        log(f"Created user: {user_data['email']}")

        # Create property for user
        p = user_data['property']
        property = Property(
            user_id=user.id,
            address=p['address'],
            city=p['city'],
            state=p['state'],
            zip=p['zip'],
            property_type=p['property_type'],
            bedrooms=p.get('bedrooms'),
            bathrooms=p.get('bathrooms'),
            square_footage=p.get('square_footage'),
            purchase_price=p.get('purchase_price'),
            purchase_date=datetime.strptime(p['purchase_date'], '%Y-%m-%d').date() if p.get('purchase_date') else None
        )
        db.session.add(property)
        log(f"  - Created property: {p['address']}")

        created_count += 1

    db.session.commit()

    log(f"\n✅ Successfully seeded {created_count} demo accounts!")
    log("\nDemo Account Credentials:")
    log("-" * 60)
    for account in DEMO_ACCOUNTS:
        log(f"  Email: {account['email']}")
        log(f"  Password: {account['password']}")
        log("-" * 60)

    return created_count


if __name__ == '__main__':
    app = create_app(DemoConfig)

    with app.app_context():
        try:
            db.create_all()
            seed_demo_accounts()
            print("Demo seeding completed successfully!")
            sys.exit(0)
        except Exception as e:
            print(f"Error seeding demo accounts: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
