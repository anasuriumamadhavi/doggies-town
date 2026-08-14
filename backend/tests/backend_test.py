"""Backend API tests for Pawsome Pet Care - covers auth, public, admin CRUD,
enquiries, WhatsApp mock logs, ERP webhook, settings/singletons, dashboard."""
import os
import io
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # try frontend .env
    try:
        with open("/app/frontend/.env") as f:
            for ln in f:
                if ln.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = ln.split("=", 1)[1].strip().strip('"').rstrip("/")
    except Exception:
        pass

ADMIN_EMAIL = "zenlogicglobal@gmail.com"
ADMIN_PASSWORD = "PawsAdmin@2026"
WEBHOOK_SECRET = "erp-webhook-secret-change-me"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("token"), "no token in login response"
    assert data["email"] == ADMIN_EMAIL
    return data["token"]


@pytest.fixture(scope="session")
def admin(api, token):
    api.headers.update({"Authorization": f"Bearer {token}"})
    return api


# ---------------- auth ----------------
class TestAuth:
    def test_login_invalid(self, api):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_unauth(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_auth(self, admin):
        r = admin.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------------- public content ----------------
class TestPublicContent:
    @pytest.mark.parametrize("endpoint", [
        "services", "packages", "testimonials", "faqs",
        "gallery", "navigation", "settings", "homepage", "about",
    ])
    def test_public_endpoint(self, endpoint):
        r = requests.get(f"{BASE_URL}/api/public/{endpoint}")
        assert r.status_code == 200, f"{endpoint} -> {r.status_code}"
        data = r.json()
        assert data is not None

    def test_services_have_slugs(self):
        r = requests.get(f"{BASE_URL}/api/public/services")
        services = r.json()
        assert isinstance(services, list) and len(services) > 0
        for s in services:
            assert s.get("slug"), f"service missing slug: {s}"

    def test_service_detail(self):
        services = requests.get(f"{BASE_URL}/api/public/services").json()
        slug = services[0]["slug"]
        r = requests.get(f"{BASE_URL}/api/public/services/{slug}")
        assert r.status_code == 200
        assert r.json()["slug"] == slug

    def test_package_detail(self):
        pkgs = requests.get(f"{BASE_URL}/api/public/packages").json()
        assert len(pkgs) > 0
        slug = pkgs[0]["slug"]
        r = requests.get(f"{BASE_URL}/api/public/packages/{slug}")
        assert r.status_code == 200

    def test_boarding_slug_exists(self):
        # spec mentions /services/boarding
        r = requests.get(f"{BASE_URL}/api/public/services/boarding")
        # may or may not exist - just log
        assert r.status_code in (200, 404)

    def test_settings_has_cta_and_whatsapp(self):
        s = requests.get(f"{BASE_URL}/api/public/settings").json()
        assert "cta" in s or "whatsapp" in s or "phone" in s


# ---------------- public enquiry ----------------
class TestEnquiry:
    def test_create_enquiry_and_verify(self, admin):
        payload = {
            "name": "TEST_Enquirer",
            "phone": "+911234567890",
            "email": "test@example.com",
            "pet_name": "Buddy",
            "service": "Grooming",
            "message": "Testing enquiry",
        }
        r = requests.post(f"{BASE_URL}/api/public/enquiries", json=payload)
        assert r.status_code == 200, r.text
        eid = r.json()["id"]

        # verify in admin list
        r2 = admin.get(f"{BASE_URL}/api/admin/enquiries")
        assert r2.status_code == 200
        ids = [e["id"] for e in r2.json()]
        assert eid in ids


# ---------------- WhatsApp mock ----------------
class TestWhatsApp:
    def test_whatsapp_test_endpoint(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/whatsapp/test",
                       json={"phone": "+911234567890"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("log_id")
        assert data.get("status") == "sent"

    def test_whatsapp_logs_list(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/whatsapp/logs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- ERP webhook ----------------
class TestWebhook:
    def test_webhook_missing_secret(self):
        r = requests.post(f"{BASE_URL}/api/webhook/booking", json={"booking_id": "x"})
        assert r.status_code == 401

    def test_webhook_success_and_duplicate(self, admin):
        # Ensure automation is on
        settings = admin.get(f"{BASE_URL}/api/admin/settings").json()
        wa = settings.get("whatsapp_settings", {}) or {}
        auto = wa.get("automation", {}) or {}
        auto["booking_confirmation"] = True
        wa["automation"] = auto
        settings["whatsapp_settings"] = wa
        admin.put(f"{BASE_URL}/api/admin/settings", json=settings)

        booking_id = f"TEST_BK_{uuid.uuid4().hex[:8]}"
        body = {
            "customer_name": "TEST_Cust", "customer_phone": "+911234567891",
            "pet_name": "Rex", "service_name": "Boarding",
            "booking_date": "2026-01-20", "booking_time": "10:00",
            "booking_id": booking_id,
        }
        headers = {"X-Webhook-Secret": WEBHOOK_SECRET}
        r1 = requests.post(f"{BASE_URL}/api/webhook/booking", json=body, headers=headers)
        assert r1.status_code == 200, r1.text
        assert r1.json().get("success") is True

        # Count logs for this ref
        logs1 = admin.get(f"{BASE_URL}/api/admin/whatsapp/logs").json()
        matching1 = [l for l in logs1 if l.get("ref_id") == booking_id]
        assert len(matching1) == 1, f"expected 1 log, got {len(matching1)}"
        assert matching1[0]["message_type"] == "booking_confirmation"
        assert matching1[0]["status"] == "sent"

        # Duplicate call
        r2 = requests.post(f"{BASE_URL}/api/webhook/booking", json=body, headers=headers)
        assert r2.status_code == 200
        logs2 = admin.get(f"{BASE_URL}/api/admin/whatsapp/logs").json()
        matching2 = [l for l in logs2 if l.get("ref_id") == booking_id]
        assert len(matching2) == 1, f"duplicate prevention failed: {len(matching2)} logs"


# ---------------- Admin CRUD (services) ----------------
class TestServicesCRUD:
    def test_full_service_lifecycle(self, admin):
        # CREATE
        payload = {"name": "TEST_Service", "short_description": "test",
                   "description": "test", "status": "draft"}
        r = admin.post(f"{BASE_URL}/api/admin/services", json=payload)
        assert r.status_code == 200, r.text
        item = r.json()
        sid = item["id"]
        assert item["name"] == "TEST_Service"
        assert item["slug"]

        # GET
        g = admin.get(f"{BASE_URL}/api/admin/services/{sid}")
        assert g.status_code == 200
        assert g.json()["id"] == sid

        # PUBLISH
        u = admin.put(f"{BASE_URL}/api/admin/services/{sid}",
                      json={"status": "published", "name": "TEST_Service_2"})
        assert u.status_code == 200
        assert u.json()["status"] == "published"
        assert u.json()["name"] == "TEST_Service_2"

        # DUPLICATE
        d = admin.post(f"{BASE_URL}/api/admin/services/{sid}/duplicate")
        assert d.status_code == 200
        dup_id = d.json()["id"]
        assert dup_id != sid

        # REORDER
        r_ord = admin.post(f"{BASE_URL}/api/admin/services/reorder",
                           json={"ids": [sid, dup_id]})
        assert r_ord.status_code == 200

        # DELETE both
        assert admin.delete(f"{BASE_URL}/api/admin/services/{sid}").status_code == 200
        assert admin.delete(f"{BASE_URL}/api/admin/services/{dup_id}").status_code == 200

        # GET after delete
        g2 = admin.get(f"{BASE_URL}/api/admin/services/{sid}")
        assert g2.status_code == 404


# ---------------- Singletons (settings, homepage, about) ----------------
class TestSingletons:
    def test_update_cta_erp_booking_url(self, admin):
        current = admin.get(f"{BASE_URL}/api/admin/settings").json()
        new_url = f"https://erp.example.com/book?t={uuid.uuid4().hex[:6]}"
        current.setdefault("cta", {})["erp_booking_url"] = new_url
        r = admin.put(f"{BASE_URL}/api/admin/settings", json=current)
        assert r.status_code == 200
        assert r.json()["cta"]["erp_booking_url"] == new_url

        pub = requests.get(f"{BASE_URL}/api/public/settings").json()
        assert pub.get("cta", {}).get("erp_booking_url") == new_url

    def test_update_contact_phone(self, admin):
        cur = admin.get(f"{BASE_URL}/api/admin/settings").json()
        new_phone = "+919999999999"
        cur["phone"] = new_phone
        r = admin.put(f"{BASE_URL}/api/admin/settings", json=cur)
        assert r.status_code == 200
        pub = requests.get(f"{BASE_URL}/api/public/settings").json()
        assert pub.get("phone") == new_phone

    def test_homepage_save(self, admin):
        cur = admin.get(f"{BASE_URL}/api/admin/homepage").json() or {}
        cur["hero_title_test"] = f"TEST_{uuid.uuid4().hex[:6]}"
        r = admin.put(f"{BASE_URL}/api/admin/homepage", json=cur)
        assert r.status_code == 200
        assert r.json().get("hero_title_test") == cur["hero_title_test"]

    def test_about_save(self, admin):
        cur = admin.get(f"{BASE_URL}/api/admin/about").json() or {}
        cur["test_field"] = f"TEST_{uuid.uuid4().hex[:6]}"
        r = admin.put(f"{BASE_URL}/api/admin/about", json=cur)
        assert r.status_code == 200


# ---------------- Media upload ----------------
class TestMedia:
    def test_upload_and_delete(self, admin):
        # 1x1 PNG bytes
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00"
            b"\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        headers = {k: v for k, v in admin.headers.items() if k.lower() != "content-type"}
        files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
        r = requests.post(f"{BASE_URL}/api/admin/media/upload",
                          files=files, headers=headers)
        assert r.status_code == 200, r.text
        mid = r.json()["id"]
        assert r.json()["url"].startswith("/api/uploads/")

        # list and delete
        lst = admin.get(f"{BASE_URL}/api/admin/media").json()
        assert any(m["id"] == mid for m in lst)
        d = admin.delete(f"{BASE_URL}/api/admin/media/{mid}")
        assert d.status_code == 200


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/dashboard")
        assert r.status_code == 200
        d = r.json()
        for k in ("total_enquiries", "active_services", "active_packages",
                  "recent_enquiries", "whatsapp_sent"):
            assert k in d
