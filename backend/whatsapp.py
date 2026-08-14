"""WhatsApp automation layer.

Supports an official provider (WATI / WhatsApp Business Cloud API) but ships in
'mock' mode by default so the full flow (templating, logging, status, retry,
duplicate-prevention) works end-to-end without real credentials. Swap
WHATSAPP_PROVIDER=wati and provide WATI_API_ENDPOINT + WATI_API_TOKEN to go live.
"""
import os
import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger("whatsapp")

MESSAGE_TEMPLATES = {
    "booking_confirmation": (
        "Hi {customer_name} 👋\n\n"
        "Thank you for booking with {business_name}.\n\n"
        "Your booking has been received successfully.\n\n"
        "🐾 Pet: {pet_name}\n"
        "🛎️ Service: {service_name}\n"
        "📅 Date: {booking_date}\n"
        "⏰ Time: {booking_time}\n\n"
        "Booking ID: {booking_id}\n\n"
        "Our team will contact you shortly.\n\n"
        "Thank you for choosing {business_name} ❤️"
    ),
    "enquiry_received": (
        "Hi {customer_name} 👋\n\n"
        "Thank you for contacting {business_name}.\n\n"
        "We received your enquiry regarding:\n\n"
        "🐾 Pet: {pet_name}\n"
        "🛎️ Service: {service_name}\n\n"
        "Our team will get back to you shortly.\n\n"
        "Thank you ❤️"
    ),
    "booking_status_update": (
        "Hi {customer_name} 👋\n\n"
        "Update on your booking {booking_id} with {business_name}:\n\n"
        "Status: {status}\n\n"
        "Thank you ❤️"
    ),
}


def render_template(template: str, variables: dict) -> str:
    class _Safe(dict):
        def __missing__(self, key):
            return "-"
    return template.format_map(_Safe(variables))


async def _send_via_provider(phone: str, message: str) -> dict:
    """Returns {success, provider_message_id, error}."""
    provider = os.environ.get("WHATSAPP_PROVIDER", "mock").lower()
    if provider == "mock":
        logger.info("[MOCK WHATSAPP] -> %s: %s", phone, message.replace("\n", " | "))
        return {"success": True, "provider_message_id": f"mock_{uuid.uuid4().hex[:12]}", "error": None}

    if provider == "wati":
        import requests
        endpoint = os.environ.get("WATI_API_ENDPOINT", "")
        token = os.environ.get("WATI_API_TOKEN", "")
        if not endpoint or not token:
            return {"success": False, "provider_message_id": None, "error": "WATI credentials not configured"}
        try:
            resp = requests.post(
                f"{endpoint.rstrip('/')}/api/v1/sendSessionMessage/{phone}",
                headers={"Authorization": f"Bearer {token}"},
                params={"messageText": message},
                timeout=20,
            )
            if resp.status_code < 300:
                data = resp.json() if resp.content else {}
                return {"success": True, "provider_message_id": str(data.get("id", uuid.uuid4().hex[:12])), "error": None}
            return {"success": False, "provider_message_id": None, "error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
        except Exception as e:  # noqa
            return {"success": False, "provider_message_id": None, "error": str(e)}

    return {"success": False, "provider_message_id": None, "error": f"Unknown provider '{provider}'"}


async def send_whatsapp(db, *, message_type: str, ref_id: str, phone: str,
                        variables: dict, trigger: str) -> dict:
    """Send a WhatsApp message with duplicate prevention + logging.

    Never raises: booking/enquiry must not fail because WhatsApp failed.
    """
    now = datetime.now(timezone.utc).isoformat()

    # Duplicate prevention: same ref + type already sent successfully
    existing = await db.whatsapp_logs.find_one({
        "ref_id": ref_id, "message_type": message_type,
        "status": {"$in": ["sent", "delivered", "read"]},
    })
    if existing:
        logger.info("Skipping duplicate WhatsApp %s for %s", message_type, ref_id)
        return {"skipped": True, "log_id": existing["id"]}

    template = MESSAGE_TEMPLATES.get(message_type, "")
    body = render_template(template, variables)

    result = await _send_via_provider(phone, body)
    log = {
        "id": str(uuid.uuid4()),
        "ref_id": ref_id,
        "customer_name": variables.get("customer_name", "-"),
        "phone": phone,
        "message_type": message_type,
        "trigger": trigger,
        "body": body,
        "status": "sent" if result["success"] else "failed",
        "provider_message_id": result["provider_message_id"],
        "error": result["error"],
        "created_at": now,
        "updated_at": now,
    }
    await db.whatsapp_logs.insert_one(dict(log))
    return {"skipped": False, "log_id": log["id"], "status": log["status"], "error": log["error"]}


async def retry_whatsapp(db, log_id: str) -> dict:
    log = await db.whatsapp_logs.find_one({"id": log_id}, {"_id": 0})
    if not log:
        return {"success": False, "error": "Log not found"}
    result = await _send_via_provider(log["phone"], log["body"])
    await db.whatsapp_logs.update_one({"id": log_id}, {"$set": {
        "status": "sent" if result["success"] else "failed",
        "provider_message_id": result["provider_message_id"],
        "error": result["error"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }})
    return {"success": result["success"], "error": result["error"]}
