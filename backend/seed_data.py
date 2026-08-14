"""Premium demo content seeded on first startup."""
import uuid
from datetime import datetime, timezone

IMG = {
    "hero": "https://images.unsplash.com/photo-1612163863388-20210dd24336?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBkb2clMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODY2OTI4NDl8MA&ixlib=rb-4.1.0&q=85",
    "boarding": "https://images.unsplash.com/photo-1690876821983-cbb72ac167a8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGRvZyUyMHByZW1pdW0lMjBwZXQlMjBjYXJlfGVufDB8fHx8MTc4NjY5MjkxNHww&ixlib=rb-4.1.0&q=85",
    "daycare": "https://images.unsplash.com/photo-1762652847106-a7e2dc128f12?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwyfHxkb2clMjBwbGF5aW5nJTIwdHJhaW5pbmclMjBwYXJrfGVufDB8fHx8MTc4NTUyNjE4Nnww&ixlib=rb-4.1.0&q=85",
    "grooming": "https://images.unsplash.com/photo-1611173622933-91942d394b04?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxwZXQlMjBncm9vbWluZyUyMGJvYXJkaW5nJTIwZGF5Y2FyZXxlbnwwfHx8fDE3ODY2OTI5MTR8MA&ixlib=rb-4.1.0&q=85",
    "training": "https://images.unsplash.com/photo-1763989979792-67611852276b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHw0fHxkb2clMjBwbGF5aW5nJTIwdHJhaW5pbmclMjBwYXJrfGVufDB8fHx8MTc4NTUyNjE4Nnww&ixlib=rb-4.1.0&q=85",
    "wellness": "https://images.unsplash.com/photo-1630438994394-3deff7a591bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHxwcmVtaXVtJTIwcGV0JTIwY2FyZSUyMGZhY2lsaXR5fGVufDB8fHx8MTc4NjY5Mjg0OXww&ixlib=rb-4.1.0&q=85",
    "transport": "https://images.unsplash.com/photo-1600352712371-15fd49ca42b5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxoYXBweSUyMGRvZyUyMHByZW1pdW0lMjBwZXQlMjBjYXJlfGVufDB8fHx8MTc4NjY5MjkxNHww&ixlib=rb-4.1.0&q=85",
    "facility1": "https://images.unsplash.com/photo-1625321171045-1fea4ac688e9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwcGV0JTIwY2FyZSUyMGZhY2lsaXR5fGVufDB8fHx8MTc4NjY5Mjg0OXww&ixlib=rb-4.1.0&q=85",
    "facility2": "https://images.unsplash.com/photo-1715626000681-a0074b4d9783?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwcGV0JTIwY2FyZSUyMGZhY2lsaXR5fGVufDB8fHx8MTc4NjY5Mjg0OXww&ixlib=rb-4.1.0&q=85",
    "about": "https://images.unsplash.com/photo-1652342516776-fcd4c54639c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBkb2clMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODY2OTI4NDl8MA&ixlib=rb-4.1.0&q=85",
    "cat": "https://images.unsplash.com/photo-1455970022149-a8f26b6902dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHw0fHxlbGVnYW50JTIwY2F0JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzg2NjkyODQ5fDA&ixlib=rb-4.1.0&q=85",
    "poodle": "https://images.unsplash.com/photo-1581562324420-eff2f5aaa4b5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHw0fHxoYXBweSUyMGRvZyUyMHByZW1pdW0lMjBwZXQlMjBjYXJlfGVufDB8fHx8MTc4NjY5MjkxNHww&ixlib=rb-4.1.0&q=85",
    "collie": "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMHByZW1pdW0lMjBwZXQlMjBjYXJlfGVufDB8fHx8MTc4NjY5MjkxNHww&ixlib=rb-4.1.0&q=85",
    "frenchie": "https://images.unsplash.com/photo-1597595735781-6a57fb8e3e3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHw0fHxwZXQlMjBncm9vbWluZyUyMGJvYXJkaW5nJTIwZGF5Y2FyZXxlbnwwfHx8fDE3ODY2OTI5MTR8MA&ixlib=rb-4.1.0&q=85",
    "pug": "https://images.unsplash.com/photo-1606098216818-40939b7c98ad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwyfHxjYXQlMjBhbmQlMjBkb2clMjBwb3J0cmFpdCUyMHN0dWRpb3xlbnwwfHx8fDE3ODY2OTI5MjN8MA&ixlib=rb-4.1.0&q=85",
    "duo": "https://images.unsplash.com/photo-1718885433034-908d5bca08cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHw0fHxjYXQlMjBhbmQlMjBkb2clMjBwb3J0cmFpdCUyMHN0dWRpb3xlbnwwfHx8fDE3ODY2OTI5MjN8MA&ixlib=rb-4.1.0&q=85",
    "frisbee": "https://images.unsplash.com/photo-1761583779488-22dfd117f88d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwxfHxkb2clMjBwbGF5aW5nJTIwdHJhaW5pbmclMjBwYXJrfGVufDB8fHx8MTc4NTUyNjE4Nnww&ixlib=rb-4.1.0&q=85",
}


def _now():
    return datetime.now(timezone.utc).isoformat()


def service(order, name, slug, icon, short, full, img, price, dur, features, highlights):
    return {
        "id": str(uuid.uuid4()), "name": name, "slug": slug, "icon": icon,
        "short_description": short, "full_description": full,
        "image": img, "gallery": [], "features": features, "highlights": highlights,
        "starting_price": price, "duration": dur, "faqs": [],
        "cta_text": "Book Now", "seo_title": f"{name} | Pawsome",
        "seo_description": short, "status": "published", "display_order": order,
        "created_at": _now(), "updated_at": _now(),
    }


def package(order, name, slug, desc, img, price, starting, dur, included, benefits, featured, popular):
    return {
        "id": str(uuid.uuid4()), "name": name, "slug": slug, "description": desc,
        "image": img, "gallery": [], "price": price, "starting_price": starting,
        "duration": dur, "included_services": included, "benefits": benefits,
        "terms": "Prices are indicative. Final booking is confirmed via our booking system.",
        "cta_text": "Book This Package", "featured": featured, "most_popular": popular,
        "seo_title": f"{name} | Pawsome", "seo_description": desc,
        "status": "published", "display_order": order,
        "created_at": _now(), "updated_at": _now(),
    }


def testimonial(order, cust, pet, img, rating, text, svc, featured):
    return {
        "id": str(uuid.uuid4()), "customer_name": cust, "pet_name": pet, "image": img,
        "rating": rating, "testimonial": text, "service": svc,
        "date": "2026-05-01", "featured": featured, "published": True,
        "display_order": order, "created_at": _now(), "updated_at": _now(),
    }


def faq(order, q, a, cat):
    return {
        "id": str(uuid.uuid4()), "question": q, "answer": a, "category": cat,
        "related_service": "", "display_order": order, "published": True,
        "created_at": _now(), "updated_at": _now(),
    }


def gallery(order, img, cat, caption, alt, featured, mtype="image"):
    return {
        "id": str(uuid.uuid4()), "url": img, "media_type": mtype, "category": cat,
        "caption": caption, "alt_text": alt, "featured": featured,
        "display_order": order, "created_at": _now(), "updated_at": _now(),
    }


def build_services():
    return [
        service(1, "Boarding", "boarding", "home",
                "Safe and comfortable overnight boarding for your pet.",
                "Our premium boarding suites give your pet a cosy home away from home. Climate-controlled rooms, soft bedding, round-the-clock supervision and plenty of affection ensure your companion feels safe and loved every moment you're away.",
                IMG["boarding"], "$45 / night", "Per night",
                ["Private climate-controlled suites", "24/7 supervision", "Daily walks & playtime", "Live photo updates"],
                ["Spacious suites", "Trained caretakers", "Healthy meals"]),
        service(2, "Daycare", "daycare", "sun",
                "Fun and supervised daycare full of play and friends.",
                "A joyful day of structured play, socialisation and rest. Our supervised daycare keeps your pet active, engaged and happy with dedicated play zones and gentle handlers who know every pet by name.",
                IMG["daycare"], "$30 / day", "Full day",
                ["Supervised group play", "Rest & nap zones", "Socialisation groups", "Enrichment activities"],
                ["Play all day", "Make furry friends", "Come home happy"]),
        service(3, "Grooming", "grooming", "scissors",
                "Professional grooming, bathing and hygiene care.",
                "From a refreshing bath to a full styling session, our certified groomers pamper your pet with premium, pet-safe products. Nail trims, ear cleaning, de-shedding and breed-specific styling included.",
                IMG["grooming"], "$40", "1–2 hours",
                ["Bath & blow-dry", "Breed-specific styling", "Nail & ear care", "Pet-safe products"],
                ["Certified groomers", "Gentle handling", "Fresh & fluffy"]),
        service(4, "Training", "training", "graduation-cap",
                "Positive-reinforcement training and behaviour support.",
                "Our reward-based training builds confidence and good manners. From puppy basics to behaviour support, our certified trainers create personalised programs that strengthen the bond between you and your pet.",
                IMG["training"], "$60 / session", "45 min",
                ["Positive reinforcement", "Personalised plans", "Puppy & adult classes", "Behaviour support"],
                ["Certified trainers", "Proven methods", "Real results"]),
        service(5, "Wellness", "wellness", "heart-pulse",
                "Wellness-focused care to keep pets healthy and happy.",
                "Holistic wellness check-ins, weight monitoring, coat and dental care guidance and coordination with your vet. We focus on prevention so your pet stays vibrant and healthy year-round.",
                IMG["wellness"], "$35", "30 min",
                ["Wellness check-ins", "Weight monitoring", "Diet guidance", "Vet coordination"],
                ["Preventive care", "Health tracking", "Peace of mind"]),
        service(6, "Pet Transport", "pet-transport", "truck",
                "Safe, comfortable pet transportation to and from us.",
                "Door-to-door pet transport in temperature-controlled, sanitised vehicles with secure crating and trained handlers. Perfect for busy pet parents who want stress-free pickups and drop-offs.",
                IMG["transport"], "$20 / trip", "Per trip",
                ["Climate-controlled vehicles", "Secure crating", "Trained handlers", "Door-to-door service"],
                ["Stress-free travel", "Always supervised", "On-time"]),
    ]


def build_packages():
    return [
        package(1, "Weekend Getaway", "weekend-getaway",
                "Two nights of premium boarding with play, grooming touch-up and daily updates.",
                IMG["boarding"], "$120", "$120", "2 nights",
                ["Boarding", "Daycare", "Grooming"],
                ["2 nights premium suite", "Daily play sessions", "Bath before pickup", "Live photo updates"],
                True, False),
        package(2, "Pamper & Play Day", "pamper-and-play-day",
                "A full day of supervised daycare paired with a complete grooming session.",
                IMG["grooming"], "$65", "$65", "1 day",
                ["Daycare", "Grooming"],
                ["Full-day daycare", "Complete grooming", "Nail & ear care", "Happy tired pet"],
                True, True),
        package(3, "New Puppy Starter", "new-puppy-starter",
                "Everything a new puppy needs — training basics, wellness check and socialised daycare.",
                IMG["poodle"], "$150", "$150", "3 sessions",
                ["Training", "Wellness", "Daycare"],
                ["3 training sessions", "Wellness check-in", "Socialisation daycare", "Puppy care guide"],
                False, False),
        package(4, "Monthly Wellness Club", "monthly-wellness-club",
                "A monthly membership blending wellness, grooming and priority daycare access.",
                IMG["wellness"], "$220 / month", "$220", "Monthly",
                ["Wellness", "Grooming", "Daycare"],
                ["Monthly wellness checks", "2 grooming sessions", "Priority daycare", "Member discounts"],
                False, False),
    ]


def build_testimonials():
    return [
        testimonial(1, "Aisha Khan", "Milo", IMG["collie"], 5,
                    "The team treated Milo like their own. The live photo updates during boarding gave me such peace of mind. Absolutely premium care!", "Boarding", True),
        testimonial(2, "Rohan Mehta", "Bella", IMG["frenchie"], 5,
                    "Bella comes home from daycare happy and tired every single time. The staff genuinely love the pets. Highly recommend!", "Daycare", True),
        testimonial(3, "Sara Williams", "Coco", IMG["poodle"], 5,
                    "Best grooming in town. Coco looked and smelled amazing, and the groomers were so gentle and patient with her.", "Grooming", True),
        testimonial(4, "David Chen", "Rex", IMG["frisbee"], 5,
                    "The training program transformed Rex. Positive, professional and effective. We finally have calm walks together!", "Training", False),
    ]


def build_faqs():
    return [
        faq(1, "How do I book a service?", "Simply click the Book Now button anywhere on the site. You'll be taken to our secure booking system where you can choose your service, date and time.", "General"),
        faq(2, "What are your opening hours?", "We're open Monday to Saturday, 8:00 AM to 8:00 PM, and Sundays 9:00 AM to 5:00 PM. Boarding guests are cared for 24/7.", "General"),
        faq(3, "Is my pet supervised at all times during boarding?", "Yes. Our boarding guests receive round-the-clock supervision from trained caretakers, with regular walks, playtime and comfort checks.", "Boarding"),
        faq(4, "What vaccinations are required for daycare?", "We require core vaccinations to be up to date to keep all our guests safe. Please bring records on your pet's first visit.", "Daycare"),
        faq(5, "Which grooming products do you use?", "We use only premium, pet-safe, hypoallergenic products suitable for sensitive skin and all coat types.", "Grooming"),
        faq(6, "Do you offer puppy training?", "Absolutely. Our positive-reinforcement puppy classes cover basics, socialisation and confidence-building.", "Training"),
        faq(7, "Can I customise a package?", "Yes! Contact us via WhatsApp or the enquiry form and our team will tailor a package to your pet's needs.", "Packages"),
    ]


def build_gallery():
    items = [
        (IMG["boarding"], "Boarding", "Cosy boarding suites", "Dog resting in boarding suite", True),
        (IMG["daycare"], "Daycare", "Daycare play time", "Dogs playing in daycare", False),
        (IMG["grooming"], "Grooming", "Spa-day grooming", "Dog being groomed", True),
        (IMG["training"], "Training", "Training session", "Dog training with trainer", False),
        (IMG["facility1"], "Facility", "Our premium facility", "Interior of pet facility", True),
        (IMG["facility2"], "Facility", "Comfort spaces", "Comfortable pet space", False),
        (IMG["frisbee"], "Pets", "Playful pups", "Dog catching frisbee", False),
        (IMG["cat"], "Pets", "Feline guests welcome", "Elegant cat portrait", True),
        (IMG["duo"], "Events", "Furry friends", "Cat and dog together", False),
        (IMG["poodle"], "Grooming", "Fresh and fluffy", "Groomed white poodle", False),
        (IMG["frenchie"], "Grooming", "Bath time joy", "French bulldog bath", False),
        (IMG["pug"], "Pets", "Best buddies", "Cat and pug portrait", False),
    ]
    return [gallery(i + 1, url, cat, cap, alt, feat) for i, (url, cat, cap, alt, feat) in enumerate(items)]


def build_navigation():
    links = [
        ("Home", "/", 1, "link"),
        ("About", "/about", 2, "link"),
        ("Services", "/services", 3, "link"),
        ("Gallery", "/gallery", 4, "link"),
        ("Packages", "/packages", 5, "link"),
        ("Contact", "/contact", 6, "link"),
        ("Book Now", "__book_now__", 7, "cta"),
    ]
    return [{
        "id": str(uuid.uuid4()), "label": label, "url": url, "display_order": order,
        "style": style, "visible": True, "new_tab": False,
        "created_at": _now(), "updated_at": _now(),
    } for label, url, order, style in links]


def build_settings():
    return {
        "id": "site",
        "business_name": "Pawsome Pet Care",
        "logo": "",
        "tagline": "Care. Comfort. Connection.",
        "phone": "+1 (555) 123-4567",
        "secondary_phone": "",
        "whatsapp": "15551234567",
        "email": "hello@pawsome.com",
        "address": "142 Maple Grove Avenue, Greenfield, CA 94040",
        "maps_embed": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3168.99!2d-122.08!3d37.42!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDI1JzEyLjAiTiAxMjLCsDA0JzQ4LjAiVw!5e0!3m2!1sen!2sus!4v1600000000000",
        "opening_hours": [
            {"day": "Monday – Friday", "hours": "8:00 AM – 8:00 PM"},
            {"day": "Saturday", "hours": "8:00 AM – 8:00 PM"},
            {"day": "Sunday", "hours": "9:00 AM – 5:00 PM"},
        ],
        "social": {"instagram": "https://instagram.com", "facebook": "https://facebook.com", "twitter": ""},
        "cta": {
            "book_now_text": "Book Now",
            "book_now_enabled": True,
            "destination_type": "erp_booking",
            "erp_booking_url": "https://erp.yourdomain.com/booking",
            "open_behavior": "new_tab",
            "mobile_sticky_cta": True,
        },
        "whatsapp_settings": {
            "provider": "mock",
            "default_message": "Hi, I would like to know more about your pet-care services.",
            "automation": {
                "booking_confirmation": True,
                "enquiry_received": True,
                "booking_created": True,
                "booking_status_update": True,
            },
        },
        "seo": {
            "title": "Pawsome Pet Care | Premium Boarding, Daycare & Grooming",
            "meta_description": "Premium pet care with personalised attention. Boarding, daycare, grooming, training and wellness designed around the pets you love.",
            "og_image": IMG["hero"],
            "favicon": "",
            "analytics": "",
            "search_console": "",
        },
        "updated_at": _now(),
    }


def build_homepage():
    return {
        "id": "homepage",
        "hero": {
            "eyebrow": "Care. Comfort. Connection.",
            "heading": "Happy Pets. Happy Hearts.",
            "description": "Premium care and personalised attention designed around the pets you love.",
            "image": IMG["hero"],
            "video": "",
            "primary_cta_text": "Book Now",
            "secondary_cta_text": "Explore Services",
            "trust_indicators": ["Safe Environment", "Experienced Team", "Clean & Hygienic", "Personalised Care"],
        },
        "services_section": {"heading": "Our Services", "description": "Thoughtful, premium care for every part of your pet's life.", "enabled": True},
        "introduction": {
            "heading": "A premium pet-care lifestyle brand",
            "description": "At Pawsome, we believe pets are family. Our thoughtfully designed spaces, experienced team and genuine love for animals create an environment where your companion feels safe, stimulated and cherished — every single visit.",
            "image": IMG["about"],
            "cta_text": "About Us",
            "enabled": True,
        },
        "why_choose_us": {
            "heading": "Why pet parents choose us",
            "description": "Everything we do is built around trust, safety and love.",
            "features": [
                {"title": "Safe Environment", "description": "Secure, monitored spaces designed for your pet's safety.", "icon": "shield-check"},
                {"title": "Experienced Team", "description": "Certified, caring professionals who love what they do.", "icon": "users"},
                {"title": "Clean & Hygienic", "description": "Spotless facilities cleaned to the highest standards.", "icon": "sparkles"},
                {"title": "Personalised Care", "description": "Every pet gets attention tailored to their needs.", "icon": "heart"},
            ],
            "enabled": True,
        },
        "facility": {
            "heading": "A facility designed for pets",
            "description": "Spacious play areas, cosy boarding suites, dedicated grooming stations and safe outdoor spaces — every corner crafted with your pet's comfort in mind.",
            "images": [IMG["facility1"], IMG["facility2"], IMG["daycare"]],
            "enabled": True,
        },
        "journey": {
            "heading": "Your pet parent journey",
            "steps": [
                {"number": "01", "title": "Discover", "description": "Explore our services and packages designed for every pet."},
                {"number": "02", "title": "Connect", "description": "WhatsApp or call our team to ask questions and plan."},
                {"number": "03", "title": "Book", "description": "Continue to our secure booking system to confirm."},
            ],
            "enabled": True,
        },
        "packages_section": {"heading": "Popular Packages", "description": "Curated bundles for the best value and care.", "enabled": True},
        "testimonials_section": {"heading": "Loved by pet parents", "description": "Real stories from our Pawsome family.", "enabled": True},
        "gallery_section": {"heading": "Moments at Pawsome", "description": "A glimpse into the joy of everyday care.", "enabled": True},
        "faq_section": {"heading": "Frequently asked questions", "description": "Everything you need to know before your visit.", "enabled": True},
        "final_cta": {
            "heading": "Ready to give your pet the best?",
            "description": "Book a service today or reach out — we'd love to meet your furry family member.",
            "primary_cta_text": "Book Now",
            "enabled": True,
        },
        "updated_at": _now(),
    }


def build_about():
    return {
        "id": "about",
        "hero_heading": "Our Story",
        "hero_description": "Built on love, trust and a lifelong devotion to animals.",
        "hero_image": IMG["about"],
        "sections": [
            {"key": "story", "heading": "Brand Story", "description": "Pawsome began with a simple belief: pets deserve the same warmth and care as any family member. What started as a small boarding home has grown into a premium pet-care destination trusted by hundreds of families.", "image": IMG["boarding"], "visible": True},
            {"key": "mission", "heading": "Our Mission", "description": "To provide safe, loving and enriching care that lets pets thrive and gives pet parents complete peace of mind.", "image": "", "visible": True},
            {"key": "philosophy", "heading": "Our Philosophy", "description": "Every pet is an individual. We take the time to understand each one's personality, needs and quirks — then tailor everything around them.", "image": "", "visible": True},
            {"key": "approach", "heading": "Our Approach", "description": "Positive, gentle and science-informed. From play to training to grooming, we lead with kindness and patience.", "image": IMG["training"], "visible": True},
            {"key": "team", "heading": "Our Team", "description": "Certified caretakers, groomers and trainers who genuinely adore animals and treat every guest like their own.", "image": IMG["facility1"], "visible": True},
            {"key": "promise", "heading": "Our Promise", "description": "Your pet's safety, happiness and wellbeing will always come first. That's the Pawsome promise.", "image": "", "visible": True},
        ],
        "cta_text": "Book Now",
        "updated_at": _now(),
    }


async def seed_content(db):
    if await db.settings.find_one({"id": "site"}) is None:
        await db.settings.insert_one(build_settings())
    if await db.homepage.find_one({"id": "homepage"}) is None:
        await db.homepage.insert_one(build_homepage())
    if await db.about.find_one({"id": "about"}) is None:
        await db.about.insert_one(build_about())
    if await db.services.count_documents({}) == 0:
        await db.services.insert_many(build_services())
    if await db.packages.count_documents({}) == 0:
        await db.packages.insert_many(build_packages())
    if await db.testimonials.count_documents({}) == 0:
        await db.testimonials.insert_many(build_testimonials())
    if await db.faqs.count_documents({}) == 0:
        await db.faqs.insert_many(build_faqs())
    if await db.gallery.count_documents({}) == 0:
        await db.gallery.insert_many(build_gallery())
    if await db.navigation.count_documents({}) == 0:
        await db.navigation.insert_many(build_navigation())
