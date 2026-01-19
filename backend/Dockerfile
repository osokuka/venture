# Multi-stage Dockerfile for Django application

# Stage 1: Build stage
FROM python:3.12-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy project files
COPY . .

# Create directories for media and static files
RUN mkdir -p /app/media /app/staticfiles /app/static/logos

# Copy logo files if they exist in static/logos (should be pre-resized)
# The logo files should be copied to backend/static/logos/ before building
# Using shell to copy if exists, otherwise skip (logo will be downloaded on startup via entrypoint.sh)
RUN mkdir -p /app/static/logos && \
    if [ -f static/logos/ventureuplink.webp ]; then cp static/logos/ventureuplink.webp /app/static/logos/; fi && \
    if [ -f static/logos/ventureuplink.png ]; then cp static/logos/ventureuplink.png /app/static/logos/; fi || true

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Install netcat for health checks
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Expose port
EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
