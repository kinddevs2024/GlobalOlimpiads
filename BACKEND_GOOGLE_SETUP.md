# 🔐 Backend Google OAuth Setup

## ⚠️ SECURITY WARNING

The file `BACKEND_GOOGLE_CREDENTIALS.json` contains your **Google Client Secret**.

**NEVER:**

- ❌ Commit this file to Git (it's in .gitignore)
- ❌ Put it in the `public` folder (it will be exposed to users)
- ❌ Share it publicly
- ❌ Use it in frontend code

**ALWAYS:**

- ✅ Keep it on the backend server only
- ✅ Use environment variables in production
- ✅ Add it to .gitignore (already done)

## 📁 File Location

The credentials file is now at:

```
BACKEND_GOOGLE_CREDENTIALS.json
```

This file is **ONLY for your backend server**, not the frontend!

## 🔧 Backend Implementation

### Option 1: Use the JSON File (Development)

```javascript
const { OAuth2Client } = require("google-auth-library");
const credentials = require("./BACKEND_GOOGLE_CREDENTIALS.json");

const client = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret
);

app.post("/api/auth/google", async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the Google access token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: credentials.web.client_id,
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
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
});
```

### Option 2: Use Environment Variables (Production - RECOMMENDED)

```javascript
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Same implementation as above...
```

**Backend .env file:**

```env
GOOGLE_CLIENT_ID=780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 📝 Important Notes

1. **Frontend doesn't need this file** - The frontend only needs the Client ID (already configured)
2. **Backend needs the Client Secret** - To verify Google tokens
3. **The file is in .gitignore** - It won't be committed to Git
4. **For production** - Use environment variables instead of the JSON file

## ✅ What's Already Done

- ✅ Client ID configured in frontend (`src/utils/constants.js`)
- ✅ Google OAuth button implemented in frontend
- ✅ Credentials file moved to secure location (root directory)
- ✅ File added to .gitignore
- ✅ Frontend sends access token to backend: `POST /api/auth/google`

## 🚀 Next Steps

1. Copy `BACKEND_GOOGLE_CREDENTIALS.json` to your backend project
2. Implement the `/api/auth/google` endpoint in your backend
3. Test the Google login flow
