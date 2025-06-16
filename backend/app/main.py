from fastapi import FastAPI, Request, Header, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

import stripe
import os

from app.cosmos_client import (
    get_active_sessions,
    calculate_fee,
    create_payment_intent,
    mark_session_as_paid,
    create_user,
    find_user_by_email,
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)

# 🔧 FastAPI Setup
app = FastAPI()

# 🌐 CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 Stripe-Konfiguration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

# 📦 Pydantic Modelle
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    email: str
    license_plate: Optional[str] = None

# 🚘 Neue Park-Session starten
@app.post("/session")
async def create_session(license_plate: str):
    return create_parking_session(license_plate)

# 🚗 Aktive Parkvorgänge anzeigen
@app.get("/session/active")
async def list_active():
    return get_active_sessions()

# 💶 Gebühren berechnen
@app.get("/session/{session_id}/fee")
async def get_fee(session_id: str):
    fee = calculate_fee(session_id)
    if fee is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return fee

# 💳 Zahlung starten
@app.post("/session/{session_id}/pay")
async def pay_session(session_id: str):
    result = create_payment_intent(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return result

# 📩 Stripe Webhook empfangen
@app.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=stripe_signature, secret=endpoint_secret
        )
    except stripe.error.SignatureVerificationError:
        print("⚠️  Ungültige Stripe-Signatur")
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        session_id = intent["metadata"].get("session_id")
        if session_id:
            mark_session_as_paid(session_id)
            print("✅ Session marked as paid:", session_id)
            return {"status": "ok"}

    print("ℹ️  Webhook empfangen, aber ignoriert:", event["type"])
    return {"status": "ignored"}

# 🔐 Registrierung
@app.post("/register", response_model=UserOut)
def register(user: UserCreate):
    existing = find_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(user.password)
    user_data = {
        "id": user.email,
        "email": user.email,
        "password_hash": hashed,
        "license_plate": None,
        "stripe_customer_id": None
    }
    create_user(user_data)
    return user_data

# 🔐 Login
@app.post("/login")
def login(user: UserLogin):
    db_user = find_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user["email"]})
    return {"access_token": token, "token_type": "bearer"}

# 🔐 Eigene Daten abrufen
@app.get("/me", response_model=UserOut)
def get_me(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        email = payload.get("sub")
        user = find_user_by_email(email)
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
@app.patch("/me", response_model=UserOut)
def update_me(
    license_plate: str = Body(..., embed=True),
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        email = payload.get("sub")
        user = find_user_by_email(email)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user["license_plate"] = license_plate
        create_user(user)  # Upsert in Cosmos
        return user

    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token or update error")

@app.post("/webhook/lpr")
async def lpr_webhook(request: Request):
    data = await request.body()
    print("Empfangen:", data)
    return {"status": "received"}