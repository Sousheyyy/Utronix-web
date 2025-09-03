# Environment Variables Setup

## For Local Development

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## For Vercel Deployment

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

### Variable 1:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://your-project-id.supabase.co`
- **Environment:** Production, Preview, Development

### Variable 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Environment:** Production, Preview, Development

## How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Go to Settings → API
3. Copy:
   - **Project URL** (for NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (for NEXT_PUBLIC_SUPABASE_ANON_KEY)

## After Adding Environment Variables

1. Redeploy your Vercel project
2. The connection issue should be resolved
3. You should be able to login/signup normally
