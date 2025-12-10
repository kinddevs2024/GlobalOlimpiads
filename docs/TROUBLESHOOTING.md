# Troubleshooting Frontend-Backend Connection

## Common Issues and Solutions

### 1. ❌ Connection Refused / Cannot Connect

**Symptoms:**
- Error: "Cannot connect to backend server"
- Network errors in browser console
- CORS errors

**Solutions:**

#### Check Backend is Running
```bash
# Make sure backend is running on port 3000
# You should see: "Ready on http://localhost:3000"
```

#### Check Backend Routes
Your backend MUST have routes under `/api` prefix:

```js
// ✅ CORRECT - Backend should have:
app.use('/api/auth', authRoutes);
app.use('/api/olympiads', olympiadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});
```

```js
// ❌ WRONG - If your backend routes are like this:
app.use('/auth', authRoutes);  // Missing /api prefix!
app.use('/olympiads', olympiadRoutes);
```

**Fix:** Add `/api` prefix to all your backend routes.

---

### 2. ❌ CORS Errors

**Symptoms:**
- Browser console shows: "Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy"
- Network tab shows OPTIONS request failing

**Solution:** Add CORS to your backend:

```js
// Backend (Express.js example)
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 3. ❌ 404 Not Found Errors

**Symptoms:**
- API calls return 404
- Routes not found

**Check:**

1. **Backend route structure:**
   ```js
   // Backend should have:
   POST /api/auth/register
   POST /api/auth/login
   GET  /api/auth/me
   GET  /api/olympiads
   // etc.
   ```

2. **Frontend is calling:**
   - `/api/auth/register` (uses proxy)
   - Proxy forwards to: `http://localhost:3000/api/auth/register`

3. **Verify your backend has the `/api` prefix!**

---

### 4. ❌ Socket.io Connection Fails

**Symptoms:**
- Socket doesn't connect
- Real-time features don't work

**Check:**

1. **Backend Socket.io setup:**
   ```js
   // Backend
   const io = require('socket.io')(server, {
     cors: {
       origin: "http://localhost:5173",
       credentials: true
     }
   });
   ```

2. **Socket authentication:**
   ```js
   // Backend - Verify token on connection
   io.use((socket, next) => {
     const token = socket.handshake.auth.token;
     // Verify JWT token here
     if (token) {
       next();
     } else {
       next(new Error('Authentication error'));
     }
   });
   ```

---

### 5. ❌ Health Check Fails

**Symptoms:**
- Health check endpoint returns error
- Connection test fails

**Solution:** Add health check endpoint to your backend:

```js
// Backend
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});
```

---

## Quick Debugging Steps

### Step 1: Test Backend Directly

Open browser and go to:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

If this doesn't work, your backend routes are wrong!

---

### Step 2: Check Browser Console

1. Open frontend in browser (http://localhost:5173)
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Try to login or make an API call
5. Check what URL is being called and what error you get

---

### Step 3: Check Backend Console

Look at your backend terminal for:
- Incoming requests
- Error messages
- Route matching

---

### Step 4: Verify Ports

**Frontend:** `http://localhost:5173` (Vite dev server)
**Backend:** `http://localhost:3000` (Your Node.js server)

Make sure:
- ✅ Backend is running on port 3000
- ✅ Frontend is running on port 5173
- ✅ No other app is using these ports

---

## Backend Checklist

Make sure your backend has:

- [ ] Server running on `http://localhost:3000`
- [ ] All routes prefixed with `/api`
- [ ] CORS enabled for `http://localhost:5173`
- [ ] Health check endpoint: `GET /api/health`
- [ ] JWT authentication middleware
- [ ] Socket.io configured with CORS
- [ ] Body parser middleware (for JSON)
- [ ] File upload middleware (for camera captures)

---

## Example Backend Structure

```js
// server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (MUST have /api prefix!)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/olympiads', require('./routes/olympiads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/owner', require('./routes/owner'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

// Socket authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify token...
  next();
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`> Ready on http://localhost:${PORT}`);
});
```

---

## Still Not Working?

1. **Check if backend is actually receiving requests:**
   - Add `console.log('Request received:', req.path)` in your backend
   - Check backend terminal when frontend makes a request

2. **Check network tab:**
   - See what URL frontend is calling
   - See what status code backend returns
   - Check response body

3. **Verify environment:**
   - Make sure you're running `npm run dev` in frontend
   - Make sure backend is running
   - Check both terminals for errors

4. **Test with Postman/curl:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   If this works but frontend doesn't, it's a CORS or proxy issue.

