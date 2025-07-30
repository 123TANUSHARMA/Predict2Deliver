# Predict2Deliver.AI

AI-powered retail supply chain optimization platform.

## 🚀 live on

https://predict2-deliver.vercel.app/

## 🚀 Features

- **AI-Powered Demand Forecasting**: Predict product demand using historical data and smart algorithms
- **Optimized Delivery Routes**: Bundle orders and create efficient delivery routes
- **Smart Locker Network**: QR code-based pickup system with automated locker assignment

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **QR Codes**: qrcode library
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

## 🔧 Local Setup Instructions

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd predict2deliver-ai
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set Up Supabase Database

#### Option A: Use Supabase Cloud (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API to get your keys
4. Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
5. Fill in your Supabase credentials in `.env.local`:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   \`\`\`

#### Option B: Local PostgreSQL Setup

1. Install PostgreSQL locally
2. Create a database named `predict2deliver`
3. Update `.env.local` with your local database credentials

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Run the SQL scripts in order:
   - First run `scripts/01-create-tables.sql`
   - Then run `scripts/02-seed-data.sql`

### 5. Start the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

The application will be available at `http://localhost:3000`

### 6. Initialize the System

1. Go to `http://localhost:3000/admin`
2. Click "Seed Database" to populate with sample data
3. Click "Generate Forecasts" to create demand predictions
4. Explore other features!

## 📁 Project Structure

\`\`\`
predict2deliver-ai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── demand-forecast/
│   │   ├── inventory/
│   │   ├── delivery/
│   │   ├── locker/
│   │   └── mock-data/
│   ├── forecast/          # Demand forecasting page
│   ├── inventory/         # Inventory management page
│   ├── delivery/          # Delivery routes page
│   ├── lockers/           # Smart lockers page
│   ├── admin/             # Admin dashboard
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── navbar.tsx        # Navigation component
├── lib/                  # Utility functions
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Helper functions
└── scripts/              # Database scripts
    ├── 01-create-tables.sql
    └── 02-seed-data.sql
\`\`\`

## 🔌 API Endpoints

### Demand Forecasting
- `GET /api/demand-forecast` - Get demand forecasts
- `POST /api/demand-forecast` - Generate new forecasts

### Inventory Management
- `GET /api/inventory/liquidity-score` - Get inventory with liquidity scores
- `POST /api/inventory/rebalance` - Calculate rebalancing recommendations

### Delivery Management
- `GET /api/delivery/bundle-routes` - Get delivery routes
- `POST /api/delivery/bundle-routes` - Generate optimized routes

### Smart Lockers
- `GET /api/locker/generate-pickup` - Get locker pickups
- `POST /api/locker/generate-pickup` - Generate new pickup assignment

### System Operations
- `POST /api/mock-data/seed` - Seed database with sample data

## 🧪 Testing the Application

1. **Seed Data**: Go to Admin → Click "Seed Database"
2. **Generate Forecasts**: Admin → Click "Generate Forecasts"
3. **View Inventory**: Navigate to Inventory page to see stock levels
4. **Create Routes**: Admin → Click "Generate Routes"
5. **Test Lockers**: Go to Lockers → Enter any order ID to generate QR code

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy Backend Separately (Optional)

If you want to deploy the backend separately:

1. **Railway**: Connect GitHub repo, add environment variables
2. **Render**: Create web service, add environment variables
3. **Heroku**: Use Heroku CLI to deploy

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your Supabase credentials in `.env.local`
   - Ensure your Supabase project is active

2. **API Routes Not Working**
   - Make sure you're running `npm run dev`
   - Check browser console for errors

3. **Seeding Fails**
   - Ensure database tables are created first
   - Check Supabase logs for detailed errors

4. **Charts Not Displaying**
   - Clear browser cache
   - Check if data is being fetched correctly

### Getting Help

- Check the browser console for errors
- Review Supabase logs in your dashboard
- Ensure all environment variables are set correctly

## 📊 Sample Data

The application includes comprehensive sample data:
- 5 Walmart stores across Dallas
- 15 product categories
- 8 customers with realistic addresses
- 5 delivery agents
- 5 smart locker locations
- Historical orders and demand patterns

## 🎯 Key Features Demo

1. **Demand Forecasting**: View AI-generated predictions with confidence scores
2. **Inventory Liquidity**: See real-time stock status with color-coded alerts
3. **Route Optimization**: Visualize bundled delivery routes with distance calculations
4. **QR Code Generation**: Generate pickup codes for smart locker access
5. **Admin Operations**: Trigger system-wide operations and monitor performance


