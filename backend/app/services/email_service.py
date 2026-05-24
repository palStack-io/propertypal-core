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
    
    subject = "Reset your propertyPal password"
    recipients = [user.email]

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #38bdf8;">property</span><span style="font-size: 24px; font-weight: 800; color: #ffffff;">Pal</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #f1f5f9;">Reset your password</h2>
      <p style="color: #94a3b8; margin-bottom: 24px;">Hi {user.first_name or 'there'}, we received a request to reset your propertyPal password. Click the button below — this link expires in 60 minutes.</p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="{reset_url}" style="display: inline-block; background: #38bdf8; color: #0f172a; font-weight: 700; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #475569; font-size: 12px; text-align: center;">propertyPal · Part of the <a href="https://palstack.io" style="color: #38bdf8;">palStack</a> ecosystem</p>
    </div>
    """
    
    send_email(subject, recipients, html_body)


def send_welcome_email(user):
    """Send welcome email to newly registered user"""
    subject = "Welcome to propertyPal!"
    recipients = [user.email]

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #38bdf8;">property</span><span style="font-size: 24px; font-weight: 800; color: #ffffff;">Pal</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #f1f5f9;">Welcome, {user.first_name or 'there'}!</h2>
      <p style="color: #94a3b8; margin-bottom: 16px;">Your propertyPal account is ready. Here's what you can do:</p>
      <ul style="color: #94a3b8; padding-left: 20px; margin-bottom: 24px; line-height: 1.8;">
        <li>Track all your properties in one place</li>
        <li>Manage maintenance requests &amp; seasonal checklists</li>
        <li>Store important documents securely</li>
        <li>Track expenses, budgets &amp; generate reports</li>
      </ul>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #475569; font-size: 12px; text-align: center;">propertyPal · Part of the <a href="https://palstack.io" style="color: #38bdf8;">palStack</a> ecosystem</p>
    </div>
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
    
    subject = "Verify your propertyPal email"
    recipients = [user.email]

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #38bdf8;">property</span><span style="font-size: 24px; font-weight: 800; color: #ffffff;">Pal</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #f1f5f9;">Verify your email</h2>
      <p style="color: #94a3b8; margin-bottom: 24px;">Hi {user.first_name or 'there'}, click the button below to verify your email address. This link expires in 24 hours.</p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="{verification_url}" style="display: inline-block; background: #38bdf8; color: #0f172a; font-weight: 700; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">Verify Email</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">If you didn't create a propertyPal account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #475569; font-size: 12px; text-align: center;">propertyPal · Part of the <a href="https://palstack.io" style="color: #38bdf8;">palStack</a> ecosystem</p>
    </div>
    """
    
    send_email(subject, recipients, html_body)