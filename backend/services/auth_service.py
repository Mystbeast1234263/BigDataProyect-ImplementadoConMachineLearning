from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
import bcrypt
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
import logging

# Cargar .env desde la raíz del proyecto
dotenv_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(dotenv_path)

logger = logging.getLogger(__name__)

# ============================================================================
# AUTH SERVICE - JWT & PASSWORD HASHING
# ============================================================================

class AuthService:
    """Service for authentication operations (JWT, password hashing)"""

    # Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-fastapi-12345")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        try:
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
            return hashed.decode('utf-8')
        except Exception as e:
            logger.error(f"Error hashing password: {e}")
            raise

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed one"""
        try:
            return bcrypt.checkpw(
                plain_password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False

    @classmethod
    def create_access_token(
        cls,
        data: Dict,
        expires_delta: Optional[timedelta] = None
    ) -> Tuple[str, datetime]:
        """Create a JWT access token"""
        try:
            to_encode = data.copy()

            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(
                    minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES
                )

            to_encode.update({"exp": expire})

            encoded_jwt = jwt.encode(
                to_encode,
                cls.SECRET_KEY,
                algorithm=cls.ALGORITHM
            )

            return encoded_jwt, expire

        except Exception as e:
            logger.error(f"Error creating access token: {e}")
            raise

    @classmethod
    def verify_token(cls, token: str) -> Optional[Dict]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(
                token,
                cls.SECRET_KEY,
                algorithms=[cls.ALGORITHM]
            )
            return payload
        except JWTError as e:
            logger.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Error verifying token: {e}")
            return None

    @classmethod
    def create_user_token(
        cls,
        user_id: str,
        email: str,
        rol: str
    ) -> Tuple[str, datetime]:
        """Create a token for a user"""
        token_data = {
            "sub": str(user_id),  # Ensure user_id is a string
            "email": email,
            "rol": rol
        }
        return cls.create_access_token(token_data)


# ============================================================================
# USER SERVICE (Using Supabase)
# ============================================================================

class UserService:
    """Service for user operations using Supabase database"""

    def __init__(self):
        """Initialize UserService with Supabase backend"""
        try:
            from supabase_service import get_supabase_service
        except ImportError:
            from backend.services.supabase_service import get_supabase_service

        self.supabase = get_supabase_service()

    def user_exists(self, email: str) -> bool:
        """Check if user exists"""
        return self.supabase.user_exists(email)

    def create_user(self, email: str, password: str, rol: str = "viewer") -> Dict:
        """Create a new user"""
        if self.user_exists(email):
            raise ValueError("User already exists")

        hashed_password = AuthService.hash_password(password)
        user = self.supabase.create_user(
            email=email,
            password_hash=hashed_password,
            rol=rol
        )

        if user:
            logger.info(f"User created: {email}")
            return user
        else:
            raise ValueError("Failed to create user in Supabase")

    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate a user and return user data"""
        user = self.supabase.get_user_by_email(email)

        if not user:
            logger.warning(f"Login attempt for non-existent user: {email}")
            return None

        if not AuthService.verify_password(password, user.get("password_hash", "")):
            logger.warning(f"Failed login attempt for user: {email}")
            return None

        logger.info(f"User authenticated: {email}")
        return user

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        return self.supabase.get_user_by_id(user_id)

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        return self.supabase.get_user_by_email(email)

    def init_demo_users(self):
        """Initialize demo users for testing"""
        self.supabase.init_demo_users()


# ============================================================================
# SINGLETON INSTANCES
# ============================================================================

_auth_service = AuthService()
_user_service = UserService()


def get_auth_service() -> AuthService:
    """Get auth service instance"""
    return _auth_service


def get_user_service() -> UserService:
    """Get user service instance"""
    global _user_service
    if _user_service is None:
        _user_service = UserService()
    return _user_service
