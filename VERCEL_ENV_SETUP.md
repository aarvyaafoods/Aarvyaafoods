# Vercel Environment Setup Guide

## Critical Environment Variables Required

### Frontend (https://getyourstore.in) - Next.js on Vercel
**MUST SET THESE:**
```
NEXT_PUBLIC_API_BASE_URL=https://api.getyourstore.in
```

This tells the frontend where your backend API is located. Without this, the frontend will fail to connect to the backend.

### Backend (https://api.getyourstore.in) - Node.js/Fastify
**MUST SET THESE:**
```
NODE_ENV=production
FRONTEND_URL=https://getyourstore.in
PORT=3000
DATABASE_URL=[your-database-url]
JWT_ACCESS_SECRET=[generate-a-long-random-string]
JWT_REFRESH_SECRET=[generate-a-long-random-string]
```

Optional but recommended:
```
RAZORPAY_KEY_ID=[your-key]
RAZORPAY_KEY_SECRET=[your-secret]
RAZORPAY_WEBHOOK_SECRET=[your-secret]
GOOGLE_CLIENT_ID=[your-client-id]
CLOUDINARY_CLOUD_NAME=[your-name]
CLOUDINARY_API_KEY=[your-key]
CLOUDINARY_API_SECRET=[your-secret]
```

## How to Set Vercel Environment Variables

### For Frontend Project:
1. Go to Vercel Dashboard → Your Frontend Project
2. Click "Settings" → "Environment Variables"
3. Add:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://api.getyourstore.in`
   - Select: "Production" (or Production, Preview, Development as needed)
4. Click "Save"
5. **Redeploy** the frontend (Vercel will do this automatically, or manually trigger)

### For Backend Project:
1. Go to Vercel Dashboard → Your Backend Project
2. Click "Settings" → "Environment Variables"
3. Add each variable (DATABASE_URL, FRONTEND_URL, etc.)
4. Click "Save"
5. **Redeploy** the backend

## Troubleshooting Checklist

- [ ] NEXT_PUBLIC_API_BASE_URL is set on Frontend to `https://api.getyourstore.in`
- [ ] FRONTEND_URL is set on Backend to `https://getyourstore.in` or `https://www.getyourstore.in`
- [ ] Both projects have been **redeployed** after env variable changes
- [ ] Backend health check works: `https://api.getyourstore.in/health`
- [ ] Check browser console for "[API Config Error]" messages
- [ ] Check backend logs for "[CORS] Rejected origin" messages

## Testing the Connection

1. Open https://getyourstore.in in your browser
2. Open browser DevTools (F12) → Console tab
3. If you see "[API Config Error]", your NEXT_PUBLIC_API_BASE_URL is not set
4. If backend rejects CORS, check that FRONTEND_URL matches the frontend domain

## Common Issues and Solutions

### Issue: "Invalid API response" or fetch errors
**Solution**: Check if NEXT_PUBLIC_API_BASE_URL is set correctly

### Issue: CORS errors in browser console
**Solution**: Ensure FRONTEND_URL on backend matches your frontend domain (with or without www)

### Issue: Environment variables not taking effect
**Solution**: 
1. Verify they're set in the correct Vercel project
2. Redeploy the project after setting variables
3. Wait a few minutes for CDN cache to clear
