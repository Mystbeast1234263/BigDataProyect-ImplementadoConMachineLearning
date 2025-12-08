"""
Supabase Service - Handles all Supabase database operations
"""
import os
from typing import Optional, Dict
from datetime import datetime
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ============================================================================
# SUPABASE SERVICE
# ============================================================================

class SupabaseService:
    """Service for Supabase database operations"""

    def __init__(self):
        """Initialize Supabase client"""
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.url or not self.key:
            logger.warning("Supabase credentials not found in environment variables")
            self.client = None
        else:
            try:
                self.client = create_client(self.url, self.key)
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing Supabase client: {e}")
                self.client = None

    def is_connected(self) -> bool:
        """Check if Supabase client is connected"""
        return self.client is not None

    # ========================================================================
    # USER OPERATIONS
    # ========================================================================

    def user_exists(self, email: str) -> bool:
        """Check if user exists by email"""
        if not self.client:
            return False

        try:
            response = self.client.table("users").select("id").eq("email", email.lower()).execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error checking if user exists: {e}")
            return False

    def create_user(self, email: str, password_hash: str, rol: str = "viewer") -> Optional[Dict]:
        """Create a new user in Supabase"""
        if not self.client:
            logger.error("Supabase client not initialized")
            return None

        try:
            user_data = {
                "email": email.lower(),
                "password_hash": password_hash,
                "rol": rol,
                "estado": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            response = self.client.table("users").insert(user_data).execute()
            logger.info(f"User created in Supabase: {email}")
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating user in Supabase: {e}")
            return None

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email from Supabase"""
        if not self.client:
            logger.error("Supabase client not initialized")
            return None

        try:
            response = self.client.table("users").select("*").eq("email", email.lower()).execute()
            if response.data:
                user = response.data[0]
                # Ensure id field exists
                if "id" not in user:
                    user["id"] = str(user.get("id"))
                return user
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID from Supabase"""
        if not self.client:
            logger.error("Supabase client not initialized")
            return None

        try:
            response = self.client.table("users").select("*").eq("id", user_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None

    def init_demo_users(self):
        """Initialize demo users in Supabase"""
        try:
            from backend.services.auth_service import AuthService
        except ImportError:
            from auth_service import AuthService

        demo_users = [
            {"email": "admin@gamc.bo", "password": "admin123", "rol": "admin"},
            {"email": "operador@gamc.bo", "password": "operador123", "rol": "operador"},
            {"email": "viewer@gamc.bo", "password": "viewer123", "rol": "viewer"}
        ]

        for user_data in demo_users:
            if not self.user_exists(user_data["email"]):
                try:
                    password_hash = AuthService.hash_password(user_data["password"])
                    self.create_user(
                        email=user_data["email"],
                        password_hash=password_hash,
                        rol=user_data["rol"]
                    )
                    logger.info(f"Demo user created: {user_data['email']}")
                except Exception as e:
                    logger.warning(f"Error creating demo user {user_data['email']}: {e}")


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
