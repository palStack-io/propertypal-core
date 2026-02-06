#!/usr/bin/env python3
"""
PropertyPal Open Source - Single User Setup Script

This script is designed for the open-source version of PropertyPal,
which supports only a single admin user. It will:

1. Check if any users exist in the database
2. If no users exist, prompt for admin user creation
3. Create the admin user with full permissions

This should be run after database initialization.
"""

import os
import sys
from getpass import getpass

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.settings import Settings


def check_existing_users():
    """Check if any users already exist in the database."""
    try:
        user_count = User.query.count()
        return user_count > 0
    except Exception as e:
        print(f"Error checking for existing users: {e}")
        return False


def create_admin_user(email, password, first_name=None, last_name=None):
    """Create the single admin user for the application."""
    try:
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"User with email {email} already exists!")
            return None

        # Create new admin user
        user = User(
            email=email,
            first_name=first_name or "Admin",
            last_name=last_name or "User",
            role='admin',
            is_admin=True,
            email_verified=True  # Auto-verify in single-user mode
        )
        user.password = password  # This uses the password setter to hash it

        db.session.add(user)
        db.session.commit()

        # Create default settings for the user
        settings = Settings(
            user_id=user.id,
            currency='USD',
            date_format='MM/DD/YYYY',
            notifications_enabled=True,
            email_notifications=True
        )
        db.session.add(settings)
        db.session.commit()

        print(f"\n✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"\n🎉 You can now log in to PropertyPal!")

        return user

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating admin user: {e}")
        return None


def interactive_setup():
    """Run an interactive setup to create the admin user."""
    print("=" * 60)
    print("  PropertyPal Open Source - Single User Setup")
    print("=" * 60)
    print("\nThis version of PropertyPal supports only ONE admin user.")
    print("Let's create your admin account now.\n")

    # Get user details
    email = input("Enter admin email: ").strip()
    while not email or '@' not in email:
        print("Please enter a valid email address.")
        email = input("Enter admin email: ").strip()

    first_name = input("Enter first name (optional): ").strip()
    last_name = input("Enter last name (optional): ").strip()

    # Get password with confirmation
    while True:
        password = getpass("Enter password: ")
        if len(password) < 6:
            print("Password must be at least 6 characters long.")
            continue

        password_confirm = getpass("Confirm password: ")
        if password != password_confirm:
            print("Passwords don't match. Please try again.")
            continue

        break

    # Create the user
    print("\nCreating admin user...")
    user = create_admin_user(email, password, first_name, last_name)

    if user:
        return True
    else:
        return False


def main():
    """Main setup function."""
    app = create_app()

    with app.app_context():
        # Check if users already exist
        if check_existing_users():
            print("\n⚠️  Users already exist in the database.")
            print("This is a single-user application. Only one admin user is allowed.")
            print("\nIf you need to reset, please use the reset_app.py script.")
            return

        # Run interactive setup
        success = interactive_setup()

        if success:
            print("\n" + "=" * 60)
            print("  Setup Complete!")
            print("=" * 60)
            print("\nYou can now start using PropertyPal.")
            print("Run the application and log in with your credentials.\n")
        else:
            print("\n❌ Setup failed. Please try again.")
            sys.exit(1)


if __name__ == '__main__':
    main()
