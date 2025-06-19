from dotenv import load_dotenv
import os
from azure.cosmos import CosmosClient, PartitionKey
from datetime import datetime
import uuid
import stripe

load_dotenv()

COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT")
COSMOS_KEY = os.getenv("COSMOS_KEY")
COSMOS_DB_NAME = os.getenv("COSMOS_DB_NAME", "parking-db")
STRIPE_API_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "eur")

stripe.api_key = STRIPE_API_KEY

client = CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
database = client.create_database_if_not_exists(id=COSMOS_DB_NAME)

# Container-Cache
container_map = {}

def get_container(name: str):
    if name not in container_map:
        container = database.create_container_if_not_exists(
            id=name,
            partition_key=PartitionKey(path="/id")  # wir nutzen die Email als id
        )
        container_map[name] = container
    return container_map[name]

# ========== Session-Logik ==========

def create_parking_session(license_plate: str):
    container = get_container("sessions")
    item = {
        "id": str(uuid.uuid4()),
        "license_plate": license_plate,
        "entry_time": datetime.utcnow().isoformat(),
        "exit_time": None,
        "amount_due": 0.0,
        "is_active": True,
        "is_paid": False
    }
    container.create_item(item)
    return item


def get_active_sessions():
    container = get_container("sessions")
    query = "SELECT * FROM c WHERE c.is_active = true"
    items = list(container.query_items(query=query, enable_cross_partition_query=True))
    return items


def calculate_fee(session_id: str):
    container = get_container("sessions")
    query = f"SELECT * FROM c WHERE c.id = '{session_id}'"
    items = list(container.query_items(query=query, enable_cross_partition_query=True))
    if not items:
        return None

    session = items[0]
    entry_time = datetime.fromisoformat(session["entry_time"])

    end_time = (
        datetime.fromisoformat(session["exit_time"])
        if session.get("exit_time")
        else datetime.utcnow()
    )

    duration = end_time - entry_time
    hours = duration.total_seconds() / 3600
    fee = max(round(hours * 2.0, 2), 1.0)

    session["amount_due"] = fee
    container.replace_item(item=session, body=session)

    return {
        "session_id": session["id"],
        "license_plate": session["license_plate"],
        "is_active": session["is_active"],
        "is_paid": session["is_paid"],
        "amount_due": session["amount_due"]
    }


def close_parking_session(session_id: str):
    container = get_container("sessions")
    query = f"SELECT * FROM c WHERE c.id = '{session_id}'"
    items = list(container.query_items(query=query, enable_cross_partition_query=True))
    if not items:
        return None

    session = items[0]
    session["exit_time"] = datetime.utcnow().isoformat()
    session["is_active"] = False

    entry_time = datetime.fromisoformat(session["entry_time"])
    exit_time = datetime.utcnow()
    duration = exit_time - entry_time
    hours = duration.total_seconds() / 3600
    fee = max(round(hours * 2.0, 2), 1.0)
    session["amount_due"] = fee

    container.replace_item(item=session, body=session)
    return session


def create_payment_intent(session_id: str):
    fee_info = calculate_fee(session_id)
    if fee_info is None:
        return None

    amount_cents = int(fee_info["amount_due"] * 100)
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=STRIPE_CURRENCY,
        automatic_payment_methods={"enabled": True},
        metadata={"session_id": session_id}
    )

    return {
        "client_secret": intent.client_secret,
        "amount": fee_info["amount_due"],
        "currency": STRIPE_CURRENCY,
        "session_id": session_id
    }


def mark_session_as_paid(session_id: str):
    container = get_container("sessions")
    query = f"SELECT * FROM c WHERE c.id = '{session_id}'"
    items = list(container.query_items(query=query, enable_cross_partition_query=True))
    if not items:
        return None

    session = items[0]
    session["is_paid"] = True

    if not session.get("exit_time"):
        session["exit_time"] = datetime.utcnow().isoformat()
        entry_time = datetime.fromisoformat(session["entry_time"])
        exit_time = datetime.fromisoformat(session["exit_time"])
        duration = exit_time - entry_time
        hours = duration.total_seconds() / 3600
        fee = max(round(hours * 2.0, 2), 1.0)
        session["amount_due"] = fee

    container.replace_item(item=session, body=session)
    return session

# ========== Benutzer-Logik ==========

def find_user_by_email(email: str):
    container = get_container("users")
    try:
        return container.read_item(item=email, partition_key=email)
    except:
        return None

def create_user(user_data: dict):
    container = get_container("users")
    # Use upsert so we can update existing users without errors
    container.upsert_item(user_data)
