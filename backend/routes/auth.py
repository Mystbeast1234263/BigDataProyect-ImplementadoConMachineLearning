from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

# Import with fallback for different execution contexts
try:
    from models import LoginRequest, LoginResponse, User
    from services.auth_service import (
        get_auth_service,
        get_user_service,
        AuthService,
        UserService
    )
except ImportError:
    from backend.models import LoginRequest, LoginResponse, User
    from backend.services.auth_service import (
        get_auth_service,
        get_user_service,
        AuthService,
        UserService
    )

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer()

auth_service = get_auth_service()
user_service = get_user_service()


# ============================================================================
# DEPENDENCY: Get current user from token
# ============================================================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get current user from JWT token"""
    token = credentials.credentials

    payload = auth_service.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    user_id = payload.get("sub")

    if not email or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
        )

    user = user_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    User login endpoint

    Returns JWT access token on successful login
    """
    user = user_service.authenticate_user(request.email, request.password)

    if not user:
        logger.warning(f"Failed login attempt: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT token
    token, expire = auth_service.create_user_token(
        user_id=user["id"],
        email=user["email"],
        rol=user["rol"]
    )

    logger.info(f"User logged in: {request.email}")

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=str(user["id"]),  # Convert to string for Pydantic
        email=user["email"],
        rol=user["rol"]
    )


@router.post("/register", response_model=LoginResponse)
async def register(request: LoginRequest):
    """
    User registration endpoint

    Creates a new user account with viewer role
    """
    if user_service.user_exists(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )

    try:
        user = user_service.create_user(
            email=request.email,
            password=request.password,
            rol="viewer"  # Default role
        )

        # Create JWT token
        token, expire = auth_service.create_user_token(
            user_id=user["id"],
            email=user["email"],
            rol=user["rol"]
        )

        logger.info(f"New user registered: {request.email}")

        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user_id=str(user["id"]),  # Convert to string for Pydantic
            email=user["email"],
            rol=user["rol"]
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    User logout endpoint

    (Token-based logout - client should discard the token)
    """
    logger.info(f"User logged out: {current_user['email']}")

    return {
        "message": "Logged out successfully",
        "email": current_user["email"]
    }


@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current user info

    Requires valid JWT token
    """
    return User(
        id=current_user["id"],
        email=current_user["email"],
        rol=current_user["rol"],
        created_at=current_user["created_at"],
        updated_at=current_user["updated_at"]
    )


@router.post("/refresh")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Refresh JWT token

    Returns a new access token
    """
    token, expire = auth_service.create_user_token(
        user_id=current_user["id"],
        email=current_user["email"],
        rol=current_user["rol"]
    )

    logger.info(f"Token refreshed for user: {current_user['email']}")

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=str(current_user["id"]),  # Convert to string for Pydantic
        email=current_user["email"],
        rol=current_user["rol"]
    )


# ============================================================================
# TEST ENDPOINTS (for development)
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint (no auth required)"""
    return {
        "status": "healthy",
        "service": "Authentication API",
        "version": "1.0.0"
    }


@router.get("/demo-users")
async def get_demo_users():
    """Get list of demo users (for testing)"""
    user_service.init_demo_users()

    return {
        "message": "Demo users initialized",
        "users": [
            {
                "email": "admin@gamc.bo",
                "password": "admin123",
                "rol": "admin"
            },
            {
                "email": "operador@gamc.bo",
                "password": "operador123",
                "rol": "operador"
            },
            {
                "email": "viewer@gamc.bo",
                "password": "viewer123",
                "rol": "viewer"
            }
        ]
    }
