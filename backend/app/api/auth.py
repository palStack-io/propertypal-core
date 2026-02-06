from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app.models.settings import Settings
from app import db
from app.services.email_service import send_password_reset_email,send_welcome_email,send_verification_email
import secrets
from datetime import datetime, timedelta

# Create blueprint
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user - PropertyPal Core (Single User)

    PropertyPal Core is a single-user application.
    Only the first user (property owner) can register.
    """
    data = request.get_json()

    # Check if required fields are provided
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400

    # Check if email already exists
    existing_user = User.query.filter_by(email=data.get('email')).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409

    # Check user count - only allow first user registration
    existing_user_count = User.query.count()
    if existing_user_count > 0:
        return jsonify({
            "error": "PropertyPal Core is a single-user application. Registration is closed.",
            "single_user_mode": True
        }), 403

    # First user registration - property owner
    new_user = User(
        email=data.get('email'),
        first_name=data.get('first_name', 'Admin'),
        last_name=data.get('last_name', 'User'),
        phone=data.get('phone', ''),
        role='admin',
        is_admin=True,
        email_verified=True  # Auto-verify first user
    )
    new_user.password = data.get('password')

    db.session.add(new_user)
    db.session.commit()

    # Create default settings
    settings = Settings(
        user_id=new_user.id,
        currency='USD',
        date_format='MM/DD/YYYY',
        notifications_enabled=True,
        email_notifications=False
    )
    db.session.add(settings)
    db.session.commit()

    # Auto-login first user by providing tokens
    access_token = create_access_token(identity=str(new_user.id))
    refresh_token = create_refresh_token(identity=str(new_user.id))

    return jsonify({
        "message": "Account created successfully. Please create your property.",
        "user_id": new_user.id,
        "is_first_user": True,
        "requires_property_setup": True,
        "access_token": access_token,
        "refresh_token": refresh_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    data = request.get_json()
    
    # Check if required fields are provided
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    # Check if user exists
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not user.verify_password(data.get('password')):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check if email is verified (skip in development/demo mode or if explicitly disabled)
    skip_verification = current_app.config.get('DEBUG', False) or \
                       current_app.config.get('SKIP_EMAIL_VERIFICATION', False) or \
                       current_app.config.get('DEMO_MODE', False)

    if not skip_verification and not user.email_verified:
        return jsonify({"error": "Please verify your email address before logging in", "email_verified": False}), 401
    
    # Create access and refresh tokens - Convert to string
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email_verified": user.email_verified
        }
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(current_user_id))
    
    return jsonify({
        "access_token": access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user():
    """Get current authenticated user's information"""
    current_user_id = int(get_jwt_identity())

    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Generate a password reset token and send reset email"""
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({"error": "Email is required"}), 400
    
    user = User.query.filter_by(email=data.get('email')).first()
    
    # Always return success message even if email doesn't exist (for security)
    if not user:
        return jsonify({
            "message": "If an account with that email exists, a password reset link has been sent."
        }), 200
    
    # Generate a secure random token
    reset_token = secrets.token_urlsafe(32)
    
    # Set token expiry (60 minutes from now)
    reset_token_expiry = datetime.utcnow() + timedelta(minutes=60)
    
    # Save token to user
    user.reset_token = reset_token
    user.reset_token_expiry = reset_token_expiry
    db.session.commit()
    
    # Generate reset URL - this should be your frontend URL
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Send password reset email
    send_password_reset_email(user, reset_url)
    
    return jsonify({
        "message": "If an account with that email exists, a password reset link has been sent."
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset user password using token"""
    data = request.get_json()
    
    if not data or not data.get('token') or not data.get('password'):
        return jsonify({"error": "Token and new password are required"}), 400
    
    # Find user with this token
    user = User.query.filter_by(reset_token=data.get('token')).first()
    
    # Check if user exists and token is valid/not expired
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        return jsonify({"error": "Invalid or expired reset token"}), 400
    
    # Update password
    user.password = data.get('password')
    
    # Clear reset token and expiry
    user.reset_token = None
    user.reset_token_expiry = None
    
    db.session.commit()
    
    return jsonify({
        "message": "Password has been reset successfully. You can now log in with your new password."
    }), 200

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify user email with token"""
    data = request.get_json()
    
    if not data or not data.get('token'):
        return jsonify({"error": "Verification token is required"}), 400
    
    # Find user with this verification token
    user = User.query.filter_by(verification_token=data.get('token')).first()
    
    # Check if user exists and token is valid/not expired
    if not user or not user.verification_token_expiry or user.verification_token_expiry < datetime.utcnow():
        return jsonify({"error": "Invalid or expired verification token"}), 400
    
    # Mark email as verified
    user.email_verified = True
    
    # Clear verification token and expiry
    user.verification_token = None
    user.verification_token_expiry = None
    
    db.session.commit()
    
    # Now send the welcome email since the user is verified
    send_welcome_email(user)
    
    return jsonify({
        "message": "Email verified successfully. You can now log in to your account."
    }), 200

@auth_bp.route('/demo-status', methods=['GET'])
def demo_status():
    """Check if demo mode is enabled"""
    is_demo = current_app.config.get('DEMO_MODE', False)
    return jsonify({
        "demo_mode": is_demo,
        "demo_accounts": [
            {"email": "demo@propertypal.com", "name": "Demo User"},
            {"email": "demo2@propertypal.com", "name": "Jane Smith"},
            {"email": "demo3@propertypal.com", "name": "Mike Johnson"}
        ] if is_demo else []
    }), 200

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({"error": "Email is required"}), 400
    
    user = User.query.filter_by(email=data.get('email')).first()
    
    # Don't disclose if the email exists or not
    if not user or user.email_verified:
        return jsonify({
            "message": "If your email is registered and not verified, a new verification link has been sent."
        }), 200
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    user.verification_token_expiry = datetime.utcnow() + timedelta(hours=24)
    
    db.session.commit()
    
    # Generate verification URL
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    verification_url = f"{frontend_url}/verify-email?token={verification_token}"
    
    # Send verification email
    send_verification_email(user, verification_url)
    
    return jsonify({
        "message": "If your email is registered and not verified, a new verification link has been sent."
    }), 200