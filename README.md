# Customer-Supplier-Admin Web Application

A comprehensive order management system built with Next.js 14, Supabase, and Tailwind CSS. This application manages the entire order process from creation to delivery, featuring three distinct user roles with specific permissions and automated workflows.

## 🚀 Features

### Core Functionality
- **User Management**: Three distinct roles (Customer, Supplier, Admin) with role-based access control
- **Order Management**: Complete order lifecycle from creation to delivery
- **Automated Workflows**: Payment confirmation, status transitions, and notifications
- **File Uploads**: Support for images and documents with 16MB limit
- **Real-time Updates**: Live order status updates across all dashboards
- **Order Tracking**: Comprehensive timeline with all order actions

### User Roles

#### 👤 Customer
- Create and manage orders
- Upload files with orders
- Track order progress with visual timeline
- Edit orders before payment confirmation
- Cancel orders before payment
- View final pricing with 20% profit margin

#### 🏭 Supplier
- View and quote on customer orders
- Upload product images
- Manage order status transitions
- Edit quotes until payment confirmation
- Track order progress through production phases

#### 👨‍💼 Admin
- Complete system oversight
- Manage all orders and users
- View comprehensive analytics
- Edit order details and pricing
- Access to all files and images
- Detailed order timeline tracking

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **State Management**: React Context, useState
- **File Handling**: Supabase Storage
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd utronixwebb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL scripts in the `supabase/` directory in order:
     - `schema.sql` (main database schema)
     - `add-delivery-fields.sql`
     - `add-file-upload-support.sql`
     - `add-order-numbering-system.sql`
     - `setup-order-images-bucket-simple.sql`
     - `update-image-access-policies.sql`

4. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
├── components/
│   ├── dashboards/          # Role-specific dashboards
│   ├── orders/              # Order-related components
│   ├── admin/               # Admin-specific components
│   └── quotes/              # Quote-related components
├── contexts/                # React contexts
├── lib/                     # Utility functions
├── supabase/                # Database schemas and migrations
├── types/                   # TypeScript type definitions
└── public/                  # Static assets
```

## 🔧 Configuration

### Supabase Setup
1. **Database**: Run all SQL scripts in the `supabase/` directory
2. **Storage**: Create buckets for `order-images` and `order-files`
3. **Authentication**: Enable email authentication
4. **RLS**: Row Level Security is configured for data protection

### File Upload Limits
- **Maximum file size**: 16MB per file
- **Supported formats**: PNG, JPG, JPEG, ZIP, PDF
- **Storage buckets**: Separate buckets for supplier images and customer files

## 📊 Order Workflow

1. **Order Creation**: Customer creates order with details and files
2. **Quote Submission**: Supplier reviews and submits pricing
3. **Price Calculation**: System automatically adds 20% profit margin
4. **Payment Confirmation**: Admin confirms payment received
5. **Production**: Supplier uploads images and moves to production
6. **Shipping**: Order moves to transit status
7. **Delivery**: Order marked as delivered

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Access**: Different permissions for each user role
- **File Access Control**: Granular permissions for file access
- **Input Validation**: Client and server-side validation
- **Secure Authentication**: Supabase Auth integration

## 🎨 UI/UX Features

- **Responsive Design**: Works on all device sizes
- **Modern Interface**: Clean, professional design
- **Visual Progress Tracking**: Timeline and progress bars
- **Real-time Updates**: Live status changes
- **Intuitive Navigation**: Role-specific dashboards

## 📈 Analytics & Reporting

- **Order Statistics**: Total orders, revenue, profit tracking
- **Status Distribution**: Visual breakdown of order statuses
- **Monthly Trends**: Revenue and order trends over time
- **Profit Analytics**: Average order value and profit margins

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Compatible with static export
- **Railway**: Full-stack deployment support
- **DigitalOcean**: App Platform deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the SQL scripts in the `supabase/` folder

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added file upload support
- **v1.2.0**: Enhanced timeline and analytics
- **v1.3.0**: Improved order management workflow

---

Built with ❤️ using Next.js and Supabase