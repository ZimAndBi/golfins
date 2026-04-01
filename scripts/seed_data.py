"""
Seed sample data for Golfins platform
Run: python scripts/seed_data.py
"""

import asyncio
import asyncpg
import uuid
from datetime import datetime, timedelta
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://golfins_user:golfins_pass@localhost:5432/golfins"
)

PRODUCTS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Round Play Insurance",
        "description": "Coverage per round of golf. Protect yourself from equipment damage, injury, and liability during a single round.",
        "product_type": "round_play",
        "status": "active",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Annual Golf Pass",
        "description": "Full year of unlimited golf coverage. Best value for regular golfers with additional equipment and hole-in-one benefits.",
        "product_type": "annual",
        "status": "active",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Equipment Insurance",
        "description": "Dedicated coverage for your golf equipment — clubs, bags, and accessories against theft, loss, or damage.",
        "product_type": "equipment",
        "status": "active",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Hole-in-One Insurance",
        "description": "Special event coverage for hole-in-one celebrations. Cover bar tabs, gifts, and party costs when you ace a hole.",
        "product_type": "hole_in_one",
        "status": "active",
    },
]

GOLF_COURSES = [
    {
        "id": str(uuid.uuid4()),
        "name": "Hanoi Golf Club",
        "location": "Hanoi, Vietnam",
        "holes": 18,
        "status": "active",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Ho Chi Minh City Golf Course",
        "location": "Ho Chi Minh City, Vietnam",
        "holes": 18,
        "status": "active",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Da Nang Dragon Golf Club",
        "location": "Da Nang, Vietnam",
        "holes": 18,
        "status": "active",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Vinpearl Golf Club",
        "location": "Nha Trang, Vietnam",
        "holes": 18,
        "status": "active",
    },
    {
        "id": str(uuid.uuid4()),
        "name": "BRG King's Island Golf Resort",
        "location": "Hanoi, Vietnam",
        "holes": 36,
        "status": "active",
    },
]

PREMIUM_RULES = [
    # Age rules
    {"id": str(uuid.uuid4()), "rule_type": "age", "condition": "age < 30", "adjustment_type": "percentage", "adjustment_value": -15, "description": "Young golfer discount (under 30)"},
    {"id": str(uuid.uuid4()), "rule_type": "age", "condition": "age >= 60", "adjustment_type": "percentage", "adjustment_value": 20, "description": "Senior surcharge (60+)"},
    # Handicap rules
    {"id": str(uuid.uuid4()), "rule_type": "handicap", "condition": "handicap < 5", "adjustment_type": "percentage", "adjustment_value": 15, "description": "Low handicap surcharge (scratch/near-scratch)"},
    {"id": str(uuid.uuid4()), "rule_type": "handicap", "condition": "handicap < 10", "adjustment_type": "percentage", "adjustment_value": 10, "description": "Skilled golfer surcharge (handicap < 10)"},
    {"id": str(uuid.uuid4()), "rule_type": "handicap", "condition": "handicap > 20", "adjustment_type": "percentage", "adjustment_value": -5, "description": "High handicap discount (casual golfer)"},
    # Frequency rules
    {"id": str(uuid.uuid4()), "rule_type": "frequency", "condition": "rounds_per_year >= 50", "adjustment_type": "percentage", "adjustment_value": -10, "description": "Frequent player discount (50+ rounds/year)"},
    {"id": str(uuid.uuid4()), "rule_type": "frequency", "condition": "rounds_per_year >= 30", "adjustment_type": "flat", "adjustment_value": 5, "description": "Active golfer fee (30+ rounds/year)"},
]

# Sample policies (linked to test user — will be inserted if user exists)
SAMPLE_POLICIES = [
    {
        "policy_number": "POL-DEMO01",
        "product_type": "annual",
        "status": "active",
        "premium_amount": 299.00,
        "start_date": datetime.utcnow() - timedelta(days=30),
        "end_date": datetime.utcnow() + timedelta(days=335),
    },
    {
        "policy_number": "POL-DEMO02",
        "product_type": "round_play",
        "status": "active",
        "premium_amount": 45.00,
        "start_date": datetime.utcnow() - timedelta(days=5),
        "end_date": datetime.utcnow() + timedelta(days=1),
    },
    {
        "policy_number": "POL-DEMO03",
        "product_type": "equipment",
        "status": "expired",
        "premium_amount": 120.00,
        "start_date": datetime.utcnow() - timedelta(days=400),
        "end_date": datetime.utcnow() - timedelta(days=35),
    },
]


async def seed():
    print("[*] Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    print("[OK] Connected!\n")

    try:
        # ── Products ──────────────────────────────────────────
        print("[*] Seeding products...")
        for p in PRODUCTS:
            await conn.execute("""
                INSERT INTO products (id, name, description, product_type, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            """, p["id"], p["name"], p["description"], p["product_type"], p["status"],
                datetime.now(), datetime.now())
        print(f"  [OK] {len(PRODUCTS)} products seeded")

        # ── Golf Courses ──────────────────────────────────────
        print("[*] Seeding golf courses...")
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'golf_courses'
            )
        """)
        if table_exists:
            for c in GOLF_COURSES:
                await conn.execute("""
                    INSERT INTO golf_courses (id, name, location, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT DO NOTHING
                """, c["id"], c["name"], c["location"], c["status"],
                    datetime.now(), datetime.now())
            print(f"  [OK] {len(GOLF_COURSES)} golf courses seeded")
        else:
            print("  [SKIP] golf_courses table not found")

        # ── Premium Rules ─────────────────────────────────────
        print("[*] Seeding premium rules...")
        rules_exist = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'premium_rules'
            )
        """)
        if rules_exist:
            for r in PREMIUM_RULES:
                await conn.execute("""
                    INSERT INTO premium_rules (id, rule_type, condition, adjustment_type, adjustment_value, description, is_active, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, true, $7)
                    ON CONFLICT DO NOTHING
                """, r["id"], r["rule_type"], r["condition"], r["adjustment_type"],
                    float(r["adjustment_value"]), r["description"], datetime.now())
            print(f"  [OK] {len(PREMIUM_RULES)} premium rules seeded")
        else:
            print("  [SKIP] premium_rules table not found")

        # ── Sample Policies for test user ─────────────────────
        print("[*] Seeding sample policies for test user...")
        user_id = await conn.fetchval(
            "SELECT id FROM users WHERE email = 'test@golfins.com' LIMIT 1"
        )
        if user_id:
            product_ids = await conn.fetch("SELECT id, product_type FROM products")
            product_map = {r["product_type"]: r["id"] for r in product_ids}

            for pol in SAMPLE_POLICIES:
                product_id = product_map.get(pol["product_type"])
                if not product_id:
                    continue
                pol_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO policies (
                        id, policy_number, user_id, product_id, status,
                        premium_amount, created_at, updated_at
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                    ON CONFLICT (policy_number) DO NOTHING
                """, pol_id, pol["policy_number"], str(user_id), str(product_id),
                    pol["status"], pol["premium_amount"],
                    datetime.now(), datetime.now())
            print(f"  [OK] {len(SAMPLE_POLICIES)} sample policies seeded for test@golfins.com")
        else:
            print("  [SKIP] test@golfins.com not found — skipping sample policies")
            print("         (Register at http://localhost:3000/register first)")

        # ── Summary ───────────────────────────────────────────
        print("\n[*] Database summary:")
        for table in ["users", "products", "policies", "claims"]:
            try:
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                print(f"  {table:20s} -> {count} rows")
            except Exception:
                print(f"  {table:20s} -> table not found")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        raise
    finally:
        await conn.close()

    print("\n[DONE] Seed complete! Visit http://localhost:3000")


if __name__ == "__main__":
    asyncio.run(seed())
