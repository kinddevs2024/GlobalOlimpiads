# Frontend-Backend Connection Guide

## Current Configuration

Your frontend is set up to connect to your backend server. Here's how it works:

### Frontend Port
- **Frontend runs on**: `http://localhost:5173`

### Backend Connection
- **Default backend port**: `http://localhost:3000`
- The Vite proxy forwards all `/api/*` requests to your backend

## Setup Steps

### 1. Create `.env` file (if your backend is NOT on port 5000)

Create a `.env` file in the root directory with:

```env
VITE_API_URL=http://localhost:YOUR_BACKEND_PORT/api
VITE_SOCKET_URL=http://localhost:YOUR_BACKEND_PORT
```

Replace `YOUR_BACKEND_PORT` with your actual backend port (e.g., 8000, 3001, etc.)

### 2. Update `vite.config.js` (if your backend is NOT on port 5000)

If your backend runs on a different port, update the proxy target in `vite.config.js`:

```js
proxy: {
  '/api': {
    target: 'http://localhost:YOUR_BACKEND_PORT',  // Change this
    changeOrigin: true
  }
}
```

### 3. Backend CORS Configuration

Make sure your backend has CORS enabled to accept requests from `http://localhost:5173`:

```js
// Example for Express.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### 4. Start Both Servers

1. Start your backend server first
2. Then start the frontend: `npm run dev`

## Testing the Connection

The frontend will make API calls to:
- **API calls**: `http://localhost:5173/api/*` (proxied to your backend)
- **Socket.io**: Direct connection to your backend socket server

## Troubleshooting

- **Connection refused**: Make sure your backend is running
- **CORS errors**: Check your backend CORS configuration
- **404 errors**: Verify your backend routes match the frontend API calls
- **Socket connection fails**: Check `VITE_SOCKET_URL` in `.env` or `constants.js`

