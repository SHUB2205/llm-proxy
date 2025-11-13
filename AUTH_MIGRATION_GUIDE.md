# Supabase Authentication Migration Guide

## Overview

We've migrated from proxy key-only authentication to proper Supabase Authentication with JWT tokens. This provides:

- ✅ **Secure user authentication** with email/password
- ✅ **JWT-based sessions** with automatic token refresh
- ✅ **Backward compatibility** with existing proxy keys for API access
- ✅ **Better security** with proper session management
- ✅ **Password reset** and account management

## What Changed

### Backend Changes

1. **New Authentication Module** (`auth.py`)
   - `verify_supabase_token()` - Verifies JWT tokens from Supabase Auth
   - `verify_api_key()` - Supports both JWT tokens and proxy keys
   - `get_current_user()` - Unified dependency for all endpoints

2. **New Authentication API** (`auth_api.py`)
   - `POST /v1/auth/signup` - Create new user account
   - `POST /v1/auth/login` - Login with email/password
   - `POST /v1/auth/logout` - Logout current user
   - `POST /v1/auth/refresh` - Refresh access token
   - `GET /v1/auth/me` - Get current user info
   - `PUT /v1/auth/profile` - Update user profile
   - `POST /v1/auth/reset-password` - Request password reset

3. **Updated Endpoints**
   - All protected endpoints now use `Depends(get_current_user)`
   - Supports both JWT tokens (for dashboard) and API keys (for SDK/programmatic access)

### Frontend Changes (To Be Implemented)

1. **Supabase Client Setup**
   - Install `@supabase/supabase-js`
   - Initialize Supabase client with URL and anon key

2. **Auth Context**
   - Create `AuthContext` to manage authentication state
   - Handle login, signup, logout, and session refresh

3. **Protected Routes**
   - Redirect unauthenticated users to login
   - Store JWT token in memory or httpOnly cookie (not localStorage)

4. **API Calls**
   - Use JWT token from Supabase session in Authorization header
   - Automatic token refresh when expired

## Setup Instructions

### 1. Backend Setup

#### Add Environment Variables

Add to your `.env` file:

```bash
# Get this from Supabase Dashboard > Settings > API > JWT Secret
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

To find your JWT secret:
1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings > API
4. Copy the "JWT Secret" value

#### Install Dependencies

```bash
cd backend
pip install pyjwt
```

#### Test Authentication

```bash
# Start the backend
python main.py

# Test signup
curl -X POST http://localhost:8000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123",
    "company_name": "Test Company"
  }'

# Test login
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

### 2. Frontend Setup

#### Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

#### Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Update Auth Context

Update `src/contexts/AuthContext.tsx` to use Supabase Auth:

```typescript
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

// Use Supabase session instead of localStorage
const [session, setSession] = useState<Session | null>(null)
const [user, setUser] = useState<User | null>(null)

// Listen for auth changes
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setUser(session?.user ?? null)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session)
    setUser(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}, [])

// Login function
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

// Signup function
const signup = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  return data
}

// Logout function
const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
```

#### Update API Calls

Use the session token in API calls:

```typescript
const response = await axios.get(`${API_URL}/v1/stats`, {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`
  }
})
```

## Migration Path

### For Existing Users

1. **Proxy keys still work** - No immediate action required
2. **Encourage migration** - Prompt users to create password-protected accounts
3. **Gradual rollout** - Support both auth methods during transition

### For New Users

1. **Sign up with email/password** - Primary authentication method
2. **Automatic proxy key generation** - Created on signup for API access
3. **Dashboard uses JWT** - Frontend uses Supabase session tokens
4. **API/SDK uses proxy keys** - Programmatic access uses proxy keys

## Security Improvements

1. **JWT Tokens**
   - Short-lived access tokens (1 hour)
   - Refresh tokens for automatic renewal
   - Proper session management

2. **Password Security**
   - Supabase handles password hashing (bcrypt)
   - Password reset via email
   - Account lockout after failed attempts

3. **API Keys**
   - Still supported for programmatic access
   - Can be rotated independently
   - Scoped to user account

4. **Session Management**
   - Automatic token refresh
   - Logout invalidates session
   - Multi-device support

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Signup creates user and returns tokens
- [ ] Login returns valid JWT token
- [ ] Protected endpoints accept JWT tokens
- [ ] Protected endpoints accept proxy keys (backward compatibility)
- [ ] Token refresh works
- [ ] Logout invalidates session
- [ ] Frontend can authenticate users
- [ ] Frontend can make authenticated API calls
- [ ] Password reset email sends

## Rollback Plan

If issues arise, you can rollback by:

1. Checkout main branch: `git checkout main`
2. Old authentication still works with proxy keys
3. No database changes required

## Next Steps

1. ✅ Backend authentication implemented
2. ⏳ Frontend Supabase integration
3. ⏳ Update login/signup pages
4. ⏳ Test end-to-end flow
5. ⏳ Deploy to production
6. ⏳ Migrate existing users

## Support

If you encounter issues:
1. Check Supabase Dashboard for auth logs
2. Verify JWT secret is correct
3. Check browser console for frontend errors
4. Review backend logs for authentication failures
