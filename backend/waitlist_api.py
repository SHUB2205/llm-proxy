"""Waitlist API for landing page"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from datetime import datetime
import re

router = APIRouter(prefix="/api", tags=["waitlist"])


class WaitlistRequest(BaseModel):
    email: str


@router.post("/waitlist")
async def join_waitlist(request: WaitlistRequest):
    """
    Add email to waitlist
    Public endpoint - no authentication required
    """
    try:
        email = request.email.lower().strip()
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise HTTPException(status_code=400, detail="Invalid email address")
        
        # Insert into waitlist table
        result = supabase.table("waitlist").insert({
            "email": email,
            "created_at": datetime.utcnow().isoformat(),
            "status": "pending"
        }).execute()
        
        return {
            "success": True,
            "message": "Successfully joined waitlist",
            "email": email
        }
        
    except Exception as e:
        # Check if email already exists (unique constraint violation)
        if "duplicate key" in str(e).lower() or "23505" in str(e):
            return {
                "success": True,
                "message": "Email already on waitlist",
                "email": email
            }
        
        print(f"Waitlist error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to join waitlist. Please try again."
        )


@router.get("/waitlist/count")
async def get_waitlist_count():
    """
    Get total number of people on waitlist
    Public endpoint for social proof
    """
    try:
        result = supabase.table("waitlist").select("id", count="exact").execute()
        return {
            "count": result.count or 0
        }
    except Exception as e:
        print(f"Error getting waitlist count: {e}")
        return {"count": 0}
