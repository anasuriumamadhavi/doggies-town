from fastapi import APIRouter
import os

router = APIRouter()

@router.get("/_health")
async def health():
    info = {
        "env_present": {
            "MONGO_URL": "MONGO_URL" in os.environ,
            "DB_NAME": "DB_NAME" in os.environ,
        },
        "mongo_ping": False,
        "seeded_settings": False,
    }
    try:
        # import server module to access the db object created there
        from . import server as _server
        db = getattr(_server, "db", None)
        if db is None:
            info["error"] = "db object not found in server module"
            return info

        # Try a lightweight ping
        await db.command("ping")
        info["mongo_ping"] = True

        # Check if settings document was seeded
        doc = await db.settings.find_one({"id": "site"})
        info["seeded_settings"] = bool(doc)
    except Exception as e:
        info["error"] = str(e)[:400]
    return info
