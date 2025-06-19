# lpr


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
=======
lpr is huge. Dieses Repository enthält ein kleines FastAPI-Backend und ein React/Tailwind-Frontend.

## Installation

### Backend

1. Virtuelle Umgebung einrichten

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   ```

2. Abhängigkeiten installieren

   ```bash
   pip install fastapi uvicorn python-dotenv azure-cosmos stripe passlib[bcrypt] python-jose
   ```

3. `.env.example` nach `.env` kopieren und die Werte anpassen.

4. API starten

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend

1. Abhängigkeiten installieren

   ```bash
   cd frontend
   npm install
   ```

2. Entwicklungsserver starten

   ```bash
   npm start
   ```

Das Frontend erwartet den Backend-Endpunkt standardmäßig unter `http://localhost:8000`.

## Deployment auf Azure

1. Eine Azure Web App erstellen (z.B. über das Azure Portal oder die `az` CLI).
2. Die Umgebungsvariablen der Web App entsprechend den Angaben in `.env.example` setzen (COSMOS_ENDPOINT, COSMOS_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SECRET_KEY usw.).
3. Den Inhalt des Verzeichnisses `backend` deployen, z.B. mit

   ```bash
   az webapp up --runtime "PYTHON|3.12" --name <APP_NAME> --resource-group <RESOURCE_GROUP> --src-path backend
   ```

4. Optional kann das React-Frontend als Azure Static Web App oder über einen separaten Web App Service betrieben werden. Die API-URLs im Frontend müssen dann auf die öffentliche Azure-URL geändert werden.
