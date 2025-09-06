# EcoFinds - Sustainable Second-Hand Marketplace

A full-stack web application built for the Odoo x NMIT Hackathon '25, implementing a complete second-hand marketplace with real-time features and robust backend architecture.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure registration/login with JWT tokens
- **Product Management**: Full CRUD operations for product listings
- **Search & Filter**: Real-time search with category filtering
- **Shopping Cart**: Add/remove items with persistent storage
- **Purchase System**: Complete transaction handling
- **Purchase History**: Track all previous purchases
- **Profile Management**: Editable user profiles

### Technical Highlights
- **Real-time Data**: No static JSON, all data from live database
- **Responsive Design**: Mobile-first approach with clean UI
- **Input Validation**: Robust client and server-side validation
- **Local Database**: SQLite for offline-capable development
- **File Upload**: Image handling with validation
- **Error Handling**: Comprehensive error management

## 🏗️ Architecture

### Backend (Node.js + Express + SQLite)
```
├── User Authentication (JWT)
├── RESTful API Design
├── SQLite Database with Relations
├── File Upload Handling
├── Input Validation & Sanitization
├── Error Handling Middleware
└── CORS Configuration
```

### Frontend (React + Tailwind)
```
├── Context API for State Management
├── Custom Hooks for API Integration
├── Responsive Design Components
├── Real-time Updates
├── Form Validation
└── Mobile-First Navigation
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Quick Setup (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd ecofinds
```

2. **Run the automated setup script**
```bash
node setup.js
```

This will automatically:
- Create environment files
- Install all dependencies
- Set up the project structure

3. **Start the application**
```bash
# Terminal 1 - Start backend
cd ecofinds-backend
npm run start

# Terminal 2 - Start frontend
cd ecofinds-frontend
yarn start
```

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd ecofinds-backend
```

2. **Install dependencies**
```bash
yarn install
```

3. **Create environment file**
```bash
# Copy the example and update values
cp .env.example .env
```

4. **Start the server**
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
yarn run  start
```

The backend server will start on `http://localhost:3001`

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ecofinds-frontend
```

2. **Install dependencies**
```bash
yarn install
```

3. **Create environment file**
```bash
# Create .env file with:
echo "REACT_APP_API_BASE_URL=http://localhost:3001/api" > .env
```

4. **Start the development server**
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## 📁 Project Structure

```
ecofinds/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── uploads/              # Image uploads directory
│   └── ecofinds.db           # SQLite database (auto-created)
│
└── frontend/
    ├── src/
    │   ├── App.js            # Main React application
    │   └── index.js          # React entry point
    ├── package.json          # Frontend dependencies
    └── public/               # Static assets
```

## 🗄️ Database Schema

### Users Table
- id, username, email, password_hash, full_name, phone, address

### Categories Table  
- id, name, created_at

### Products Table
- id, title, description, price, category_id, user_id, image_url, status

### Cart Table
- id, user_id, product_id, quantity, added_at

### Purchases Table
- id, buyer_id, product_id, seller_id, price, purchase_date

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add to cart
- `DELETE /api/cart/:productId` - Remove from cart

### Purchases
- `POST /api/purchase` - Purchase products
- `GET /api/purchases` - Get purchase history

## 🎨 Design Features

### Color Scheme
- Primary: Green (#16a34a) - Representing sustainability
- Secondary: Gray (#6b7280) - For text and borders
- Success: Green (#10b981)
- Error: Red (#ef4444)

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

## 🔒 Security Features

### Authentication & Authorization
- Password hashing with bcrypt (configurable rounds)
- JWT token authentication with configurable expiration
- Protected routes with middleware
- User session management

### Input Validation & Sanitization
- Server-side input validation
- SQL injection prevention with parameterized queries
- File upload restrictions (type, size)
- XSS protection with helmet.js

### Network Security
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Request compression
- Security headers with helmet.js

### Environment Security
- Environment variable configuration
- Separate development/production configs
- Secure JWT secret management
- Database path configuration

## 🚀 Deployment Ready

### Backend Deployment
- Environment variables for production
- Database connection handling
- Error logging
- Process management

### Frontend Deployment
- Build optimization
- Asset compression
- Environment configuration

## 🧪 Testing

### Backend Testing
```bash
# Test API endpoints
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

### Frontend Testing
- Manual testing across different screen sizes
- Form validation testing
- API integration testing
- User flow testing

## 📱 Mobile Features

- Touch-friendly interface
- Bottom navigation for mobile
- Swipe gestures support
- Responsive image handling
- Mobile-optimized forms

## 🔧 Development Tips

1. **Database Reset**: Delete `ecofinds.db` to reset database
2. **Image Uploads**: Ensure `uploads/` directory exists
3. **CORS Issues**: Backend runs on 3001, frontend on 3000
4. **Real-time Updates**: Data refreshes automatically after actions
5. **Error Handling**: Check browser console for detailed errors

## 🎯 Hackathon Compliance

✅ **Real-time/Dynamic Data**: SQLite database with live updates  
✅ **Responsive UI**: Mobile-first design with consistent styling  
✅ **Input Validation**: Both client and server-side validation  
✅ **Intuitive Navigation**: Clean menu structure and spacing  
✅ **Local Database**: SQLite for offline development  
✅ **API Design**: RESTful endpoints with proper data modeling  
✅ **No Static JSON**: All data served from database  
✅ **Version Control Ready**: Clean code structure for Git

## 🏆 Advanced Features Implemented

- **File Upload System**: Image handling with validation
- **Transaction System**: Complete purchase flow
- **Search & Filter**: Real-time product discovery
- **Cart Persistence**: Items saved across sessions
- **User Dashboard**: Comprehensive profile management
- **Mobile Navigation**: Bottom nav + hamburger menu
- **Error Boundaries**: Graceful error handling
- **Loading States**: Smooth user experience

## 📞 Support

For hackathon support or questions:
- Check browser console for errors
- Verify backend is running on port 3001
- Ensure all dependencies are installed
- Test API endpoints with curl/Postman

---

**Built for Odoo x NMIT Hackathon '25** - Demonstrating full-stack development skills with modern web technologies and sustainable development practices.