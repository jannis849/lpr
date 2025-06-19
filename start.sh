#!/bin/sh
python -m http.server 80 --directory /app/frontend/build &
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
