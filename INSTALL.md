# Installation Instructions

## Quick Fix

Run this command in the frontend directory:

```powershell
npm install
```

This will install all dependencies including Vite.

## If that doesn't work, try:

```powershell
# Clean install
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
```

## After installation

Run:
```powershell
npm run dev
```

The server will start at http://localhost:5173

