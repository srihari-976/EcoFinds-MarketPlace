const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();

// Environment variables with fallbacks
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ecofinds_secret_key_2025_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(UPLOAD_PATH));

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'));
    }
  }
});

// Initialize SQLite Database
const DB_PATH = process.env.DB_PATH || './ecofinds.db';
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    initializeTables(() => {
      console.log('Database tables initialized successfully');
      startServer();
    });
  }
});

// Function to download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const file = fs.createWriteStream(path.join(UPLOAD_PATH, filename));
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
      
      file.on('error', (err) => {
        fs.unlink(path.join(UPLOAD_PATH, filename), () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to start the server after database is ready
function startServer() {
  // Start server
  app.listen(PORT, () => {
    console.log(`EcoFinds server running on port ${PORT}`);
  });
}

// Create tables
function initializeTables(callback) {
  db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    profile_image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

    // Categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER,
    user_id INTEGER NOT NULL,
    image_url TEXT,
    condition TEXT DEFAULT 'good',
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

    // Cart table
    db.run(`CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      UNIQUE(user_id, product_id)
    )`);

    // Purchases table
    db.run(`CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buyer_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (seller_id) REFERENCES users (id)
    )`);

    // Favorites/Wishlist table
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      UNIQUE(user_id, product_id)
    )`);

    // Product views table for analytics
    db.run(`CREATE TABLE IF NOT EXISTS product_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      ip_address TEXT,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at)');
    db.run('CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_purchases_seller ON purchases(seller_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    db.run('CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id)');

    // Insert default categories
    const defaultCategories = [
      "Electronics & Gadgets",
      "Home & Furniture", 
      "Fashion & Accessories",
      "Vehicles",
      "Books, Music & Hobbies",
      "Sports & Fitness",
      "Kids & Baby",
      "Appliances",
      "Industrial & Business",
      "Pets & Supplies",
      "Free Stuff",
      "Miscellaneous"
    ];
    defaultCategories.forEach(category => {
      db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category]);
    });

    // Call callback when all operations are complete
    db.run('SELECT 1', (err) => {
      if (err) {
        console.error('Error finalizing database setup:', err);
        process.exit(1);
      } else {
        console.log('Database tables and indexes created successfully');
        callback && callback();
      }
    });
  });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Input validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateProductData = (title, price) => {
  return title && title.trim().length > 0 && price && !isNaN(price) && parseFloat(price) > 0;
};

// AUTH ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    db.run(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hashedPassword, full_name || ''],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }

        const token = jwt.sign({ userId: this.lastID, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, username, email: email.toLowerCase().trim(), full_name: full_name || '' }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// USER ROUTES

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, full_name, phone, address FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Update user profile
app.put('/api/user/profile', authenticateToken, (req, res) => {
  const { full_name, phone, address, profile_image_url } = req.body;
  
  db.run(
    'UPDATE users SET full_name = ?, phone = ?, address = ?, profile_image_url = ? WHERE id = ?',
    [full_name || '', phone || '', address || '', profile_image_url || '', req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Update user profile with image URL (downloads image automatically)
app.put('/api/user/profile/with-image', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, address, profile_image_url } = req.body;
    
    let finalImageUrl = null;

    // If profile_image_url is provided, download it
    if (profile_image_url && profile_image_url.trim()) {
      try {
        const filename = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        await downloadImage(profile_image_url, filename);
        finalImageUrl = `/uploads/${filename}`;
      } catch (downloadError) {
        console.error('Failed to download profile image:', downloadError);
        return res.status(400).json({ error: 'Failed to download profile image from URL' });
      }
    }
    
    db.run(
      'UPDATE users SET full_name = ?, phone = ?, address = ?, profile_image_url = ? WHERE id = ?',
      [full_name || '', phone || '', address || '', finalImageUrl || '', req.user.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }
        res.json({ 
          message: 'Profile updated successfully',
          profile_image_url: finalImageUrl
        });
      }
    );
  } catch (error) {
    console.error('Error updating profile with image:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// CATEGORY ROUTES

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(categories);
  });
});

// PRODUCT ROUTES

// Get all products with filters and pagination
app.get('/api/products', (req, res) => {
  const { category, search, user_id, page = 1, limit = 12, sort = 'newest', min_price, max_price } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = `
    SELECT p.*, c.name as category_name, u.username as seller_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE p.status = 'available'
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ' AND p.category_id = ?';
    params.push(parseInt(category));
  }

  if (search && search.trim()) {
    query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  if (user_id) {
    query += ' AND p.user_id = ?';
    params.push(parseInt(user_id));
  }

  if (min_price) {
    query += ' AND p.price >= ?';
    params.push(parseFloat(min_price));
  }

  if (max_price) {
    query += ' AND p.price <= ?';
    params.push(parseFloat(max_price));
  }

  // Sorting options
  switch (sort) {
    case 'price_low':
      query += ' ORDER BY p.price ASC';
      break;
    case 'price_high':
      query += ' ORDER BY p.price DESC';
      break;
    case 'oldest':
      query += ' ORDER BY p.created_at ASC';
      break;
    default: // newest
      query += ' ORDER BY p.created_at DESC';
  }

  // Add pagination
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM products p 
    WHERE p.status = 'available'
  `;
  const countParams = [];

  if (category && category !== 'all') {
    countQuery += ' AND p.category_id = ?';
    countParams.push(parseInt(category));
  }

  if (search && search.trim()) {
    countQuery += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    const searchTerm = `%${search.trim()}%`;
    countParams.push(searchTerm, searchTerm);
  }

  if (user_id) {
    countQuery += ' AND p.user_id = ?';
    countParams.push(parseInt(user_id));
  }

  if (min_price) {
    countQuery += ' AND p.price >= ?';
    countParams.push(parseFloat(min_price));
  }

  if (max_price) {
    countQuery += ' AND p.price <= ?';
    countParams.push(parseFloat(max_price));
  }

  db.get(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product count' });
    }

    db.all(query, params, (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch products' });
      }
      
      res.json({
        products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(countResult.total / parseInt(limit)),
          total_items: countResult.total,
          items_per_page: parseInt(limit)
        }
      });
    });
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const query = `
    SELECT p.*, c.name as category_name, u.username as seller_name, u.phone as seller_phone 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    LEFT JOIN users u ON p.user_id = u.id 
    WHERE p.id = ?
  `;
  
  db.get(query, [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
});

// Create product with file upload
app.post('/api/products', authenticateToken, upload.single('image'), (req, res) => {
  const { title, description, price, category_id, condition } = req.body;

  if (!validateProductData(title, price)) {
    return res.status(400).json({ error: 'Title and valid price are required' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    'INSERT INTO products (title, description, price, category_id, user_id, image_url, condition) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title.trim(), description || '', parseFloat(price), category_id || null, req.user.userId, imageUrl, condition || 'good'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create product' });
      }
      res.status(201).json({
        message: 'Product created successfully',
        productId: this.lastID
      });
    }
  );
});

// Create product with image URL (downloads image automatically)
app.post('/api/products/with-image-url', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, category_id, image_url, condition } = req.body;

    if (!validateProductData(title, price)) {
      return res.status(400).json({ error: 'Title and valid price are required' });
    }

    let finalImageUrl = null;

    // If image_url is provided, download it
    if (image_url && image_url.trim()) {
      try {
        const filename = `downloaded-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        await downloadImage(image_url, filename);
        finalImageUrl = `/uploads/${filename}`;
      } catch (downloadError) {
        console.error('Failed to download image:', downloadError);
        return res.status(400).json({ error: 'Failed to download image from URL' });
      }
    }

    db.run(
      'INSERT INTO products (title, description, price, category_id, user_id, image_url, condition) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), description || '', parseFloat(price), category_id || null, req.user.userId, finalImageUrl, condition || 'good'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create product' });
        }
        res.status(201).json({
          message: 'Product created successfully',
          productId: this.lastID,
          imageUrl: finalImageUrl
        });
      }
    );
  } catch (error) {
    console.error('Error creating product with image URL:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { title, description, price, category_id } = req.body;
  const productId = req.params.id;

  if (!validateProductData(title, price)) {
    return res.status(400).json({ error: 'Title and valid price are required' });
  }

  // First check if user owns the product
  db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, req.user.userId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : product.image_url;

    db.run(
      'UPDATE products SET title = ?, description = ?, price = ?, category_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title.trim(), description || '', parseFloat(price), category_id || null, imageUrl, productId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update product' });
        }
        res.json({ message: 'Product updated successfully' });
      }
    );
  });
});

// Delete product
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;

  db.run('DELETE FROM products WHERE id = ? AND user_id = ?', [productId, req.user.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// CART ROUTES

// Get user's cart
app.get('/api/cart', authenticateToken, (req, res) => {
  const query = `
    SELECT c.*, p.title, p.price, p.image_url, p.status, u.username as seller_name
    FROM cart c
    JOIN products p ON c.product_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE c.user_id = ? AND p.status = 'available'
    ORDER BY c.added_at DESC
  `;

  db.all(query, [req.user.userId], (err, cartItems) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }
    res.json(cartItems);
  });
});

// Add to cart
app.post('/api/cart', authenticateToken, (req, res) => {
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check if product exists and is available
  db.get('SELECT * FROM products WHERE id = ? AND status = "available"', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }
    if (product.user_id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot add your own product to cart' });
    }

    db.run(
      'INSERT OR REPLACE INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)',
      [req.user.userId, product_id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to add to cart' });
        }
        res.json({ message: 'Product added to cart' });
      }
    );
  });
});

// Remove from cart
app.delete('/api/cart/:productId', authenticateToken, (req, res) => {
  db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [req.user.userId, req.params.productId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to remove from cart' });
    }
    res.json({ message: 'Product removed from cart' });
  });
});

// PURCHASE ROUTES

// Purchase product(s)
app.post('/api/purchase', authenticateToken, (req, res) => {
  const { product_ids } = req.body;

  if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return res.status(400).json({ error: 'Product IDs array is required' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let completedPurchases = 0;
    let errors = [];

    product_ids.forEach(productId => {
      db.get('SELECT * FROM products WHERE id = ? AND status = "available"', [productId], (err, product) => {
        if (err || !product) {
          errors.push(`Product ${productId} not found or unavailable`);
        } else if (product.user_id === req.user.userId) {
          errors.push(`Cannot purchase your own product ${productId}`);
        } else {
          // Create purchase record
          db.run(
            'INSERT INTO purchases (buyer_id, product_id, seller_id, price) VALUES (?, ?, ?, ?)',
            [req.user.userId, productId, product.user_id, product.price],
            (err) => {
              if (err) {
                errors.push(`Failed to create purchase record for product ${productId}`);
              } else {
                // Update product status
                db.run('UPDATE products SET status = "sold" WHERE id = ?', [productId]);
                // Remove from cart
                db.run('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [req.user.userId, productId]);
                completedPurchases++;
              }

              // Check if all products processed
              if (completedPurchases + errors.length === product_ids.length) {
                if (errors.length > 0) {
                  db.run('ROLLBACK');
                  res.status(400).json({ error: 'Purchase failed', details: errors });
                } else {
                  db.run('COMMIT');
                  res.json({ message: 'Purchase completed successfully', purchased: completedPurchases });
                }
              }
            }
          );
        }
      });
    });
  });
});

// Buy now with payment confirmation
app.post('/api/buy-now', authenticateToken, (req, res) => {
  const { product_id, payment_method } = req.body;
  
  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  db.get('SELECT * FROM products WHERE id = ? AND status = "available"', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    if (product.user_id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot purchase your own product' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Create purchase record
      db.run(
        'INSERT INTO purchases (buyer_id, product_id, seller_id, price) VALUES (?, ?, ?, ?)',
        [req.user.userId, product_id, product.user_id, product.price],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Purchase failed' });
          }

          // Update product status
          db.run('UPDATE products SET status = "sold" WHERE id = ?', [product_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to update product status' });
            }

            db.run('COMMIT');
            res.json({ 
              message: 'Purchase successful! Your item has been booked.',
              purchase_id: this.lastID,
              product: product,
              payment_method: payment_method,
              total_amount: product.price
            });
          });
        }
      );
    });
  });
});

// Get purchase history
app.get('/api/purchases', authenticateToken, (req, res) => {
  const query = `
    SELECT p.*, pr.title, pr.description, pr.image_url, u.username as seller_name
    FROM purchases p
    JOIN products pr ON p.product_id = pr.id
    JOIN users u ON p.seller_id = u.id
    WHERE p.buyer_id = ?
    ORDER BY p.purchase_date DESC
  `;

  db.all(query, [req.user.userId], (err, purchases) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch purchase history' });
    }
    res.json(purchases);
  });
});

// FAVORITES/WISHLIST ROUTES

// Get user's favorites
app.get('/api/favorites', authenticateToken, (req, res) => {
  const query = `
    SELECT f.*, p.title, p.description, p.price, p.image_url, p.status, c.name as category_name, u.username as seller_name
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE f.user_id = ? AND p.status = 'available'
    ORDER BY f.created_at DESC
  `;

  db.all(query, [req.user.userId], (err, favorites) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }
    res.json(favorites);
  });
});

// Add to favorites
app.post('/api/favorites', authenticateToken, (req, res) => {
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check if product exists and is available
  db.get('SELECT * FROM products WHERE id = ? AND status = "available"', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }
    if (product.user_id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot add your own product to favorites' });
    }

    db.run(
      'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
      [req.user.userId, product_id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to add to favorites' });
        }
        if (this.changes === 0) {
          return res.status(400).json({ error: 'Product already in favorites' });
        }
        res.json({ message: 'Product added to favorites' });
      }
    );
  });
});

// Remove from favorites
app.delete('/api/favorites/:productId', authenticateToken, (req, res) => {
  db.run('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [req.user.userId, req.params.productId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to remove from favorites' });
    }
    res.json({ message: 'Product removed from favorites' });
  });
});

// ANALYTICS ROUTES

// Track product view
app.post('/api/products/:id/view', (req, res) => {
  const productId = req.params.id;
  const userId = req.headers['authorization'] ? 
    (jwt.verify(req.headers['authorization'].split(' ')[1], JWT_SECRET, (err, decoded) => 
      err ? null : decoded.userId)) : null;
  const ipAddress = req.ip || req.connection.remoteAddress;

  db.run(
    'INSERT INTO product_views (product_id, user_id, ip_address) VALUES (?, ?, ?)',
    [productId, userId, ipAddress],
    (err) => {
      if (err) {
        console.error('Failed to track view:', err);
      }
      res.json({ message: 'View tracked' });
    }
  );
});

// Get product statistics (for sellers)
app.get('/api/products/:id/stats', authenticateToken, (req, res) => {
  const productId = req.params.id;

  // Check if user owns the product
  db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, req.user.userId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Get view count
    db.get('SELECT COUNT(*) as view_count FROM product_views WHERE product_id = ?', [productId], (err, views) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch view count' });
      }

      // Get favorites count
      db.get('SELECT COUNT(*) as favorites_count FROM favorites WHERE product_id = ?', [productId], (err, favorites) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch favorites count' });
        }

        res.json({
          view_count: views.view_count,
          favorites_count: favorites.favorites_count,
          created_at: product.created_at,
          status: product.status
        });
      });
    });
  });
});

// Get sample product images for manual addition
app.get('/api/sample-images', (req, res) => {
  const sampleImages = [
    {
      id: 1,
      name: 'Electronics - Laptop',
      url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
      category: 'Electronics & Gadgets'
    },
    {
      id: 2,
      name: 'Fashion - Jacket',
      url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop',
      category: 'Fashion & Accessories'
    },
    {
      id: 3,
      name: 'Books - Collection',
      url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      category: 'Books, Music & Hobbies'
    },
    {
      id: 4,
      name: 'Sports - Bicycle',
      url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
      category: 'Sports & Fitness'
    },
    {
      id: 5,
      name: 'Home - Chair',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      category: 'Home & Furniture'
    },
    {
      id: 6,
      name: 'Kids - Board Games',
      url: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
      category: 'Kids & Baby'
    },
    {
      id: 7,
      name: 'Electronics - Phone',
      url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
      category: 'Electronics & Gadgets'
    },
    {
      id: 8,
      name: 'Fashion - Shoes',
      url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
      category: 'Fashion & Accessories'
    },
    {
      id: 9,
      name: 'Vehicle - Car',
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop',
      category: 'Vehicles'
    },
    {
      id: 10,
      name: 'Appliances - Microwave',
      url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=300&fit=crop',
      category: 'Appliances'
    }
  ];

  res.json(sampleImages);
});

// Bulk create products with sample data
app.post('/api/products/bulk-create', authenticateToken, async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    const results = [];
    const errors = [];

    for (const productData of products) {
      try {
        const { title, description, price, category_id, image_url, condition } = productData;

        if (!validateProductData(title, price)) {
          errors.push({ product: title, error: 'Title and valid price are required' });
          continue;
        }

        let finalImageUrl = null;

        // If image_url is provided, download it
        if (image_url && image_url.trim()) {
          try {
            const filename = `bulk-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            await downloadImage(image_url, filename);
            finalImageUrl = `/uploads/${filename}`;
          } catch (downloadError) {
            console.error('Failed to download image for product:', title, downloadError);
            errors.push({ product: title, error: 'Failed to download image' });
            continue;
          }
        }

        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO products (title, description, price, category_id, user_id, image_url, condition) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title.trim(), description || '', parseFloat(price), category_id || null, req.user.userId, finalImageUrl, condition || 'good'],
            function(err) {
              if (err) {
                reject(err);
              } else {
                results.push({
                  productId: this.lastID,
                  title: title,
                  imageUrl: finalImageUrl
                });
                resolve();
              }
            }
          );
        });
      } catch (error) {
        errors.push({ product: productData.title || 'Unknown', error: error.message });
      }
    }

    res.status(201).json({
      message: `Successfully created ${results.length} products`,
      created: results,
      errors: errors
    });
  } catch (error) {
    console.error('Error in bulk product creation:', error);
    res.status(500).json({ error: 'Failed to create products' });
  }
});

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Error handling middleware
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`${timestamp} - Error:`, error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` });
    }
    return res.status(400).json({ error: 'File upload error: ' + error.message });
  }
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({ 
    error: isDevelopment ? error.message : 'Something went wrong!',
    ...(isDevelopment && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});