async def seed_premium_data(db: AsyncSession):
    """Seed data using raw SQL to ensure FK satisfaction with asyncpg."""
    try:
        # Check if already seeded
        res = await db.execute(sa_text("SELECT count(*) FROM products"))
        if res.scalar() > 0:
            logger.info("Seed already exists.")
            return

        logger.info("Starting safe raw SQL seed...")
        now = datetime.utcnow().isoformat()
        
        # 1. Products
        aid = str(uuid.uuid4())
        s1id = str(uuid.uuid4())
        s2id = str(uuid.uuid4())
        
        # Annual
        await db.execute(sa_text(f"INSERT INTO products (id, name, code, product_type, currency, vat_rate, insurance_period_days, status, version, effective_date, created_at, updated_at) VALUES ('{aid}', 'Annual Program', 'ANNUAL', 'annual', 'VND', 0.1, 365, 'active', 1, '{now}', '{now}', '{now}')"))
        # Spot 1
        await db.execute(sa_text(f"INSERT INTO products (id, name, code, product_type, currency, vat_rate, insurance_period_days, status, version, effective_date, created_at, updated_at) VALUES ('{s1id}', 'Spot 1-Day', 'SPOT_1DAY', 'spot_1day', 'VND', 0.1, 1, 'active', 1, '{now}', '{now}', '{now}')"))
        # Spot 2
        await db.execute(sa_text(f"INSERT INTO products (id, name, code, product_type, currency, vat_rate, insurance_period_days, status, version, effective_date, created_at, updated_at) VALUES ('{s2id}', 'Spot 2-Day', 'SPOT_2DAY', 'spot_2day', 'VND', 0.1, 2, 'active', 1, '{now}', '{now}', '{now}')"))
        
        # 2. Coverage Options (Simplified)
        caid = str(uuid.uuid4())
        await db.execute(sa_text(f"INSERT INTO coverage_options (id, product_id, name, code, territorial_limit, sort_order, active, created_at, updated_at) VALUES ('{caid}', '{aid}', 'Liability', 'LIABILITY', 'World', 1, true, '{now}', '{now}')"))

        # 3. Plans
        pa, pb, pc = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
        await db.execute(sa_text(f"INSERT INTO premium_plans (id, product_id, name, code, net_premium, total_premium, sort_order, is_active, created_at, updated_at) VALUES ('{pa}', '{aid}', 'Plan A', 'A', 1300000, 1430000, 1, true, '{now}', '{now}')"))
        await db.execute(sa_text(f"INSERT INTO premium_plans (id, product_id, name, code, net_premium, total_premium, sort_order, is_active, created_at, updated_at) VALUES ('{pb}', '{aid}', 'Plan B', 'B', 1900000, 2090000, 2, true, '{now}', '{now}')"))
        await db.execute(sa_text(f"INSERT INTO premium_plans (id, product_id, name, code, net_premium, total_premium, sort_order, is_active, created_at, updated_at) VALUES ('{pc}', '{aid}', 'Plan C', 'C', 2800000, 3080000, 3, true, '{now}', '{now}')"))

        ps1 = str(uuid.uuid4())
        await db.execute(sa_text(f"INSERT INTO premium_plans (id, product_id, name, code, net_premium, total_premium, sort_order, is_active, created_at, updated_at) VALUES ('{ps1}', '{s1id}', '1-Day Plan', '1DAY', 90909, 100000, 1, true, '{now}', '{now}')"))
        
        ps2 = str(uuid.uuid4())
        await db.execute(sa_text(f"INSERT INTO premium_plans (id, product_id, name, code, net_premium, total_premium, sort_order, is_active, created_at, updated_at) VALUES ('{ps2}', '{s2id}', '2-Day Plan', '2DAY', 177273, 195000, 1, true, '{now}', '{now}')"))

        await db.commit()
        logger.info("✅ Final Seed Successful")
    except Exception as e:
        logger.error(f"❌ Seed Crash: {e}")
        await db.rollback()
