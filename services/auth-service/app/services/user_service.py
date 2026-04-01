"""
User service - Business logic
Location: services/auth-service/app/services/user_service.py
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
import logging
from app.models.user import User, UserRole, UserStatus
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.schemas.user import UserRegisterRequest, UserLoginRequest
from datetime import timedelta

logger = logging.getLogger(__name__)


class UserService:
    """Service for user-related operations"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def register(self, user_data: UserRegisterRequest) -> dict:
        """
        Register a new user
        Returns: user_id, access_token, refresh_token
        """
        try:
            # Check if user already exists
            existing = await self.get_user_by_email(user_data.email)
            if existing:
                raise ValueError(f"User with email {user_data.email} already exists")

            # Create new user
            user = User(
                email=user_data.email,
                password_hash=hash_password(user_data.password),
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                phone=user_data.phone,
                role=UserRole.CUSTOMER,
                status=UserStatus.ACTIVE,
                email_verified=False
            )

            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)

            logger.info(f"User registered: {user.email}")

            # Generate tokens
            access_token = create_access_token(
                data={"sub": user.id, "email": user.email, "role": user.role.value}
            )
            refresh_token = create_refresh_token(
                data={"sub": user.id, "email": user.email}
            )

            return {
                "user_id": user.id,
                "email": user.email,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": 1800  # 30 minutes
            }

        except IntegrityError:
            await self.db.rollback()
            raise ValueError("User with this email already exists")
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error registering user: {str(e)}")
            raise

    async def login(self, username: str, password: str) -> dict:
        """
        Authenticate user and return tokens
        Returns: user_id, access_token, refresh_token, user_data
        """
        user = await self.get_user_by_email(username)

        if not user:
            raise ValueError("Invalid email or password")

        if user.status != UserStatus.ACTIVE:
            raise ValueError("User account is not active")

        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        # Generate tokens
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role.value}
        )
        refresh_token = create_refresh_token(
            data={"sub": user.id, "email": user.email}
        )

        logger.info(f"User logged in: {user.email}")

        return {
            "user_id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 1800
        }

    async def get_user_by_id(self, user_id: str) -> User:
        """Get user by ID"""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User:
        """Get user by email"""
        stmt = select(User).where(User.email == email).where(User.deleted_at.is_(None))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_user(self, user_id: str, update_data: dict) -> User:
        """Update user"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        for field, value in update_data.items():
            if value is not None:
                setattr(user, field, value)

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User updated: {user.email}")

        return user

    async def deactivate_user(self, user_id: str) -> User:
        """Deactivate user account"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        user.status = UserStatus.INACTIVE

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User deactivated: {user.email}")

        return user
