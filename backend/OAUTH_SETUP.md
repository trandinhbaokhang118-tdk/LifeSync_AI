# OAuth Setup Guide

## Local Callback URLs

- Google: `http://localhost:3000/auth/google/callback`
- Facebook: `http://localhost:3000/auth/facebook/callback`
- Frontend callback route: `http://localhost:5173/auth/callback`

## Google

1. Open Google Cloud Console.
2. Configure the OAuth consent screen.
3. Create an OAuth Client ID with application type `Web application`.
4. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - your production frontend origin
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - your production backend Google callback
6. Copy the Client ID and Client Secret into `backend/.env`.

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
```

## Facebook

1. Open Meta for Developers.
2. Create or select an app.
3. Add the Facebook Login product.
4. In Facebook Login settings, enable Client OAuth Login and Web OAuth Login.
5. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/facebook/callback`
   - your production backend Facebook callback
6. Copy the App ID and App Secret into `backend/.env`.

```env
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"
FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback"
FACEBOOK_API_VERSION="v25.0"
```

While the Facebook app is in development mode, only app admins, developers, and
testers can log in.

## Test

Start backend and frontend:

```powershell
cd backend
npm run start:dev
```

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173/login`, then click Google or Facebook.

## Security Notes

- Use HTTPS in production.
- Never commit real `.env` secrets.
- Provider redirect URIs must match the `.env` callback URLs exactly.
- The backend uses an HTTP-only OAuth state cookie during social login.
- The backend sends app tokens back to the frontend through a URL fragment.
