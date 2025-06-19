# Build frontend
FROM node:20 AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Final image
FROM python:3.11-slim
WORKDIR /app
# install backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
# copy backend code
COPY backend/ ./backend
# copy built frontend
COPY --from=frontend-builder /frontend/build ./frontend/build
# copy start script
COPY start.sh ./start.sh
RUN chmod +x start.sh
EXPOSE 80 8000
CMD ["./start.sh"]
