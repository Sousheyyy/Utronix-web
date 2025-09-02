# Demo Setup Guide

## Quick Start for Demo

### 1. Create Environment File
Create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration (Replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Financial API Configuration (Replace with your actual values)
FINANCIAL_API_KEY=your_financial_api_key
FINANCIAL_API_SECRET=your_financial_api_secret
FINANCIAL_API_URL=https://api.financial-service.com

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Set Up Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Go to SQL Editor and run the schema from `supabase/schema.sql`
4. Update your `.env.local` file with the actual values

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test the Application
- Open http://localhost:3000
- Create test accounts for each role:
  - Customer account
  - Supplier account  
  - Admin account
- Test the complete workflow

## Demo Workflow

1. **Customer creates order**
2. **Supplier submits quote**
3. **Admin sets final price**
4. **Customer sees payment instructions**
5. **System monitors payment**
6. **Order progresses through statuses**

## Notes
- The financial API integration is a placeholder
- You can simulate payments by manually updating the database
- All data is stored in Supabase with proper security policies
