# lpr

This repository contains a React frontend and a FastAPI backend.

## Build the Frontend

```
cd frontend
npm install
npm run build
```

The compiled files will be generated in `frontend/build`.

## Start the Backend

After installing the Python dependencies you can run the API with Uvicorn:

```
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

## Docker

A `Dockerfile` is provided to build an image containing both the backend and the
pre-built frontend. The container exposes port `8000` for the API and port `80`
for the static frontend.

Build and run the container:

```
docker build -t lpr-app .
docker run -p 8000:8000 -p 80:80 lpr-app
```
