# Build minimal, secure container for Momo Loyalty FastAPI backend
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install dependencies in a separate layer for Docker cache efficiency
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source files
COPY . .

# Run as an unprivileged non-root user for security
RUN addgroup --system --gid 10001 appgroup && \
    adduser --system --uid 10001 --gid 10001 --no-create-home appuser && \
    chown -R appuser:appgroup /app

USER appuser

# Expose FastAPI default port
EXPOSE 8000

# Built-in lightweight health check using Python standard library (no curl needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Launch production ASGI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

