# ==========================================
# Stage 1: Build the React (Vite) Frontend
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Stage 2: Python FastAPI Application Server
# ==========================================
FROM python:3.12-slim AS runner
WORKDIR /app

# Install system utilities if needed
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code
COPY backend ./backend

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Set environment variables
ENV HOST=0.0.0.0 \
    PORT=8000 \
    STATIC_DIR=/app/dist \
    PYTHONUNBUFFERED=1

EXPOSE 8000

# Run FastAPI with Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
