import os
from datetime import timedelta

class Config:
    """Base config that other configs inherit from"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-should-change-this-in-production'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Demo mode settings
    DEMO_MODE = os.environ.get('DEMO_MODE', 'false').lower() == 'true'
    DEMO_SESSION_TIMEOUT = int(os.environ.get('DEMO_SESSION_TIMEOUT', 600))  # 10 minutes default

    # Email verification override (for dev/demo)
    SKIP_EMAIL_VERIFICATION = os.environ.get('SKIP_EMAIL_VERIFICATION', 'false').lower() == 'true'

    # File upload settings
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 200 * 1024 * 1024  # 200MB max upload size
    
    # Email settings
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'false').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or 'support@palstack.io'
    
    # AWS S3 settings for document storage
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_REGION = os.environ.get('AWS_REGION') or 'us-east-1'
    S3_BUCKET = os.environ.get('S3_BUCKET') or 'propertypal-documents'

    # for emails 
    FRONTEND_URL = os.environ.get('FRONTEND_URL') or 'http://localhost:3000'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
    # Check if we're running in Docker or local environment
    if os.environ.get('IN_DOCKER'):
        # In Docker, use the Docker service name
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
            'postgresql://propertypal:propertypal@db:5432/propertypal'
    else:
        # In local environment, use SQLite
        basedir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
            'sqlite:///' + os.path.join(basedir, 'app.db')
    
    # Use local file storage instead of S3 in development
    USE_S3 = False


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    # Use PostgreSQL for testing too
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'postgresql://propertypal:propertypal@db:5432/propertypal_test'
    JWT_SECRET_KEY = 'testing-jwt-secret-key'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    USE_S3 = True


class DemoConfig(Config):
    """Demo configuration - like production but with demo mode enabled"""
    DEBUG = False
    DEMO_MODE = True
    SKIP_EMAIL_VERIFICATION = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=10)  # Short session for demo
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://propertypal:propertypal@db:5432/propertypal_demo'
    USE_S3 = False  # Use local storage for demo