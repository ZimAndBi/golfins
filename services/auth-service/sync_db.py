
import asyncio
import logging
from app.models.user import Base
from app.core.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def sync_db():
    try:
        async with engine.begin() as conn:
            # This will create tables that don't exist
            # but it won't add missing columns to existing tables
            await conn.run_sync(Base.metadata.create_all)
        print("Database sync command executed successfully")
    except Exception as e:
        print(f"Error syncing database: {e}")

if __name__ == "__main__":
    asyncio.run(sync_db())
