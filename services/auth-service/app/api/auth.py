"""
Auth API endpoints
Location: services/auth-service/app/api/auth.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.core.database import get_db_session
from app.core.security import verify_token, create_access_token, decode_token
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenRefreshRequest,
    AuthResponse,
    UserResponse,
    TokenResponse,
    UserMeResponse
)
from app.services.user_service import UserService
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Register a new user
    """
    try:
        service = UserService(db)
        result = await service.register(user_data)

        user = await service.get_user_by_id(result["user_id"])

        return AuthResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            user=UserResponse.model_validate(user),
            token_type="bearer"
        )

    except ValueError as e:
        logger.warning(f"Registration failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLoginRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    User login
    """
    try:
        service = UserService(db)
        result = await service.login(credentials.email, credentials.password)

        user = await service.get_user_by_id(result["user_id"])

        return AuthResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            user=UserResponse.model_validate(user),
            token_type="bearer"
        )

    except ValueError as e:
        logger.warning(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(request: TokenRefreshRequest):
    """
    Refresh access token using refresh token
    """
    try:
        payload = verify_token(request.refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        user_id = payload.get("sub")
        email = payload.get("email")

        # Create new access token
        new_access_token = create_access_token(
            data={"sub": user_id, "email": email}
        )

        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=1800
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.get("/me", response_model=UserMeResponse)
async def get_current_user(
    authorization: str = None,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current authenticated user info
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authorization header"
            )

        token = authorization.split(" ")[1]
        user_id = decode_token(token)

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        service = UserService(db)
        user = await service.get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserMeResponse.model_validate(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user info"
        )


@router.get("/admin/users")
async def admin_list_users(db: AsyncSession = Depends(get_db_session)):
    """Admin: list all users"""
    from sqlalchemy import select
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "status": u.status.value if hasattr(u.status, 'value') else u.status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": len(users),
    }


@router.get("/admin/stats")
async def admin_auth_stats(db: AsyncSession = Depends(get_db_session)):
    """Admin: user statistics"""
    from sqlalchemy import select, func
    total = await db.scalar(select(func.count(User.id)))
    active = await db.scalar(select(func.count(User.id)).where(User.status == "active"))
    admins = await db.scalar(select(func.count(User.id)).where(User.role == "admin"))
    return {
        "total_users": total or 0,
        "active_users": active or 0,
        "admin_users": admins or 0,
    }
