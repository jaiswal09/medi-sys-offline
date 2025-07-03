# MedInventory - Medical Inventory Management System

A comprehensive medical inventory management system built with React, TypeScript, and Supabase. This system provides real-time inventory tracking, transaction management, maintenance scheduling, and advanced analytics for medical facilities.

## 🚀 Features

### Core Functionality
- **Inventory Management**: Track medical equipment, supplies, medications, and consumables
- **Real-time Updates**: Live inventory updates across all connected clients
- **Transaction Tracking**: Complete audit trail of check-outs, check-ins, and transfers
- **Low Stock Alerts**: Automated notifications when items fall below minimum thresholds
- **Maintenance Scheduling**: Preventive and corrective maintenance tracking
- **QR Code Generation**: Automatic QR code generation for easy item identification

### Advanced Features
- **AI-Powered Insights**: Smart notifications and inventory optimization suggestions
- **Email Import**: Parse inventory data from emails using AI
- **Excel/CSV Import**: Bulk import with intelligent field mapping
- **Advanced Analytics**: Comprehensive reporting and data visualization
- **Role-Based Access**: Admin, Staff, and Medical Personnel roles with appropriate permissions
- **Categories Management**: Organize inventory with custom categories

### User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Dark/Light Theme**: Automatic theme detection and manual toggle
- **Real-time Notifications**: In-app notifications for important events
- **Advanced Search**: Powerful search and filtering capabilities

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Query** for data fetching and caching
- **React Router** for navigation
- **React Hot Toast** for notifications
- **Recharts** for data visualization
- **Date-fns** for date manipulation

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database with real-time subscriptions
- **Row Level Security (RLS)** for data protection
- **Supabase Auth** for user authentication
- **Real-time subscriptions** for live updates

### AI & Integrations
- **Google Gemini AI** for smart features
- **QR Code generation** for item tracking
- **Email parsing** with AI
- **Excel/CSV import** with intelligent mapping

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key (optional, for AI features)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd medical-inventory-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key (optional)
```

### 4. Database Setup
The database schema is automatically applied through Supabase migrations. Ensure your Supabase project is set up and the migrations have been run.

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 👥 User Roles & Permissions

### Administrator
- Full system access
- User management
- System settings
- All inventory operations
- Advanced reporting

### Staff
- Inventory management
- Transaction processing
- Maintenance scheduling
- Reporting access
- Alert management

### Medical Personnel
- Item checkout/checkin
- View own transactions
- Basic inventory viewing
- Limited reporting

## 🗄️ Database Schema

### Core Tables
- **user_profiles**: Extended user information with roles
- **categories**: Item categories for organization
- **inventory_items**: Core inventory tracking
- **transactions**: Check-out/check-in history
- **maintenance_schedules**: Equipment maintenance tracking
- **low_stock_alerts**: Automated stock monitoring
- **system_logs**: Audit and debug logging

### Key Features
- **Row Level Security (RLS)** on all tables
- **Real-time subscriptions** for live updates
- **Automated triggers** for stock alerts
- **QR code generation** for items
- **Audit logging** for all operations

## 🔧 Configuration

### Categories Management
- Create custom categories with colors and icons
- Real-time updates across all clients
- Organize inventory by medical specialties

### Notification Settings
- Email and SMS notifications
- Low stock alerts
- Maintenance reminders
- Overdue item alerts

### Security Settings
- Session timeout configuration
- Password policies
- Two-factor authentication
- Login attempt limits

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total inventory value
- Low stock items count
- Active transactions
- Maintenance due items

### Advanced Reports
- Inventory by category
- Usage patterns
- Stock level analysis
- Transaction history
- Maintenance schedules

### Data Export
- CSV export for all data
- Custom date ranges
- Filtered exports
- Scheduled reports

## 🔒 Security Features

- **Row Level Security (RLS)** for data isolation
- **Role-based access control**
- **Session management** with timeout
- **Audit logging** for all operations
- **Data encryption** in transit and at rest
- **API rate limiting**

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Deploy to Vercel
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## 📱 Mobile Support

The application is fully responsive and works on:
- iOS Safari
- Android Chrome
- Mobile browsers
- Tablet devices

## 🔧 Troubleshooting

### Common Issues

1. **Supabase Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are correct

2. **Real-time Updates Not Working**
   - Check Supabase real-time settings
   - Verify network connectivity
   - Check browser console for errors

3. **AI Features Not Working**
   - Verify Gemini API key
   - Check API quota limits
   - Ensure proper network access

### Debug Mode
Enable debug mode by pressing `Ctrl+Shift+D` to access:
- Connection status
- API request logs
- Real-time event logs
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review common issues
- Contact the development team

## 🔄 Updates

The system includes automatic update notifications and can be updated by:
1. Pulling latest changes
2. Running database migrations
3. Updating dependencies
4. Redeploying the application

---

**MedInventory** - Streamlining medical inventory management with modern technology.