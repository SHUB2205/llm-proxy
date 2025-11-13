"""
Authentication API Endpoints
Handles user signup, login, logout, and session management
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/v1/auth", tags=["authentication"])

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


# ============================================
# Request/Response Models
# ============================================

class SignupRequest(BaseModel):
    email: str
    password: str
    company_name: str
    openai_api_key: str  # Required - same as original flow


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UpdateProfileRequest(BaseModel):
    company_name: Optional[str] = None
    openai_api_key: Optional[str] = None


# ============================================
# Authentication Endpoints
# ============================================

@router.post("/signup")
async def signup(request: SignupRequest):
    """
    Sign up a new user with email and password
    Creates both Supabase Auth user and users table entry
    """
    try:
        # Create user in Supabase Auth
        # Note: email_confirm is set to False to skip email verification
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "email_redirect_to": None,
                "data": {
                    "company_name": request.company_name
                }
            }
        })
        
        if not auth_response.user:
            error_msg = "Failed to create user"
            if hasattr(auth_response, 'error') and auth_response.error:
                error_msg = str(auth_response.error)
            raise HTTPException(status_code=400, detail=error_msg)
        
        user_id = auth_response.user.id
        
        # Create entry in users table
        from database import encrypt_api_key
        
        # Encrypt and store OpenAI API key (required)
        encrypted_key = encrypt_api_key(request.openai_api_key)
        
        user_data = {
            "id": user_id,
            "email": request.email,
            "company_name": request.company_name,
            "encrypted_api_key": encrypted_key
        }
        
        supabase.table("users").insert(user_data).execute()
        
        # Create default proxy key for API access
        from database import create_proxy_key
        proxy_key_data = await create_proxy_key(user_id, "Default Key")
        
        # Return proxy key (same as original flow)
        return {
            "success": True,
            "message": "User registered successfully. Use this proxy key in your requests.",
            "proxy_key": proxy_key_data["proxy_key"] if proxy_key_data else None,
            "user": {
                "email": request.email,
                "company_name": request.company_name
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(request: LoginRequest):
    """
    Login with email and password
    Returns proxy key (same as original flow)
    """
    try:
        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = auth_response.user.id
        
        # Get user data from users table
        user_data_response = supabase.table("users").select("*").eq("id", user_id).single().execute()
        
        # Get user's primary proxy key
        proxy_keys_response = supabase.table("proxy_keys").select("*").eq("user_id", user_id).eq("is_active", True).order("created_at").limit(1).execute()
        
        proxy_key = proxy_keys_response.data[0]["api_key"] if proxy_keys_response.data else None
        
        # Return proxy key (same as original flow)
        return {
            "success": True,
            "message": "Login successful",
            "proxy_key": proxy_key,
            "user": {
                "email": auth_response.user.email,
                "company_name": user_data_response.data.get("company_name") if user_data_response.data else None
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """
    Logout current user
    Invalidates the current session
    """
    try:
        supabase.auth.sign_out()
        
        return {
            "success": True,
            "message": "Logged out successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        auth_response = supabase.auth.refresh_session(request.refresh_token)
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        return {
            "success": True,
            "session": {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "expires_at": auth_response.session.expires_at
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    user_id = user["user_id"]
    
    # Get full user data
    user_data_response = supabase.table("users").select("*").eq("id", user_id).single().execute()
    
    # Get proxy keys
    proxy_keys_response = supabase.table("proxy_keys").select("id, key_name, api_key, is_active, created_at, last_used_at").eq("user_id", user_id).execute()
    
    return {
        "user": {
            "id": user_id,
            "email": user["email"],
            "company_name": user_data_response.data.get("company_name") if user_data_response.data else None,
            "created_at": user_data_response.data.get("created_at") if user_data_response.data else None
        },
        "proxy_keys": proxy_keys_response.data if proxy_keys_response.data else []
    }


@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    user: dict = Depends(get_current_user)
):
    """
    Update user profile information
    """
    user_id = user["user_id"]
    
    update_data = {}
    
    if request.company_name:
        update_data["company_name"] = request.company_name
    
    if request.openai_api_key:
        from database import encrypt_api_key
        update_data["encrypted_api_key"] = encrypt_api_key(request.openai_api_key)
    
    if update_data:
        supabase.table("users").update(update_data).eq("id", user_id).execute()
    
    return {
        "success": True,
        "message": "Profile updated successfully"
    }


@router.post("/reset-password")
async def reset_password(email: str):
    """
    Send password reset email
    """
    try:
        supabase.auth.reset_password_for_email(email)
        
        return {
            "success": True,
            "message": "Password reset email sent"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
