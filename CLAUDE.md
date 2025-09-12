# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This repository contains two distinct property management systems:

### 1. Property Management System (backend/ and frontend/)
- **Backend**: Express.js API with MongoDB (Mongoose ODM)
- **Frontend**: React + Vite with TailwindCSS
- **Purpose**: Internal property management dashboard with tenant management, payments, maintenance tracking, and financial reporting

### 2. Palvoria Properties Website (palvoria-properties-backend/ and palvoria-properties-frontend/)
- **Backend**: Express.js API with MongoDB, Socket.IO, Redis caching
- **Frontend**: React + Vite with TailwindCSS, Framer Motion, React Query
- **Purpose**: Public-facing real estate website with property listings, search, lead generation, and customer chat

## Development Commands

### Property Management System
**Backend** (from ./backend/):
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run reset-payments` - Reset all payments and balances (script)
- `npm run recalculate-balances` - Recalculate tenant balances (script)
- `npm run clear-all-data` - Clear all payments and expenses data (script)

**Frontend** (from ./frontend/):
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Palvoria Properties Website
**Backend** (from ./palvoria-properties-backend/):
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

**Frontend** (from ./palvoria-properties-frontend/):
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run clear-cache` - Clear application cache
- `npm run dev:fresh` - Clear cache and start dev server

## Key Technical Details

### Backend Technologies
- **Authentication**: JWT tokens with bcryptjs hashing
- **Database**: MongoDB with Mongoose ODM
- **File Uploads**: Multer with Cloudinary integration
- **Logging**: Winston logger
- **Security**: Helmet, CORS, express-rate-limit
- **Real-time**: Socket.IO (Palvoria only)
- **Caching**: Redis (Palvoria only)

### Frontend Technologies
- **Framework**: React 18+ with Vite bundler
- **Styling**: TailwindCSS with custom configurations
- **State Management**: React Query for server state, Context API for global state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Yup validation
- **Animations**: Framer Motion (Palvoria only)
- **Icons**: Lucide React and Heroicons

### Database Models
**Property Management System**:
- Properties, Units, Tenants, Leases, Payments, Expenses, Maintenance, Floors

**Palvoria Properties**:
- Properties, Users, Leads, Chats, Analytics, Neighborhoods

### Environment Setup
- Both backends require `.env` files with MongoDB connections, JWT secrets, and API keys
- Frontend builds require proper API base URLs configured
- Cloudinary credentials needed for image uploads
- Redis connection required for Palvoria backend

### File Structure Patterns
- Route handlers in `routes/` directories
- Database models in `models/` directories  
- Middleware in `middleware/` directories
- Utilities in `utils/` directories
- React components organized by feature in `src/components/`
- Pages in `src/pages/`
- Services for API calls in `src/services/`

### Testing
- No test frameworks currently configured
- Scripts available for data management and balance calculations

### Build and Deployment
- Both frontends use Vite for fast development and optimized production builds
- Backends use standard Node.js deployment patterns
- Static file serving configured for uploaded content

## Running
-do not at nay one point in tim change ports .. i have already run it om 5173 and 5000