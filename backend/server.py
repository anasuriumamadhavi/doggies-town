import os
import uuid
import asyncio
import logging
import mimetypes
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, UploadFile, File, Header
from fastapi.responses import RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

import auth as auth_mod
import whatsapp as wa
from seed_data import seed_content

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("server")

# ---------------------------------------------------------------------------
# DATABASE CONNECTION
# Vercel's MONGO_URL / DB_NAME environment variables are used if they are set.
# Otherwise the values below are used.
#
# Paste YOUR OWN MongoDB Atlas connection string between the quotes on the
# MONGO_URL_FALLBACK line. Do NOT use the Emergent one
# (customer-apps.dw2nl2.mongodb.net) because Vercel cannot reach it.
# Keep this GitHub repo PRIVATE if you paste a password here.
# ---------------------------------------------------------------------------
MONGO_URL_FALLBACK = "mongodb+srv://paws-staging-1:da19d1qmp9dc73c5vqeg@customer-apps.dw2nl2.mongodb.net/?retryWrites=true&w=majority&appName=paws-staging-1&maxPoolSize=5"
DB_NAME_FALLBACK = "paws-staging-1"

mongo_url = os.environ.get("MONGO_URL") or MONGO_URL_FALLBACK
db_name = os.environ.get("DB_NAME") or DB_NAME_FALLBACK

if "mongodb+srv://paws-staging-1:da19d1qmp9dc73c5vqeg@customer-apps.dw2nl2.mongodb.net/?retryWrites=true&w=majority&appName=paws-staging-1&maxPoolSize=5" in mongo_url:
    raise RuntimeError("MongoDB URL not set: paste your Atlas URL into MONGO_URL_FALLBACK in server.py, or set MONGO_URL in Vercel.")
if "customer-apps.dw2nl2.mongodb.net" in mongo_url:
    logging.getLogger("server").warning(
        "MONGO_URL points to Emergent's database, which Vercel cannot reach. Use your own Atlas cluster."
    )

client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=8000)
db = client[db_name]

# NOTE: no local uploads folder. Vercel's filesystem is read-only, and anything written
# to /tmp disappears between requests. All media lives in S3-compatible storage (R2/S3).

app = FastAPI(title="Pawsome Pet Care API")
api = APIRouter(prefix="/api")


# ----------------------------- object storage (Cloudflare R2 / AWS S3) -----------------------------
S3_BUCKET = os.environ.get("S3_BUCKET", "")
S3_PREFIX = "uploads/"  # objects are stored as uploads/<filename>

# Optional: public base URL of the bucket (e.g. https://pub-xxxx.r2.dev or https://media.yourdomain.com).
# If set, /api/uploads/<file> redirects there (fast, cacheable). If not, it redirects to a signed URL.
S3_PUBLIC_BASE_URL = os.environ.get("S3_PUBLIC_BASE_URL", "").rstrip("/")

ALLOWED_EXTENSIONS = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
}
VIDEO_EXTENSIONS = {".mp4", ".mov"}
MAX_IMAGE_BYTES = 15 * 1024 * 1024    # 15 MB
MAX_VIDEO_BYTES = 200 * 1024 * 1024   # 200 MB (via direct upload)
SERVER_UPLOAD_LIMIT = 4 * 1024 * 1024  # Vercel request bodies cap at ~4.5 MB

_s3_client = None


def get_s3():
    """Create the S3/R2 client lazily so a missing config fails one request, not the whole app."""
    global _s3_client
    if _s3_client is None:
        if not S3_BUCKET:
            raise HTTPException(status_code=500, detail="Media storage is not configured (S3_BUCKET missing)")
        _s3_client = boto3.client(
            "s3",
            endpoint_url=os.environ.get("S3_ENDPOINT_URL") or None,  # set for R2, leave empty for AWS
            aws_access_key_id=os.environ.get("S3_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("S3_SECRET_ACCESS_KEY"),
            region_name=os.environ.get("S3_REGION", "auto"),
            config=BotoConfig(signature_version="s3v4"),
        )
    return _s3_client


def get_extension(filename: str) -> str:
    ext = Path(filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    return ext


def max_bytes_for(ext: str) -> int:
    return MAX_VIDEO_BYTES if ext in VIDEO_EXTENSIONS else MAX_IMAGE_BYTES


def object_key(fname: str) -> str:
    return f"{S3_PREFIX}{fname}"


def safe_filename(fname: str) -> str:
    """Only allow plain filenames like 3f2a...e1.jpg (no paths)."""
    if not fname or "/" in fname or "\\" in fname or ".." in fname:
        raise HTTPException(status_code=404, detail="File not found")
    return fname


async def s3_put(key: str, data: bytes, content_type: str):
    await asyncio.to_thread(
        get_s3().put_object,
        Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )


async def s3_head(key: str) -> Optional[dict]:
    try:
        return await asyncio.to_thread(get_s3().head_object, Bucket=S3_BUCKET, Key=key)
    except ClientError:
        return None


async def s3_delete(key: str):
    try:
        await asyncio.to_thread(get_s3().delete_object, Bucket=S3_BUCKET, Key=key)
    except ClientError as e:
        logger.warning("Could not delete %s: %s", key, e)


def presign_put(key: str, content_type: str, expires: int = 900) -> str:
    return get_s3().generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": key, "ContentType": content_type,
                "CacheControl": "public, max-age=31536000, immutable"},
        ExpiresIn=expires,
    )


def presign_get(key: str, expires: int = 3600) -> str:
    return get_s3().generate_presigned_url(
        "get_object", Params={"Bucket": S3_BUCKET, "Key": key}, ExpiresIn=expires,
    )


def media_url(fname: str) -> str:
    # Same URL format as before, so existing content in MongoDB keeps working.
    return f"/api/uploads/{fname}"


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


class MediaUploadUrlBody(BaseModel):
    filename: str
    size: int
    content_type: Optional[str] = None


class MediaUploadCompleteBody(BaseModel):
    filename: str        # the generated filename returned by upload-url
    original_name: str


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


# ----------------------------- media -----------------------------
async def _save_media_record(fname: str, original_name: str, size: int, ext: str, admin: dict) -> dict:
    doc = {
        "id": str(uuid.uuid4()), "filename": fname, "original_name": original_name,
        "url": media_url(fname), "size": size,
        "media_type": "video" if ext in VIDEO_EXTENSIONS else "image",
        "alt_text": "", "created_at": now_iso(),
    }
    await db.media.insert_one(dict(doc))
    await log_activity(admin["email"], "upload", "media", f"Uploaded {original_name}")
    return clean(doc)


@api.post("/admin/media/upload")
async def upload_media(file: UploadFile = File(...), admin=Depends(admin_dep)):
    """
    Single-request upload (same as before). On Vercel this only works for files under ~4 MB.
    Use /admin/media/upload-url + /admin/media/upload-complete for larger files and videos.
    """
    ext = get_extension(file.filename)
    content = await file.read()
    if len(content) > SERVER_UPLOAD_LIMIT:
        raise HTTPException(
            status_code=413,
            detail="File too large for direct upload (max 4 MB). Use /api/admin/media/upload-url instead.",
        )
    fname = f"{uuid.uuid4().hex}{ext}"
    await s3_put(object_key(fname), content, ALLOWED_EXTENSIONS[ext])
    return await _save_media_record(fname, file.filename, len(content), ext, admin)


@api.post("/admin/media/upload-url")
async def media_upload_url(body: MediaUploadUrlBody, admin=Depends(admin_dep)):
    """Step 1 of direct upload: returns a presigned PUT URL so the browser uploads straight to storage."""
    ext = get_extension(body.filename)
    limit = max_bytes_for(ext)
    if body.size <= 0 or body.size > limit:
        raise HTTPException(status_code=400, detail=f"File too large. Max {limit // (1024 * 1024)} MB for this type.")
    fname = f"{uuid.uuid4().hex}{ext}"
    content_type = ALLOWED_EXTENSIONS[ext]
    return {
        "upload_url": presign_put(object_key(fname), content_type),
        "filename": fname,
        "content_type": content_type,  # browser must send exactly this Content-Type header
        "headers": {"Content-Type": content_type,
                    "Cache-Control": "public, max-age=31536000, immutable"},
        "expires_in": 900,
    }


@api.post("/admin/media/upload-complete")
async def media_upload_complete(body: MediaUploadCompleteBody, admin=Depends(admin_dep)):
    """Step 2 of direct upload: verifies the object exists and creates the media record."""
    fname = safe_filename(body.filename)
    ext = get_extension(fname)
    meta = await s3_head(object_key(fname))
    if not meta:
        raise HTTPException(status_code=404, detail="Upload not found. Please try again.")
    size = meta.get("ContentLength", 0)
    if size > max_bytes_for(ext):
        await s3_delete(object_key(fname))
        raise HTTPException(status_code=400, detail="File exceeds the allowed size and was removed.")
    return await _save_media_record(fname, body.original_name, size, ext, admin)


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
    if doc and doc.get("filename"):
        await s3_delete(object_key(doc["filename"]))
    await db.media.delete_one({"id": item_id})
    return {"success": True}


@api.get("/uploads/{fname}")
async def serve_upload(fname: str):
    """
    Replaces the old StaticFiles mount. Keeps every existing /api/uploads/<file> URL
    (stored in services, gallery, homepage, etc.) working by redirecting to storage.
    """
    fname = safe_filename(fname)
    key = object_key(fname)
    if S3_PUBLIC_BASE_URL:
        return RedirectResponse(url=f"{S3_PUBLIC_BASE_URL}/{key}", status_code=301)
    return RedirectResponse(url=presign_get(key), status_code=307)


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


@api.get("/health")
async def health():
    """Quick deploy check: open /api/health after deploying."""
    db_ok = True
    try:
        await db.command("ping")
    except Exception as e:
        logger.error("MongoDB ping failed: %s", e)
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "database": db_ok,
        "storage_configured": bool(S3_BUCKET),
        "public_media_url": bool(S3_PUBLIC_BASE_URL),
        "time": now_iso(),
    }


app.include_router(api)

# CORS: set CORS_ORIGINS to a comma-separated list of your frontend domains.
# Optionally set CORS_ORIGIN_REGEX (e.g. https://doggies-town-.*\.vercel\.app) for preview deployments.
_cors_env = os.environ.get("CORS_ORIGINS", "*").strip()
_cors_origins = ["*"] if _cors_env in ("", "*") else [o.strip() for o in _cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX") or None,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # On Vercel this runs on every cold start. Wrapped so a seeding problem
    # never takes the whole site down.
    try:
        await db.users.create_index("email", unique=True)
        await auth_mod.seed_admin(db)
        await seed_content(db)
        logger.info("Startup complete: admin seeded, content seeded.")
    except Exception as e:
        logger.error("Startup seeding failed (site will still serve): %s", e)


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ----------------------------- one-time migration: local uploads/ -> R2/S3 -----------------------------
def migrate_local_uploads():
    """
    Copies every file in backend/uploads/ to the bucket as uploads/<filename>,
    so existing /api/uploads/<file> links keep working. Files already in the
    bucket are skipped, so it is safe to run more than once.

    Run ONCE from a machine that still has the uploads/ folder (your computer or Emergent):
        python server.py migrate
    Needs the S3_* variables in backend/.env.
    """
    upload_dir = ROOT_DIR / "uploads"
    if not upload_dir.is_dir():
        print(f"No uploads folder at {upload_dir}. Nothing to migrate.")
        return

    s3 = get_s3()
    files = [p for p in upload_dir.iterdir() if p.is_file()]
    uploaded = skipped = failed = 0
    for path in files:
        key = object_key(path.name)
        try:
            s3.head_object(Bucket=S3_BUCKET, Key=key)
            skipped += 1
            continue
        except ClientError:
            pass
        ctype = (ALLOWED_EXTENSIONS.get(path.suffix.lower())
                 or mimetypes.guess_type(path.name)[0]
                 or "application/octet-stream")
        try:
            s3.upload_file(
                str(path), S3_BUCKET, key,
                ExtraArgs={"ContentType": ctype, "CacheControl": "public, max-age=31536000, immutable"},
            )
            uploaded += 1
            print(f"uploaded  {path.name}")
        except Exception as e:
            failed += 1
            print(f"FAILED    {path.name}: {e}")

    print(f"\nDone. {uploaded} uploaded, {skipped} already there, {failed} failed (of {len(files)}).")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "migrate":
        migrate_local_uploads()
    else:
        print("Usage: python server.py migrate   (copies backend/uploads/ to R2/S3)")
