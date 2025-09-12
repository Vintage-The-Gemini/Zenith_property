# Palvoria Properties Backend - Render Deployment Guide

## Quick Deploy to Render

### 1. Prerequisites
- GitHub repository with the latest code
- Render account (free tier available)
- MongoDB Atlas database (or use Render's PostgreSQL)

### 2. Deploy to Render

#### Option A: Auto-Deploy (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `palvoria-properties-backend` directory
5. Configure:
   - **Name**: `palvoria-properties-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: `Yes`

#### Option B: Using render.yaml
1. Push the `render.yaml` file to your repository
2. Go to Render Dashboard
3. Click "New +" → "Blueprint"
4. Connect your repository and select the render.yaml file

### 3. Environment Variables
Set these in Render Dashboard:

**Required:**
- `NODE_ENV=production`
- `MONGODB_URI=` (your MongoDB connection string)
- `JWT_SECRET=` (generate a secure random string)

**Optional:**
- `FRONTEND_URL=https://your-frontend-url.vercel.app`
- `CLOUDINARY_CLOUD_NAME=di2fwzczc`
- `CLOUDINARY_API_KEY=642418543299886`
- `CLOUDINARY_API_SECRET=` (your secret)
- `SENDGRID_API_KEY=` (for email functionality)

### 4. Database Setup
- Use existing MongoDB Atlas connection
- Or create new MongoDB Atlas cluster
- Update `MONGODB_URI` environment variable

### 5. Verify Deployment
After deployment, test these endpoints:
- `https://your-app.render.com/` - API info
- `https://your-app.render.com/api/health` - Health check
- `https://your-app.render.com/api/properties` - Properties (public)

### 6. Custom Domain (Optional)
1. In Render Dashboard → Settings → Custom Domains
2. Add your domain (e.g., `api.palvoria.com`)
3. Update DNS records as instructed

## API Endpoints

### Public Endpoints (No Auth Required)
- `GET /` - API information
- `GET /api/health` - Service health check
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get single property
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Protected Endpoints (Auth Required)
- `GET /api/users/profile` - User profile
- `POST /api/properties` - Create property (admin)
- `PUT /api/properties/:id` - Update property (admin)
- `DELETE /api/properties/:id` - Delete property (admin)
- `GET /api/analytics` - Analytics data (admin)

## Troubleshooting

### Common Issues:
1. **Build Fails**: Check Node.js version compatibility
2. **Database Connection**: Verify MongoDB URI and whitelist Render IPs
3. **CORS Issues**: Update FRONTEND_URL environment variable
4. **Port Issues**: Render automatically sets PORT=10000

### Logs:
- View real-time logs in Render Dashboard
- Check health endpoint: `/api/health`

## Production Optimizations
- Enable compression middleware ✅
- Security headers with Helmet ✅
- Rate limiting configured ✅
- MongoDB connection pooling ✅
- Error logging with Winston ✅