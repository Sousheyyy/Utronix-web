# Supabase Storage Setup for Order Images

## 🗂️ **Create Storage Bucket**

### **Step 1: Access Storage in Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Click on **"Storage"** in the left sidebar
3. Click **"Create a new bucket"**

### **Step 2: Configure Bucket**
- **Bucket name**: `order-images`
- **Public bucket**: ✅ **Check this** (so images can be viewed without authentication)
- **File size limit**: 5MB (or your preferred limit)
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/jpg` 
  - `image/png`
  - `image/gif`
  - `image/webp`

### **Step 3: Set Bucket Policies (Optional but Recommended)**

#### **Policy 1: Allow authenticated users to upload**
```sql
-- Allow suppliers to upload images
CREATE POLICY "Suppliers can upload order images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'order-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'supplier'
  )
);
```

#### **Policy 2: Allow public viewing**
```sql
-- Allow anyone to view images (since bucket is public)
CREATE POLICY "Public can view order images" ON storage.objects
FOR SELECT USING (bucket_id = 'order-images');
```

#### **Policy 3: Allow suppliers to delete their images**
```sql
-- Allow suppliers to delete images they uploaded
CREATE POLICY "Suppliers can delete their order images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'supplier'
  )
);
```

## 🔧 **Alternative: Quick Setup (Minimal Security)**

If you want to get started quickly without complex policies:

1. **Create bucket** `order-images` as public
2. **No additional policies needed** - bucket will work with default settings

## 🚨 **Common Issues & Solutions**

### **Issue: "Bucket not found"**
- **Solution**: Make sure you created the bucket with exact name `order-images`
- **Check**: Go to Storage → Buckets in your Supabase dashboard

### **Issue: "Permission denied"**
- **Solution**: Check if your user has supplier role
- **Check**: Go to Authentication → Users → find your user → check role

### **Issue: "File too large"**
- **Solution**: Increase bucket file size limit or compress your image
- **Check**: Storage → Buckets → order-images → Settings

### **Issue: "Invalid file type"**
- **Solution**: Make sure you're uploading JPEG, PNG, GIF, or WebP
- **Check**: The file extension and MIME type

## 📱 **Test the Setup**

1. **Create a test order** as a customer
2. **Submit a quote** as a supplier  
3. **Set final price** as admin
4. **Try uploading an image** as supplier when payment is confirmed

## 🔒 **Security Considerations**

- **Public bucket**: Images will be publicly accessible via URL
- **File validation**: Frontend validates file type and size
- **Role-based access**: Only suppliers can upload images
- **Unique filenames**: Prevents filename conflicts

## 🎯 **Supported Image Formats**

- ✅ **JPEG/JPG** - Best for photos
- ✅ **PNG** - Best for graphics with transparency
- ✅ **GIF** - Best for simple animations
- ✅ **WebP** - Modern format, good compression

## 📏 **File Size Limits**

- **Default**: 5MB per image
- **Recommended**: Keep under 2MB for better performance
- **Format**: Use WebP or compressed JPEG for smaller files
