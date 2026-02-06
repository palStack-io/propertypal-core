# services/email_service.py
from flask import current_app, render_template
from flask_mail import Message
from app import mail
import os
from threading import Thread

def send_async_email(app, msg):
    """Send email asynchronously"""
    with app.app_context():
        mail.send(msg)

def send_email(subject, recipients, html_body, sender=None):
    """Send an email"""
    app = current_app._get_current_object()
    msg = Message(subject, 
                 sender=sender or current_app.config['MAIL_DEFAULT_SENDER'],
                 recipients=recipients)
    msg.html = html_body
    
    # Send email asynchronously to not block the request
    Thread(target=send_async_email, args=(app, msg)).start()

def get_frontend_url():
    """Helper function to get the configured frontend URL"""
    return current_app.config.get('FRONTEND_URL', 'http://localhost:3000')

def send_password_reset_email(user, reset_url):
    """Send password reset email to user"""
    # Check if reset_url is a path only and needs the frontend URL
    if reset_url.startswith('/') or not (reset_url.startswith('http://') or reset_url.startswith('https://')):
        frontend_url = get_frontend_url()
        # Ensure we don't have double slashes
        if reset_url.startswith('/') and frontend_url.endswith('/'):
            reset_url = f"{frontend_url[:-1]}{reset_url}"
        else:
            reset_url = f"{frontend_url}{reset_url if reset_url.startswith('/') else '/'+reset_url}"
    
    subject = "Password Reset Request"
    recipients = [user.email]
    
    # Create HTML content for the email
    html_body = f"""
    <h1>Password Reset</h1>
    <p>Hello {user.first_name or 'there'},</p>
    <p>You requested a password reset for your HomieHQ account.</p>
    <p>Please click on the following link to reset your password:</p>
    <p><a href="{reset_url}">Reset your password</a></p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>This link will expire in 60 minutes.</p>
    <p>Thank you,<br>The HomieHQ Team</p>
    """
    
    send_email(subject, recipients, html_body)


def send_welcome_email(user):
    """Send welcome email to newly registered user"""
    subject = "Welcome to HomieHQ!"
    recipients = [user.email]
    
    # Create HTML content for the welcome email
    html_body = f"""
    <h1>Welcome to HomieHQ!</h1>
    <p>Hello {user.first_name or 'there'},</p>
    <p>Thank you for registering with HomieHQ. We're excited to have you on board!</p>
    <p>With HomieHQ, you can:</p>
    <ul>
        <li>Track all your properties in one place</li>
        <li>Manage maintenance requests</li>
        <li>Store important documents securely</li>
        <li>Track expenses and income</li>
        <li>And much more!</li>
    </ul>
    <p>If you have any questions or need help getting started, please don't hesitate to contact our support team.</p>
    <p>Best regards,<br>The HomieHQ Team</p>
    """
    
    send_email(subject, recipients, html_body)

def send_verification_email(user, verification_url):
    """Send email verification link to new user"""
    # Check if verification_url is a path only and needs the frontend URL
    if verification_url.startswith('/') or not (verification_url.startswith('http://') or verification_url.startswith('https://')):
        frontend_url = get_frontend_url()
        # Ensure we don't have double slashes
        if verification_url.startswith('/') and frontend_url.endswith('/'):
            verification_url = f"{frontend_url[:-1]}{verification_url}"
        else:
            verification_url = f"{frontend_url}{verification_url if verification_url.startswith('/') else '/'+verification_url}"
    
    subject = "Verify Your Email for HomieHQ"
    recipients = [user.email]
    
    # Create HTML content for the verification email
    html_body = f"""
    <h1>Email Verification</h1>
    <p>Hello {user.first_name or 'there'},</p>
    <p>Thank you for registering with HomieHQ. To complete your registration, please verify your email:</p>
    <p><a href="{verification_url}">Verify your email address</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not create this account, please ignore this email.</p>
    <p>Best regards,<br>The HomieHQ Team</p>
    """
    
    send_email(subject, recipients, html_body)