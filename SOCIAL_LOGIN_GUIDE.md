# Social Login Setup - LifeSync AI

LifeSync AI supports real Google and Facebook OAuth login through the backend.
The frontend starts at `/auth/google` or `/auth/facebook`, the provider returns
to the backend callback, then the backend redirects to `/auth/callback` on the
frontend.

## Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Google callback: `http://localhost:3000/auth/google/callback`
- Facebook callback: `http://localhost:3000/auth/facebook/callback`

## Backend `.env`

Set these values in `backend/.env`:

```env
FRONTEND_URL="http://localhost:5173"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"

FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"
FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback"
FACEBOOK_API_VERSION="v25.0"
```

For production, replace the redirect URIs with your deployed backend domain,
for example:

```env
FRONTEND_URL="https://lifesync-ai.com"
GOOGLE_REDIRECT_URI="https://api.lifesync-ai.com/auth/google/callback"
FACEBOOK_REDIRECT_URI="https://api.lifesync-ai.com/auth/facebook/callback"
```

## Frontend `.env`

Set the frontend API URL:

```env
VITE_API_URL="http://localhost:3000"
```

For production:

```env
VITE_API_URL="https://api.lifesync-ai.com"
```

## Google Console

1. Open Google Cloud Console.
2. Configure OAuth consent screen.
3. Create OAuth Client ID with application type `Web application`.
4. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - your production frontend origin
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - your production backend callback URL
6. Copy Client ID and Client Secret into `backend/.env`.

## Meta / Facebook Developers

1. Open Meta for Developers and create an app.
2. Add the Facebook Login product.
3. In Facebook Login settings, enable Client OAuth Login and Web OAuth Login.
4. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/facebook/callback`
   - your production backend callback URL
5. Copy App ID and App Secret into `backend/.env`.
6. While the app is in development mode, only app admins/developers/testers can log in.

## Test

```powershell
cd backend
npm run build
npm run start:prod
```

```powershell
cd frontend
npm run dev
```

Then open `http://localhost:5173/login` and click Google or Facebook.

## Demo Email Accounts

- User login: `user@demo.com` / `user123`
- Admin login: `admin@lifesyncai.com` / `admin123`

Admin accounts must use `/admin/login`; normal `/login` intentionally rejects
admin accounts.

## Notes

- Provider redirect URIs must match the `.env` callback URL exactly.
- Tokens are returned to the frontend in the URL fragment after callback.
- The backend sets and verifies an HTTP-only OAuth state cookie during login.
- Facebook may not return an email for every account. The app rejects that case
  because LifeSync requires an email identity.
