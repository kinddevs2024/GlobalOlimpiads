# Google OAuth Setup Guide

## ✅ Frontend Configuration (COMPLETE)

The frontend is fully configured with your Google OAuth credentials:

- **Client ID**: `780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com`
- **Location**: `src/utils/constants.js`
- **Status**: ✅ Configured and ready to use

The Google OAuth button is already implemented in the Auth page (`src/pages/Auth.jsx`) and will work once the backend is configured.

## 🔧 Backend Configuration (REQUIRED)

Your backend needs to be configured with the **Client Secret** to verify Google access tokens.

### Backend Requirements:

1. **Set Environment Variable:**

   ```env
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_CLIENT_ID=780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com
   ```

2. **Implement `/api/auth/google` Endpoint:**

   The frontend sends a POST request to `/api/auth/google` with:

   ```json
   {
     "token": "google_access_token_from_frontend"
   }
   ```

   Your backend should:

   - Verify the Google access token using the Google Client Secret
   - Get user info from Google (email, name, picture)
   - Create a new user if they don't exist, or log them in if they do
   - Return a JWT token and user object:
     ```json
     {
       "token": "your_jwt_token",
       "user": {
         "_id": "user_id",
         "email": "user@example.com",
         "name": "User Name",
         "role": "student"
       }
     }
     ```

3. **Example Backend Implementation (Node.js/Express):**

   ```javascript
   const { OAuth2Client } = require("google-auth-library");
   const client = new OAuth2Client(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET
   );

   app.post("/api/auth/google", async (req, res) => {
     try {
       const { token } = req.body;

       // Verify the Google token
       const ticket = await client.verifyIdToken({
         idToken: token,
         audience: process.env.GOOGLE_CLIENT_ID,
       });

       const payload = ticket.getPayload();
       const { email, name, picture } = payload;

       // Find or create user
       let user = await User.findOne({ email });
       if (!user) {
         user = await User.create({
           email,
           name,
           picture,
           role: "student",
           googleId: payload.sub,
         });
       }

       // Generate JWT token
       const jwtToken = generateJWT(user);

       res.json({
         token: jwtToken,
         user: {
           _id: user._id,
           email: user.email,
           name: user.name,
           role: user.role,
         },
       });
     } catch (error) {
       res.status(401).json({ message: "Invalid Google token" });
     }
   });
   ```

## 🔍 How It Works

1. User clicks "Continue with Google" button on the frontend
2. Google OAuth popup opens and user authorizes
3. Frontend receives Google access token
4. Frontend sends token to backend: `POST /api/auth/google`
5. Backend verifies token with Google using Client Secret
6. Backend creates/logs in user and returns JWT token
7. Frontend stores JWT token and redirects to dashboard

## ⚠️ IMPORTANT: Fix Origin Mismatch Error

If you're getting an **"origin_mismatch"** or **"redirect_uri_mismatch"** error, you need to configure authorized origins in Google Cloud Console:

### Step-by-Step Fix:

1. **Go to Google Cloud Console:**

   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project (or create one if needed)

2. **Find Your OAuth 2.0 Client:**

   - Look for your Client ID: `780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com`
   - Click on it to edit

3. **Add Authorized JavaScript Origins:**

   - Scroll to **"Authorized JavaScript origins"**
   - Click **"+ ADD URI"**
   - Add these origins (one at a time):
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (if you test from backend)
     - Your production domain (e.g., `https://yourdomain.com`) when deployed
   - **Important:** Do NOT include trailing slashes (`/`)

4. **Add Authorized Redirect URIs (REQUIRED!):**

   - Scroll to **"Authorized redirect URIs"**
   - Click **"+ ADD URI"**
   - Add these redirect URIs (one at a time):
     - `http://localhost:5173` (REQUIRED for the OAuth flow)
     - `http://localhost:5173/auth` (optional, if you want to be specific)
     - Your production domain when deployed
   - **Important:** The redirect URI must match exactly what the library sends

5. **Save Changes:**

   - Click **"SAVE"** at the bottom
   - Wait a few minutes for changes to propagate (can take up to 5 minutes)

6. **Test Again:**
   - Clear your browser cache
   - Try the Google login again

### Common Issues:

- **"Error 400: redirect_uri_mismatch"**: Make sure you added the exact origin (protocol, domain, port) to authorized JavaScript origins
- **"Error 403: access_denied"**: Check your OAuth consent screen is configured
- **"Error: popup_closed_by_user"**: User cancelled the login (not an error)

## 📝 Additional Notes

- **Client ID** is public and safe to use in frontend code
- **Client Secret** must NEVER be exposed in frontend code - backend only!
- Make sure your Google OAuth consent screen is configured in Google Cloud Console
- The frontend uses the **implicit flow** which doesn't require redirect URIs, but origins must be authorized

## ✅ Testing

Once your backend is configured:

1. Start your backend server
2. Start the frontend: `npm run dev`
3. Go to `/auth` page
4. Click "Continue with Google"
5. Sign in with a Google account
6. You should be redirected to the dashboard
