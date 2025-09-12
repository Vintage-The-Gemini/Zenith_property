# Update Your Render Static Site with API URL

## Quick Steps to Update Your Existing Render Static Site:

### 1. Update Environment Variable in Render Dashboard
1. Go to your **static site** in Render Dashboard
2. Navigate to **Environment** tab
3. Add this environment variable:
   ```
   VITE_API_BASE_URL=https://palvoria-properties-api.onrender.com/api
   ```
4. Click **Save Changes**

### 2. Redeploy Your Static Site
- Render will automatically redeploy your static site
- Or manually trigger a deploy from the dashboard

### 3. That's It! 🎉
Your static site will now use the Render API instead of localhost.

## Alternative: Manual Build & Deploy

If you want to deploy manually:

```bash
# In palvoria-properties-frontend directory
npm run build

# Upload the dist/ folder to your static site
```

## Test Your Site
After deployment, your site should:
- ✅ Load properties from the live API
- ✅ Show real property data instead of mock data
- ✅ Work completely without localhost

## API Endpoints Your Site Will Use:
- **Properties**: `https://palvoria-properties-api.onrender.com/api/properties`
- **Single Property**: `https://palvoria-properties-api.onrender.com/api/properties/:id`
- **Health Check**: `https://palvoria-properties-api.onrender.com/api/health`

## Troubleshooting:
- If properties don't load, check browser console for API errors
- Verify your backend is deployed at: `https://palvoria-properties-api.onrender.com/api/health`
- Make sure CORS is configured in the backend (already done ✅)

Your site will be fully functional with live data! 🚀