FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Copy the built frontend into the space where FastAPI expects it
COPY --from=build-frontend /app/frontend/dist /app/frontend/dist

# Render sets PORT env variable dynamically
ENV PORT=8000
CMD uvicorn api:app --host 0.0.0.0 --port ${PORT}
