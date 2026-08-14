import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, UploadFile, File, Header
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

import auth as auth_mod
import whatsapp as wa
from seed_data import seed_content

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("server")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Pawsome Pet Care API")
api = APIRouter(prefix="/api")


# ----------------------------- helpers -----------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def admin_dep(request: Request) -> dict:
    return await auth_mod.get_current_admin(request, db)


async def log_activity(admin_email: str, action: str, module: str, description: str):
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()), "admin": admin_email, "action": action,
        "module": module, "description": description, "created_at": now_iso(),
    })


def slugify(text: str) -> str:
    import re
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or uuid.uuid4().hex[:8]


# ----------------------------- models -----------------------------
class LoginBody(BaseModel):
    email: EmailStr
    password: str


class EnquiryBody(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    pet_name: Optional[str] = ""
    service: Optional[str] = ""
    package: Optional[str] = ""
    message: Optional[str] = ""


# ----------------------------- auth -----------------------------
@api.post("/auth/login")
async def login(body: LoginBody, response: Response, request: Request):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not auth_mod.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    access = auth_mod.create_access_token(uid, email)
    refresh = auth_mod.create_refresh_token(uid)
    auth_mod.set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": user.get("name", "Admin"), "token": access}


@api.post("/auth/logout")
async def logout(response: Response, admin=Depends(admin_dep)):
    auth_mod.clear_auth_cookies(response)
    return {"success": True}


@api.get("/auth/me")
async def me(admin=Depends(admin_dep)):
    return {"id": admin["_id"], "email": admin["email"], "name": admin.get("name", "Admin")}


# ----------------------------- generic content CRUD factory -----------------------------
def register_collection(name: str, coll: str, has_slug: bool = False, order_field: str = "display_order"):
    """Registers public list/detail + admin CRUD endpoints for a content collection."""

    @api.get(f"/public/{name}")
    async def public_list():
        q = {}
        if coll in ("services", "packages"):
            q["status"] = "published"
        if coll in ("testimonials", "faqs"):
            q["published"] = True
        items = await db[coll].find(q, {"_id": 0}).sort(order_field, 1).to_list(1000)
        return items

    if has_slug:
        @api.get(f"/public/{name}/{{slug}}")
        async def public_detail(slug: str):
            item = await db[coll].find_one({"slug": slug}, {"_id": 0})
            if not item or item.get("status") != "published":
                raise HTTPException(status_code=404, detail="Not found")
            return item

    @api.get(f"/admin/{name}")
    async def admin_list(admin=Depends(admin_dep)):
        return await db[coll].find({}, {"_id": 0}).sort(order_field, 1).to_list(1000)

    @api.get(f"/admin/{name}/{{item_id}}")
    async def admin_get(item_id: str, admin=Depends(admin_dep)):
        item = await db[coll].find_one({"id": item_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        return item

    @api.post(f"/admin/{name}")
    async def admin_create(payload: dict, admin=Depends(admin_dep)):
        payload["id"] = str(uuid.uuid4())
        payload["created_at"] = now_iso()
        payload["updated_at"] = now_iso()
        if has_slug:
            if not payload.get("slug"):
                payload["slug"] = slugify(payload.get("name", ""))
        if order_field not in payload:
            payload[order_field] = await db[coll].count_documents({}) + 1
        await db[coll].insert_one(dict(payload))
        await log_activity(admin["email"], "create", name, f"Created {name[:-1] if name.endswith('s') else name}: {payload.get('name') or payload.get('question') or payload.get('label') or payload.get('id')}")
        return clean(payload)

    @api.put(f"/admin/{name}/{{item_id}}")
    async def admin_update(item_id: str, payload: dict, admin=Depends(admin_dep)):
        payload.pop("id", None)
        payload.pop("_id", None)
        payload["updated_at"] = now_iso()
        res = await db[coll].update_one({"id": item_id}, {"$set": payload})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        await log_activity(admin["email"], "update", name, f"Updated {name} item {item_id}")
        return await db[coll].find_one({"id": item_id}, {"_id": 0})

    @api.delete(f"/admin/{name}/{{item_id}}")
    async def admin_delete(item_id: str, admin=Depends(admin_dep)):
        await db[coll].delete_one({"id": item_id})
        await log_activity(admin["email"], "delete", name, f"Deleted {name} item {item_id}")
        return {"success": True}

    @api.post(f"/admin/{name}/{{item_id}}/duplicate")
    async def admin_duplicate(item_id: str, admin=Depends(admin_dep)):
        item = await db[coll].find_one({"id": item_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        item["id"] = str(uuid.uuid4())
        item["created_at"] = now_iso()
        item["updated_at"] = now_iso()
        if "name" in item:
            item["name"] = f"{item['name']} (Copy)"
        if has_slug:
            item["slug"] = slugify(item.get("name", "")) + "-" + uuid.uuid4().hex[:4]
        if "status" in item:
            item["status"] = "draft"
        await db[coll].insert_one(dict(item))
        await log_activity(admin["email"], "duplicate", name, f"Duplicated {name} item")
        return clean(item)

    @api.post(f"/admin/{name}/reorder")
    async def admin_reorder(payload: dict, admin=Depends(admin_dep)):
        # payload: {"ids": [id1, id2, ...]}
        for idx, iid in enumerate(payload.get("ids", [])):
            await db[coll].update_one({"id": iid}, {"$set": {order_field: idx + 1}})
        return {"success": True}


register_collection("services", "services", has_slug=True)
register_collection("packages", "packages", has_slug=True)
register_collection("testimonials", "testimonials")
register_collection("faqs", "faqs")
register_collection("gallery", "gallery")
register_collection("navigation", "navigation")


# ----------------------------- singleton docs (settings / homepage / about) -----------------------------
def register_singleton(name: str, coll: str, doc_id: str, public: bool = True):
    if public:
        @api.get(f"/public/{name}")
        async def public_get():
            doc = await db[coll].find_one({"id": doc_id}, {"_id": 0})
            return doc or {}

    @api.get(f"/admin/{name}")
    async def admin_get(admin=Depends(admin_dep)):
        doc = await db[coll].find_one({"id": doc_id}, {"_id": 0})
        return doc or {}

    @api.put(f"/admin/{name}")
    async def admin_update(payload: dict, admin=Depends(admin_dep)):
        payload["id"] = doc_id
        payload["updated_at"] = now_iso()
        await db[coll].update_one({"id": doc_id}, {"$set": payload}, upsert=True)
        await log_activity(admin["email"], "update", name, f"Updated {name}")
        return await db[coll].find_one({"id": doc_id}, {"_id": 0})


register_singleton("settings", "settings", "site")
register_singleton("homepage", "homepage", "homepage")
register_singleton("about", "about", "about")


# ----------------------------- media upload -----------------------------
@api.post("/admin/media/upload")
async def upload_media(file: UploadFile = File(...), admin=Depends(admin_dep)):
    ext = Path(file.filename).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".svg"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    fname = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / fname
    content = await file.read()
    dest.write_bytes(content)
    doc = {
        "id": str(uuid.uuid4()), "filename": fname, "original_name": file.filename,
        "url": f"/api/uploads/{fname}", "size": len(content),
        "media_type": "video" if ext in {".mp4", ".mov"} else "image",
        "alt_text": "", "created_at": now_iso(),
    }
    await db.media.insert_one(dict(doc))
    await log_activity(admin["email"], "upload", "media", f"Uploaded {file.filename}")
    return clean(doc)


@api.get("/admin/media")
async def list_media(admin=Depends(admin_dep)):
    return await db.media.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.put("/admin/media/{item_id}")
async def update_media(item_id: str, payload: dict, admin=Depends(admin_dep)):
    payload.pop("id", None)
    payload.pop("_id", None)
    await db.media.update_one({"id": item_id}, {"$set": payload})
    return await db.media.find_one({"id": item_id}, {"_id": 0})


@api.delete("/admin/media/{item_id}")
async def delete_media(item_id: str, admin=Depends(admin_dep)):
    doc = await db.media.find_one({"id": item_id}, {"_id": 0})
    if doc:
        fp = UPLOAD_DIR / doc["filename"]
        if fp.exists():
            fp.unlink()
    await db.media.delete_one({"id": item_id})
    return {"success": True}


# ----------------------------- enquiries -----------------------------
@api.post("/public/enquiries")
async def create_enquiry(body: EnquiryBody):
    doc = {
        "id": str(uuid.uuid4()), **body.model_dump(),
        "status": "New", "notes": [], "created_at": now_iso(),
    }
    await db.enquiries.insert_one(dict(doc))

    settings = await db.settings.find_one({"id": "site"}, {"_id": 0}) or {}
    wa_settings = settings.get("whatsapp_settings", {})
    if wa_settings.get("automation", {}).get("enquiry_received") and body.phone:
        await wa.send_whatsapp(
            db, message_type="enquiry_received", ref_id=doc["id"], phone=body.phone,
            trigger="website_enquiry",
            variables={
                "customer_name": body.name, "customer_phone": body.phone,
                "pet_name": body.pet_name or "-", "service_name": body.service or "-",
                "business_name": settings.get("business_name", "Pawsome"),
            },
        )
    return {"success": True, "id": doc["id"]}


@api.get("/admin/enquiries")
async def list_enquiries(admin=Depends(admin_dep)):
    return await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


@api.get("/admin/enquiries/{item_id}")
async def get_enquiry(item_id: str, admin=Depends(admin_dep)):
    item = await db.enquiries.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@api.put("/admin/enquiries/{item_id}/status")
async def update_enquiry_status(item_id: str, payload: dict, admin=Depends(admin_dep)):
    await db.enquiries.update_one({"id": item_id}, {"$set": {"status": payload.get("status", "New")}})
    await log_activity(admin["email"], "update", "enquiries", f"Enquiry {item_id} -> {payload.get('status')}")
    return await db.enquiries.find_one({"id": item_id}, {"_id": 0})


@api.post("/admin/enquiries/{item_id}/note")
async def add_enquiry_note(item_id: str, payload: dict, admin=Depends(admin_dep)):
    note = {"text": payload.get("text", ""), "by": admin["email"], "at": now_iso()}
    await db.enquiries.update_one({"id": item_id}, {"$push": {"notes": note}})
    return await db.enquiries.find_one({"id": item_id}, {"_id": 0})


@api.delete("/admin/enquiries/{item_id}")
async def delete_enquiry(item_id: str, admin=Depends(admin_dep)):
    await db.enquiries.delete_one({"id": item_id})
    await log_activity(admin["email"], "delete", "enquiries", f"Deleted enquiry {item_id}")
    return {"success": True}


# ----------------------------- WhatsApp automation & logs -----------------------------
@api.get("/admin/whatsapp/logs")
async def whatsapp_logs(admin=Depends(admin_dep)):
    return await db.whatsapp_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


@api.post("/admin/whatsapp/logs/{log_id}/retry")
async def whatsapp_retry(log_id: str, admin=Depends(admin_dep)):
    result = await wa.retry_whatsapp(db, log_id)
    await log_activity(admin["email"], "retry", "whatsapp", f"Retried message {log_id}")
    return result


@api.post("/admin/whatsapp/test")
async def whatsapp_test(payload: dict, admin=Depends(admin_dep)):
    settings = await db.settings.find_one({"id": "site"}, {"_id": 0}) or {}
    phone = payload.get("phone") or settings.get("whatsapp", "")
    result = await wa.send_whatsapp(
        db, message_type="enquiry_received", ref_id=f"test_{uuid.uuid4().hex[:8]}",
        phone=phone, trigger="admin_test",
        variables={"customer_name": "Test User", "pet_name": "Buddy",
                   "service_name": "Grooming", "business_name": settings.get("business_name", "Pawsome")},
    )
    return result


# ----------------------------- ERP webhook -> WhatsApp booking confirmation -----------------------------
@api.post("/webhook/booking")
async def erp_booking_webhook(payload: dict, x_webhook_secret: str = Header(default="")):
    """Called by the ERP/CRM AFTER a booking is successfully created.

    Expected payload: customer_name, customer_phone, pet_name, service_name,
    booking_date, booking_time, booking_id.
    """
    secret = os.environ.get("ERP_WEBHOOK_SECRET", "")
    if secret and x_webhook_secret != secret:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    booking_id = str(payload.get("booking_id") or uuid.uuid4().hex[:10])
    settings = await db.settings.find_one({"id": "site"}, {"_id": 0}) or {}
    wa_settings = settings.get("whatsapp_settings", {})
    phone = payload.get("customer_phone", "")

    if not (wa_settings.get("automation", {}).get("booking_confirmation") and phone):
        return {"success": True, "whatsapp": "skipped"}

    result = await wa.send_whatsapp(
        db, message_type="booking_confirmation", ref_id=booking_id, phone=phone,
        trigger="erp_booking_created",
        variables={
            "customer_name": payload.get("customer_name", "-"),
            "customer_phone": phone,
            "pet_name": payload.get("pet_name", "-"),
            "service_name": payload.get("service_name", "-"),
            "booking_date": payload.get("booking_date", "-"),
            "booking_time": payload.get("booking_time", "-"),
            "booking_id": booking_id,
            "business_name": settings.get("business_name", "Pawsome"),
            "business_phone": settings.get("phone", "-"),
        },
    )
    return {"success": True, "whatsapp": result}


# ----------------------------- activity logs -----------------------------
@api.get("/admin/activity-logs")
async def activity_logs(admin=Depends(admin_dep)):
    return await db.activity_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


# ----------------------------- dashboard -----------------------------
@api.get("/admin/dashboard")
async def dashboard(admin=Depends(admin_dep)):
    total_enq = await db.enquiries.count_documents({})
    new_enq = await db.enquiries.count_documents({"status": "New"})
    active_services = await db.services.count_documents({"status": "published"})
    active_packages = await db.packages.count_documents({"status": "published"})
    gallery_count = await db.gallery.count_documents({})
    testimonials_count = await db.testimonials.count_documents({})
    recent = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(6)
    wa_sent = await db.whatsapp_logs.count_documents({"status": {"$in": ["sent", "delivered", "read"]}})
    wa_failed = await db.whatsapp_logs.count_documents({"status": "failed"})
    return {
        "total_enquiries": total_enq, "new_enquiries": new_enq,
        "active_services": active_services, "active_packages": active_packages,
        "gallery_images": gallery_count, "testimonials": testimonials_count,
        "published_pages": 3, "whatsapp_sent": wa_sent, "whatsapp_failed": wa_failed,
        "recent_enquiries": recent,
    }


@api.get("/")
async def root():
    return {"message": "Pawsome Pet Care API"}


app.include_router(api)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await auth_mod.seed_admin(db)
    await seed_content(db)
    logger.info("Startup complete: admin seeded, content seeded.")


@app.on_event("shutdown")
async def shutdown():
    client.close()
