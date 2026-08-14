# Pawsome Pet Care — Product Requirements Document

## Original Problem Statement
Premium pet-care public website + a SEPARATE single-admin Website Admin Panel. The existing ERP/CRM (external) remains the single source of truth for real bookings. The website never duplicates the ERP/CRM/booking form/database. All "Book Now" buttons redirect to a central ERP booking URL configured in admin. WhatsApp + Call floating actions (numbers admin-controlled). Separate website enquiry form (not a booking). WhatsApp automation after ERP booking (via webhook) and after website enquiry. Single admin login, no roles. Fully responsive, mobile-first.

## Architecture
- **Frontend**: React (CRA/craco), Tailwind, framer-motion, sonner. Public site + Admin CMS in one app.
- **Backend**: FastAPI, Motor/MongoDB. All routes prefixed `/api`.
- **Auth**: JWT (httpOnly cookies + bearer token), single seeded admin. `auth.py`.
- **WhatsApp**: `whatsapp.py` provider abstraction. `WHATSAPP_PROVIDER=mock` (default) — full flow (templating, logging, duplicate prevention, retry) with NO real sends. Swap to `wati` with `WATI_API_ENDPOINT`/`WATI_API_TOKEN` to go live.
- **ERP integration boundary**: website only stores the ERP booking URL centrally (settings.cta.erp_booking_url) and exposes `POST /api/webhook/booking` (secret-header protected) for the ERP to trigger WhatsApp AFTER a booking is created. No direct ERP DB access. No invented ERP APIs.

## User Personas
- **Pet parent (public visitor)**: browses services/packages/gallery, contacts via WhatsApp/Call/enquiry, clicks Book Now → external ERP.
- **Website admin (single user)**: manages all site content & settings without code.

## Core Requirements (static)
- Premium editorial public site; dynamic services mega menu (desktop) + accordion (mobile).
- Central ERP Booking URL used by ALL Book Now buttons.
- Admin-controlled: services, packages, gallery, testimonials, faqs, homepage, about, navigation, contact/whatsapp/cta/seo settings, enquiries, media, whatsapp logs, activity logs.
- No customer login/dashboard, no roles, no duplicate booking system.

## Implemented (2026-06)
- Public pages: Home (14 sections), About, Services, Service Detail, Packages, Package Detail, Gallery (masonry + filters + lightbox), Contact (enquiry form + map + action buttons), FAQ.
- Sticky glass header w/ dynamic mega menu; mobile drawer w/ services accordion; footer; floating WhatsApp+Call; mobile sticky CTA bar on conversion pages.
- Admin: JWT login, Dashboard, generic Resource CMS (services/packages/testimonials/faqs/gallery/navigation) with create/edit/delete/duplicate/publish/reorder, Homepage editor, About editor, Enquiries manager (status/notes), Media library (upload), Contact/WhatsApp/CTA/SEO settings, WhatsApp logs (test+retry), Activity logs.
- WhatsApp automation: enquiry_received (on website enquiry), booking_confirmation (on ERP webhook), duplicate prevention by ref_id+message_type, retry, mock logging.
- Seeded premium demo content (6 services, 4 packages, testimonials, faqs, 12 gallery items, settings/homepage/about).
- Testing: backend 29/29 pytest pass; frontend flows 100%.

## Backlog / Remaining (P1/P2)
- P1: Connect real WhatsApp provider (WATI/Cloud API) with approved templates + delivery-status callbacks.
- P1: Per-page SEO meta injection (react-helmet) beyond global document.title.
- P2: Draft/Preview mode for content before publish.
- P2: Explicit CORS origin (currently `*`) if cross-origin cookie auth becomes required.
- P2: Gallery video playback in lightbox; media alt-text editing UI.

## Next Tasks
- Await real ERP booking URL + WhatsApp credentials from client, then flip provider to live and wire ERP webhook.

## Credentials
- Admin: zenlogicglobal@gmail.com / PawsAdmin@2026 (see /app/memory/test_credentials.md)
- ERP webhook: header `X-Webhook-Secret: erp-webhook-secret-change-me`
