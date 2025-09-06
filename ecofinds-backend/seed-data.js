#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const db = new sqlite3.Database('./ecofinds.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database for seeding...');
    seedDatabase();
  }
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting to seed the database...');

    // Create sample users
    const users = [
      {
        username: 'alice_green',
        email: 'alice@example.com',
        password: 'password123',
        full_name: 'Alice Green',
        phone: '+1-555-0101',
        address: '123 Eco Street, Green City, GC 12345',
        profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      {
        username: 'bob_sustainable',
        email: 'bob@example.com',
        password: 'password123',
        full_name: 'Bob Sustainable',
        phone: '+1-555-0102',
        address: '456 Recycle Road, Eco Town, ET 67890',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        username: 'charlie_earth',
        email: 'charlie@example.com',
        password: 'password123',
        full_name: 'Charlie Earth',
        phone: '+1-555-0103',
        address: '789 Green Avenue, Nature City, NC 54321',
        profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      }
    ];

    console.log('👥 Creating sample users...');
    const userIds = [];
    
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO users (username, email, password_hash, full_name, phone, address, profile_image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user.username, user.email, hashedPassword, user.full_name, user.phone, user.address, user.profile_image_url],
          function(err) {
            if (err) {
              console.error('Error creating user:', err);
              reject(err);
            } else {
              console.log(`✅ Created user: ${user.username} (ID: ${this.lastID})`);
              userIds.push(this.lastID);
              resolve();
            }
          }
        );
      });
    }

    // Get category IDs
    const categories = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM categories', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('📦 Creating sample products...');

    // Create sample products
    const products = [
      {
        title: 'Vintage MacBook Pro 2019',
        description: 'Excellent condition MacBook Pro 13-inch, 8GB RAM, 256GB SSD. Perfect for students or professionals. Comes with original charger.',
        price: 899.99,
        category_id: categories.find(c => c.name === 'Electronics & Gadgets')?.id,
        user_id: userIds[0],
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
        condition: 'excellent'
      },
      {
        title: 'Designer Leather Jacket',
        description: 'Genuine leather jacket in black, size M. Worn only a few times, excellent condition. Perfect for fall/winter.',
        price: 149.99,
        category_id: categories.find(c => c.name === 'Fashion & Accessories')?.id,
        user_id: userIds[1],
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop',
        condition: 'excellent'
      },
      {
        title: 'Complete Harry Potter Book Set',
        description: 'All 7 Harry Potter books in hardcover, excellent condition. Perfect for collectors or new readers.',
        price: 79.99,
        category_id: categories.find(c => c.name === 'Books, Music & Hobbies')?.id,
        user_id: userIds[2],
        image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
        condition: 'excellent'
      },
      {
        title: 'Nike Air Max 270',
        description: 'White Nike Air Max 270, size 10. Worn a few times, very good condition. Great for running or casual wear.',
        price: 89.99,
        category_id: categories.find(c => c.name === 'Fashion & Accessories')?.id,
        user_id: userIds[0],
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
        condition: 'good'
      },
      {
        title: 'Gaming Chair - Ergonomic',
        description: 'High-quality gaming chair with lumbar support, adjustable height, and comfortable padding. Perfect for long gaming sessions.',
        price: 199.99,
        category_id: categories.find(c => c.name === 'Home & Furniture')?.id,
        user_id: userIds[1],
        image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        condition: 'very_good'
      },
      {
        title: 'iPhone 12 Pro',
        description: 'iPhone 12 Pro 128GB in Pacific Blue, excellent condition with original box and accessories. Screen protector applied.',
        price: 699.99,
        category_id: categories.find(c => c.name === 'Electronics & Gadgets')?.id,
        user_id: userIds[2],
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
        condition: 'excellent'
      },
      {
        title: 'Yoga Mat - Premium',
        description: 'High-quality yoga mat, non-slip surface, easy to clean. Perfect for home workouts or studio classes.',
        price: 39.99,
        category_id: categories.find(c => c.name === 'Sports & Fitness')?.id,
        user_id: userIds[0],
        image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
        condition: 'good'
      },
      {
        title: 'Board Game Collection',
        description: 'Collection of 5 popular board games: Monopoly, Scrabble, Chess, Checkers, and Uno. All pieces included.',
        price: 59.99,
        category_id: categories.find(c => c.name === 'Kids & Baby')?.id,
        user_id: userIds[1],
        image_url: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop',
        condition: 'very_good'
      },
      {
        title: 'Coffee Maker - Drip Style',
        description: 'Automatic drip coffee maker, 12-cup capacity, programmable timer. Makes great coffee every morning.',
        price: 49.99,
        category_id: categories.find(c => c.name === 'Home & Furniture')?.id,
        user_id: userIds[2],
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
        condition: 'good'
      },
      {
        title: 'Bicycle - Mountain Bike',
        description: '21-speed mountain bike, excellent condition, recently serviced. Perfect for trails or city riding.',
        price: 299.99,
        category_id: categories.find(c => c.name === 'Sports & Fitness')?.id,
        user_id: userIds[0],
        image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
        condition: 'excellent'
      }
    ];

    for (const product of products) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO products (title, description, price, category_id, user_id, image_url, condition) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [product.title, product.description, product.price, product.category_id, product.user_id, product.image_url, product.condition],
          function(err) {
            if (err) {
              console.error('Error creating product:', err);
              reject(err);
            } else {
              console.log(`✅ Created product: ${product.title} (ID: ${this.lastID})`);
              resolve();
            }
          }
        );
      });
    }

    // Add some sample favorites
    console.log('❤️ Creating sample favorites...');
    const favorites = [
      { user_id: userIds[0], product_id: 2 }, // Alice likes the leather jacket
      { user_id: userIds[0], product_id: 3 }, // Alice likes the Harry Potter books
      { user_id: userIds[1], product_id: 1 }, // Bob likes the MacBook
      { user_id: userIds[1], product_id: 6 }, // Bob likes the iPhone
      { user_id: userIds[2], product_id: 4 }, // Charlie likes the Nike shoes
      { user_id: userIds[2], product_id: 5 }, // Charlie likes the gaming chair
    ];

    for (const favorite of favorites) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
          [favorite.user_id, favorite.product_id],
          function(err) {
            if (err) {
              console.error('Error creating favorite:', err);
              reject(err);
            } else {
              console.log(`✅ Added favorite: User ${favorite.user_id} -> Product ${favorite.product_id}`);
              resolve();
            }
          }
        );
      });
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Created ${users.length} sample users`);
    console.log(`- Created ${products.length} sample products`);
    console.log(`- Created ${favorites.length} sample favorites`);
    console.log('\n🔑 Test Credentials:');
    console.log('Email: alice@example.com | Password: password123');
    console.log('Email: bob@example.com | Password: password123');
    console.log('Email: charlie@example.com | Password: password123');
    console.log('\n🚀 You can now start the frontend and test the application!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed.');
        process.exit(0);
      }
    });
  }
}
