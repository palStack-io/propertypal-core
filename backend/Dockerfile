FROM python:3.9-bookworm

WORKDIR /app

# Set environment variables for Python behavior
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create the improved init_db.sh script
RUN echo '#!/bin/bash \n\
set -e \n\
cd /app \n\
echo "Checking database migration state..." \n\
# First, try to clean up the alembic_version table directly \n\
PGPASSWORD=$POSTGRES_PASSWORD psql -h $DATABASE_HOST -p ${DATABASE_PORT:-5432} -U $POSTGRES_USER -d $POSTGRES_DB -c "DROP TABLE IF EXISTS alembic_version;" || echo "Couldn'\''t drop alembic_version table, continuing..." \n\
echo "Removing any existing migrations..." \n\
rm -rf migrations \n\
echo "Initializing fresh migrations..." \n\
flask db init \n\
# Create empty initial migration to match current state \n\
echo "Creating initial migration that matches current database state..." \n\
flask db migrate --message "Initial schema creation" \n\
# Mark it as applied without making any actual changes to the database \n\
echo "Marking migration as applied..." \n\
flask db stamp head \n\
echo "Migration reset complete!" \n\
' > /app/init_db.sh && chmod +x /app/init_db.sh

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install gunicorn

# Copy the entrypoint script (this will be overridden by the actual file copy later)
COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

# Create upload directories with proper permissions
RUN mkdir -p /app/uploads/documents/photos && \
    chmod -R 755 /app/uploads


COPY reset_app.py /app/reset_app.py
RUN chmod +x /app/reset_app.py

# Copy the application code
COPY . .

# Create a volume for persistent data
VOLUME ["/app/uploads"]

# Expose the application port
EXPOSE 5008

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:5008/ || exit 1

# Use entrypoint script to handle initialization
ENTRYPOINT ["/app/entrypoint.sh"]