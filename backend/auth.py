"""
Supabase Authentication Module
Handles JWT verification and user authentication
"""

from fastapi import HTTPException, Header, Depends
from typing import Optional, Dict
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import jwt
from jwt import PyJWTError

load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Supabase JWT secret for verification
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


async def verify_supabase_token(authorization: Optional[str] = Header(None)) -> Dict:
    """
    Verify Supabase JWT token and return user data
    
    This replaces the old proxy key authentication with proper JWT-based auth
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )
    
    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format. Use: Bearer <token>"
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        # Verify JWT token with Supabase secret
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Get user data from Supabase
        user_response = supabase.auth.admin.get_user_by_id(user_id)
        
        if not user_response:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Get additional user data from users table
        user_data_response = supabase.table("users").select("*").eq("id", user_id).single().execute()
        
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "auth_user": user_response.user,
            "user_data": user_data_response.data if user_data_response.data else None
        }
        
    except PyJWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )


async def verify_api_key(authorization: Optional[str] = Header(None)) -> Dict:
    """
    Verify API key for programmatic access (backward compatibility)
    
    This allows both:
    1. JWT tokens for dashboard/frontend
    2. API keys for programmatic/SDK access
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    # Check if it's a JWT token or API key
    if authorization.startswith("Bearer "):
        token_or_key = authorization[7:]
        
        # Try JWT first
        if token_or_key.startswith("eyJ"):  # JWT tokens start with eyJ
            return await verify_supabase_token(authorization)
        
        # Otherwise treat as API key (proxy key)
        from database import get_user_by_proxy_key
        user_data = await get_user_by_proxy_key(token_or_key)
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        return {
            "user_id": user_data["users"]["id"],
            "email": user_data["users"]["email"],
            "user_data": user_data["users"],
            "proxy_key": token_or_key
        }
    
    raise HTTPException(status_code=401, detail="Invalid authorization format")


async def get_current_user(auth_data: Dict = Depends(verify_api_key)) -> Dict:
    """
    Dependency to get current authenticated user
    Works with both JWT tokens and API keys
    """
    return auth_data
