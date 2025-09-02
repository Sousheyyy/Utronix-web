# Deployment Guide

This guide will help you deploy the Customer-Supplier-Admin Web Application to various platforms.

## 🚀 Quick Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account
- Supabase project set up

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Click "Deploy"

3. **Set up Supabase**
   - Run the SQL scripts in your Supabase dashboard
   - Configure storage buckets
   - Set up authentication

## 🌐 Alternative Deployment Options

### Netlify

1. **Build the project**
   ```bash
   npm run build
   npm run export
   ```

2. **Deploy to Netlify**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `out`
   - Add environment variables

### Railway

1. **Connect repository**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Add environment variables
   - Deploy automatically

### DigitalOcean App Platform

1. **Create new app**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Configure build settings
   - Add environment variables

## 🔧 Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For production, add these to your deployment platform's environment variables section.

## 📊 Supabase Configuration

### 1. Database Setup
Run these SQL scripts in order in your Supabase SQL editor:

1. `supabase/schema.sql` - Main database schema
2. `supabase/add-delivery-fields.sql` - Add delivery fields
3. `supabase/add-file-upload-support.sql` - File upload support
4. `supabase/add-order-numbering-system.sql` - Order numbering
5. `supabase/setup-order-images-bucket-simple.sql` - Image storage
6. `supabase/update-image-access-policies.sql` - File access policies

### 2. Storage Setup
Create these storage buckets in Supabase:

- **order-images**: For supplier uploaded images
- **order-files**: For customer uploaded files

### 3. Authentication Setup
- Enable email authentication in Supabase Auth settings
- Configure email templates if needed
- Set up any additional auth providers

## 🔒 Security Considerations

### Production Checklist
- [ ] Environment variables are set correctly
- [ ] Supabase RLS policies are configured
- [ ] File upload limits are enforced
- [ ] HTTPS is enabled
- [ ] Database backups are configured
- [ ] Monitoring is set up

### RLS Policies
The application uses Row Level Security (RLS) for data protection. Ensure all policies are properly configured in your Supabase dashboard.

## 📈 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build
npm run analyze

# Type checking
npm run type-check
```

### Database Optimization
- Index frequently queried columns
- Use database connection pooling
- Monitor query performance

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript errors: `npm run type-check`
   - Verify all dependencies are installed
   - Check environment variables

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure database schema is up to date

3. **File Upload Issues**
   - Check storage bucket configuration
   - Verify file size limits
   - Check RLS policies for storage

### Debug Mode
For debugging, you can temporarily disable RLS:
```sql
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
```

**Remember to re-enable RLS after debugging!**

## 📞 Support

If you encounter issues during deployment:

1. Check the application logs
2. Verify environment variables
3. Test database connectivity
4. Review Supabase dashboard for errors
5. Check the GitHub issues for similar problems

## 🔄 Updates and Maintenance

### Regular Maintenance
- Update dependencies regularly
- Monitor application performance
- Review and update RLS policies
- Backup database regularly

### Updating the Application
1. Pull latest changes
2. Update dependencies: `npm update`
3. Run tests: `npm run type-check`
4. Deploy to staging first
5. Deploy to production

---

For more detailed information, refer to the main README.md file.
