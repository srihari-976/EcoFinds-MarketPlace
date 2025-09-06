import React, { useState, useEffect, createContext, useContext, Component } from 'react';
import { Search, Plus, Edit, Trash2, ShoppingCart, User, LogOut, Eye, Home, Package, History, Menu, X, AlertTriangle, Heart, Filter, SortAsc, Upload, Link, Image, Download, Copy, Check, ArrowLeft, CreditCard, DollarSign } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

class ApiService {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    if (options.body && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    } else if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  static async register(userData) { return this.request('/auth/register', { method: 'POST', body: userData }); }
  static async login(credentials) { return this.request('/auth/login', { method: 'POST', body: credentials }); }
  static async getProfile() { return this.request('/user/profile'); }
  static async updateProfile(profileData) { return this.request('/user/profile', { method: 'PUT', body: profileData }); }
  static async updateProfileWithImage(profileData) { return this.request('/user/profile/with-image', { method: 'PUT', body: profileData }); }
  static async getProducts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.append(key, value); });
    return this.request(`/products?${params.toString()}`);
  }
  static async getProduct(id) { return this.request(`/products/${id}`); }
  static async createProduct(productData) { return this.request('/products', { method: 'POST', body: productData }); }
  static async createProductWithImageUrl(productData) { return this.request('/products/with-image-url', { method: 'POST', body: productData }); }
  static async bulkCreateProducts(products) { return this.request('/products/bulk-create', { method: 'POST', body: { products } }); }
  static async updateProduct(id, productData) { return this.request(`/products/${id}`, { method: 'PUT', body: productData }); }
  static async deleteProduct(id) { return this.request(`/products/${id}`, { method: 'DELETE' }); }
  static async getCategories() { return this.request('/categories'); }
  static async getSampleImages() { return this.request('/sample-images'); }
  static async getCart() { return this.request('/cart'); }
  static async addToCart(productId) { return this.request('/cart', { method: 'POST', body: { product_id: productId } }); }
  static async removeFromCart(productId) { return this.request(`/cart/${productId}`, { method: 'DELETE' }); }
  static async purchase(productIds) { return this.request('/purchase', { method: 'POST', body: { product_ids: productIds } }); }
  static async buyNow(productId, paymentMethod) { return this.request('/buy-now', { method: 'POST', body: { product_id: productId, payment_method: paymentMethod } }); }
  static async getPurchaseHistory() { return this.request('/purchases'); }
  static async getFavorites() { return this.request('/favorites'); }
  static async addToFavorites(productId) { return this.request('/favorites', { method: 'POST', body: { product_id: productId } }); }
  static async removeFromFavorites(productId) { return this.request(`/favorites/${productId}`, { method: 'DELETE' }); }
  static async trackProductView(productId) { return this.request(`/products/${productId}/view`, { method: 'POST' }); }
  static async getProductStats(productId) { return this.request(`/products/${productId}/stats`); }
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try { setUser(JSON.parse(userData)); } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await ApiService.login(credentials);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    return response;
  };

  const register = async (userData) => {
    const response = await ApiService.register(userData);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    return response;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>{children}</AuthContext.Provider>;
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Navigation = ({ currentView, setCurrentView, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'myListings', label: 'My Listings', icon: Package },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'purchases', label: 'Purchases', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      <nav className="hidden md:flex items-center justify-between bg-white shadow-sm px-6 py-4 border-b">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-green-600">EcoFinds</h1>
          <div className="flex items-center gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentView === item.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </nav>

      <div className="md:hidden bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-green-600">EcoFinds</h1>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="px-4 py-2 border-t">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg mb-1 ${
                    currentView === item.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center py-2 px-3 ${
                  currentView === item.id ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

const LoginForm = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-600 mb-2">EcoFinds</h1>
          <p className="text-gray-600">Sustainable Second-Hand Marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, onEdit, onDelete, onToggleFavorite, isFavorite = false, showActions = false, showFavorite = true }) => {
  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'very_good': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'excellent': return 'Excellent';
      case 'very_good': return 'Very Good';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Good';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200 flex items-center justify-center">
      {product.image_url ? (
        <img src={`http://localhost:3001${product.image_url}`} alt={product.title} className="w-full h-full object-cover" />
      ) : (
        <div className="text-gray-400">No Image</div>
      )}
        {showFavorite && !showActions && (
          <button
            onClick={() => onToggleFavorite && onToggleFavorite(product.id)}
            className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
      )}
    </div>
    <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{product.title}</h3>
          {product.condition && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(product.condition)}`}>
              {getConditionText(product.condition)}
            </span>
          )}
        </div>
      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
      <div className="flex justify-between items-center mb-2">
        <span className="text-green-600 font-bold text-xl">${product.price}</span>
        <span className="text-gray-500 text-sm">{product.category_name}</span>
      </div>
        {product.seller_name && (
          <p className="text-gray-500 text-xs mb-2">by {product.seller_name}</p>
        )}
      {showActions ? (
        <div className="flex gap-2">
          <button onClick={() => onEdit(product)} className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button onClick={() => onDelete(product.id)} className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : (
        <button onClick={() => onAddToCart(product.id)} className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
      )}
    </div>
  </div>
);
};

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || '',
    category_id: product?.category_id || '',
    condition: product?.condition || 'good',
    image_url: ''
  });
  const [categories, setCategories] = useState([]);
  const [sampleImages, setSampleImages] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageMethod, setImageMethod] = useState('upload'); // 'upload', 'url', 'sample'
  const [selectedSampleImage, setSelectedSampleImage] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    Promise.all([
      ApiService.getCategories(),
      ApiService.getSampleImages()
    ]).then(([categoriesData, sampleImagesData]) => {
      setCategories(categoriesData);
      setSampleImages(sampleImagesData);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (imageMethod === 'upload' && image) {
        // File upload method
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
        data.append('image', image);
      await onSubmit(data);
      } else if (imageMethod === 'url' && formData.image_url) {
        // Image URL method
        await onSubmit({ ...formData, image_url: formData.image_url });
      } else if (imageMethod === 'sample' && selectedSampleImage) {
        // Sample image method
        await onSubmit({ ...formData, image_url: selectedSampleImage.url });
      } else {
        // No image
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">{product ? 'Edit Product' : 'Add New Product'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
        <input
          type="text"
              placeholder="Enter product title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          required
        />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={formData.category_id}
          onChange={(e) => setFormData({...formData, category_id: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="excellent">Excellent - Like New</option>
              <option value="very_good">Very Good - Minor Wear</option>
              <option value="good">Good - Some Wear</option>
              <option value="fair">Fair - Noticeable Wear</option>
              <option value="poor">Poor - Heavy Wear</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
            placeholder="Describe your product..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-24"
        />
        </div>

        {/* Image Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Product Image</label>
          
          {/* Image Method Selection */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setImageMethod('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                imageMethod === 'upload' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setImageMethod('url')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                imageMethod === 'url' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              <Link className="h-4 w-4" />
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setImageMethod('sample')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                imageMethod === 'sample' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              <Image className="h-4 w-4" />
              Sample Images
            </button>
          </div>

          {/* Image Input Based on Method */}
          {imageMethod === 'upload' && (
            <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
              {image && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Selected: {image.name}</p>
                </div>
              )}
            </div>
          )}

          {imageMethod === 'url' && (
            <div>
        <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                {formData.image_url && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.image_url)}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Image will be downloaded and stored locally</p>
            </div>
          )}

          {imageMethod === 'sample' && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                {sampleImages.map(sample => (
                  <div
                    key={sample.id}
                    onClick={() => setSelectedSampleImage(sample)}
                    className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                      selectedSampleImage?.id === sample.id ? 'border-green-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-20 object-cover"
                    />
                    <p className="text-xs p-1 text-center bg-gray-50">{sample.name}</p>
                  </div>
                ))}
              </div>
              {selectedSampleImage && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">Selected: {selectedSampleImage.name}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {product ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const HomePage = ({ onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({ 
    category: '', 
    search: '', 
    sort: 'newest',
    min_price: '',
    max_price: '',
    page: 1
  });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    try {
      const [productsData, categoriesData, favoritesData] = await Promise.all([
      ApiService.getProducts(filters),
        ApiService.getCategories(),
        ApiService.getFavorites()
      ]);
      
      setProducts(productsData.products || productsData);
      setPagination(productsData.pagination || {});
      setCategories(categoriesData);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleAddToCart = async (productId) => {
    try {
      await ApiService.addToCart(productId);
      alert('Product added to cart!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleToggleFavorite = async (productId) => {
    try {
      const isCurrentlyFavorite = favorites.some(fav => fav.product_id === productId);
      if (isCurrentlyFavorite) {
        await ApiService.removeFromFavorites(productId);
        setFavorites(favorites.filter(fav => fav.product_id !== productId));
      } else {
        await ApiService.addToFavorites(productId);
        const newFavorite = { product_id: productId };
        setFavorites([...favorites, newFavorite]);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const isFavorite = (productId) => favorites.some(fav => fav.product_id === productId);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value, page: 1})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({...filters, sort: e.target.value, page: 1})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.min_price}
                  onChange={(e) => setFilters({...filters, min_price: e.target.value, page: 1})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />

                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.max_price}
                  onChange={(e) => setFilters({...filters, max_price: e.target.value, page: 1})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} onClick={() => onProductClick && onProductClick(product.id)} className="cursor-pointer">
              <ProductCard 
                product={product} 
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(product.id)}
              />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <button
              onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
              disabled={filters.page === 1}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-green-600 text-white rounded-lg">
              {filters.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setFilters({...filters, page: Math.min(pagination.total_pages, filters.page + 1)})}
              disabled={filters.page === pagination.total_pages}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BulkProductCreator = ({ onClose, onSuccess }) => {
  const [products, setProducts] = useState([{ title: '', description: '', price: '', category_id: '', condition: 'good', image_url: '' }]);
  const [categories, setCategories] = useState([]);
  const [sampleImages, setSampleImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      ApiService.getCategories(),
      ApiService.getSampleImages()
    ]).then(([categoriesData, sampleImagesData]) => {
      setCategories(categoriesData);
      setSampleImages(sampleImagesData);
    }).catch(console.error);
  }, []);

  const addProduct = () => {
    setProducts([...products, { title: '', description: '', price: '', category_id: '', condition: 'good', image_url: '' }]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validProducts = products.filter(p => p.title && p.price);
      if (validProducts.length === 0) {
        alert('Please add at least one product with title and price');
        return;
      }

      const result = await ApiService.bulkCreateProducts(validProducts);
      alert(`Successfully created ${result.created.length} products!`);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Error creating products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bulk Create Products</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {products.map((product, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Product {index + 1}</h3>
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={product.title}
                      onChange={(e) => updateProduct(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={product.category_id}
                      onChange={(e) => updateProduct(index, 'category_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      value={product.condition}
                      onChange={(e) => updateProduct(index, 'condition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="excellent">Excellent - Like New</option>
                      <option value="very_good">Very Good - Minor Wear</option>
                      <option value="good">Good - Some Wear</option>
                      <option value="fair">Fair - Noticeable Wear</option>
                      <option value="poor">Poor - Heavy Wear</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={product.description}
                    onChange={(e) => updateProduct(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-20"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={product.image_url}
                    onChange={(e) => updateProduct(index, 'image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating Products...' : 'Create All Products'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const MyListingsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const data = await ApiService.getProducts({ user_id: user.id });
      setProducts(data.products || data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [user.id]);

  const handleSubmit = async (formData) => {
    try {
      if (editingProduct) {
        await ApiService.updateProduct(editingProduct.id, formData);
      } else {
        // Check if it's a FormData (file upload) or regular object (URL/sample image)
        if (formData instanceof FormData) {
          await ApiService.createProduct(formData);
        } else if (formData.image_url) {
          await ApiService.createProductWithImageUrl(formData);
        } else {
          await ApiService.createProduct(formData);
        }
      }
      setShowForm(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await ApiService.deleteProduct(productId);
        loadProducts();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  if (showForm) {
    return (
      <div className="p-4">
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Listings</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkCreator(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Bulk Add
            </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              showActions={true}
              onEdit={(product) => { setEditingProduct(product); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">You haven't listed any products yet</p>
          </div>
        )}
      </div>

      {/* Bulk Creator Modal */}
      {showBulkCreator && (
        <BulkProductCreator
          onClose={() => setShowBulkCreator(false)}
          onSuccess={loadProducts}
        />
      )}
    </div>
  );
};

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      const data = await ApiService.getCart();
      setCartItems(data);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCart(); }, []);

  const handleRemove = async (productId) => {
    try {
      await ApiService.removeFromCart(productId);
      loadCart();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePurchase = async () => {
    if (cartItems.length === 0) return;
    
    try {
      const productIds = cartItems.map(item => item.product_id);
      await ApiService.purchase(productIds);
      alert('Purchase completed successfully!');
      loadCart();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBuyNow = async (productId) => {
    const product = cartItems.find(item => item.product_id === productId);
    if (!product) return;

    const paymentMethod = prompt('Choose payment method:\n1. Credit Card\n2. Debit Card\n3. PayPal\n4. Cash on Delivery\n\nEnter number (1-4):');
    
    if (!paymentMethod || !['1', '2', '3', '4'].includes(paymentMethod)) {
      alert('Please select a valid payment method');
      return;
    }

    const paymentMethods = {
      '1': 'credit_card',
      '2': 'debit_card', 
      '3': 'paypal',
      '4': 'cash_on_delivery'
    };

    try {
      const result = await ApiService.buyNow(productId, paymentMethods[paymentMethod]);
      alert(result.message);
      loadCart();
    } catch (error) {
      alert('Purchase failed: ' + error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    {item.image_url ? (
                      <img src={`http://localhost:3001${item.image_url}`} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-gray-600 text-sm">Seller: {item.seller_name}</p>
                    <p className="text-green-600 font-bold">${item.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBuyNow(item.product_id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
                <button
                  onClick={handlePurchase}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Purchase All
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const data = await ApiService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (productId) => {
    try {
      await ApiService.removeFromFavorites(productId);
      setFavorites(favorites.filter(fav => fav.product_id !== productId));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await ApiService.addToCart(productId);
      alert('Product added to cart!');
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">My Favorites</h2>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No favorites yet</p>
            <p className="text-gray-400 text-sm">Add products to your favorites by clicking the heart icon</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map(favorite => (
              <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200 flex items-center justify-center">
                  {favorite.image_url ? (
                    <img src={`http://localhost:3001${favorite.image_url}`} alt={favorite.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400">No Image</div>
                  )}
                  <button
                    onClick={() => handleRemoveFavorite(favorite.product_id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{favorite.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{favorite.description}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-600 font-bold text-xl">${favorite.price}</span>
                    <span className="text-gray-500 text-sm">{favorite.category_name}</span>
                  </div>
                  {favorite.seller_name && (
                    <p className="text-gray-500 text-xs mb-2">by {favorite.seller_name}</p>
                  )}
                  <button 
                    onClick={() => handleAddToCart(favorite.product_id)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getPurchaseHistory()
      .then(setPurchases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Purchase History</h2>

        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No purchases yet</p>
            <p className="text-gray-400 text-sm">Your purchase history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map(purchase => (
              <div key={purchase.id} className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {purchase.image_url ? (
                    <img src={`http://localhost:3001${purchase.image_url}`} alt={purchase.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-gray-400 text-xs">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{purchase.title}</h3>
                  <p className="text-gray-600 text-sm">{purchase.description}</p>
                  <p className="text-gray-600 text-sm">Seller: {purchase.seller_name}</p>
                  <p className="text-green-600 font-bold">${purchase.price}</p>
                  <p className="text-gray-500 text-sm">
                    Purchased: {new Date(purchase.purchase_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetailPage = ({ productId, onBack }) => {
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    loadProductDetails();
    loadRecommendations();
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      const data = await ApiService.getProduct(productId);
      setProduct(data);
      
      // Track product view
      await ApiService.trackProductView(productId);
      
      // Check if product is in favorites
      const favorites = await ApiService.getFavorites();
      setIsFavorite(favorites.some(fav => fav.product_id === productId));
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const data = await ApiService.getProducts({ limit: 4 });
      setRecommendations(data.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await ApiService.removeFromFavorites(productId);
      } else {
        await ApiService.addToFavorites(productId);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      await ApiService.addToCart(productId);
      alert('Product added to cart!');
    } catch (error) {
      alert('Error adding to cart: ' + error.message);
    }
  };

  const handleBuyNow = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    try {
      const result = await ApiService.buyNow(productId, selectedPaymentMethod);
      alert(result.message);
      setShowPaymentModal(false);
      onBack(); // Go back to previous page
    } catch (error) {
      alert('Payment failed: ' + error.message);
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'very_good': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'excellent': return 'Excellent';
      case 'very_good': return 'Very Good';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Good';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="p-4 text-center">Product not found</div>;

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {product.image_url ? (
              <img 
                src={`http://localhost:3001${product.image_url}`} 
                alt={product.title} 
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                <div className="text-gray-400">No Image</div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold">{product.title}</h1>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-full ${
                    isFavorite ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              {product.condition && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(product.condition)}`}>
                  {getConditionText(product.condition)}
                </span>
              )}
            </div>

            <div className="text-4xl font-bold text-green-600">${product.price}</div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{product.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Category:</span>
                <p className="text-gray-600">{product.category_name}</p>
              </div>
              <div>
                <span className="font-semibold">Seller:</span>
                <p className="text-gray-600">{product.seller_name}</p>
              </div>
              <div>
                <span className="font-semibold">Listed:</span>
                <p className="text-gray-600">{new Date(product.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-semibold">Status:</span>
                <p className={`font-semibold ${product.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  {product.status === 'available' ? 'Available' : 'Sold'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {product.status === 'available' && product.user_id !== user?.id && (
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <DollarSign className="h-5 w-5" />
                  Buy Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map(rec => (
                <ProductCard
                  key={rec.id}
                  product={rec}
                  onAddToCart={() => ApiService.addToCart(rec.id)}
                  onToggleFavorite={() => {}}
                  isFavorite={false}
                  showFavorite={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Choose Payment Method</h3>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="credit_card"
                  checked={selectedPaymentMethod === 'credit_card'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <CreditCard className="h-5 w-5 mr-2" />
                Credit Card
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="debit_card"
                  checked={selectedPaymentMethod === 'debit_card'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <CreditCard className="h-5 w-5 mr-2" />
                Debit Card
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={selectedPaymentMethod === 'paypal'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <DollarSign className="h-5 w-5 mr-2" />
                PayPal
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cash_on_delivery"
                  checked={selectedPaymentMethod === 'cash_on_delivery'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <DollarSign className="h-5 w-5 mr-2" />
                Cash on Delivery
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profile_image_url: user?.profile_image_url || ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageMethod, setImageMethod] = useState('url'); // 'url', 'sample'
  const [selectedSampleImage, setSelectedSampleImage] = useState(null);
  const [sampleImages, setSampleImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSampleImages();
  }, []);

  const loadSampleImages = async () => {
    try {
      const data = await ApiService.getSampleImages();
      setSampleImages(data);
    } catch (error) {
      console.error('Error loading sample images:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let profileData = { ...profile };
      
      // Handle profile image
      if (imageMethod === 'sample' && selectedSampleImage) {
        profileData.profile_image_url = selectedSampleImage.url;
      }

      if (profileData.profile_image_url) {
        await ApiService.updateProfileWithImage(profileData);
      } else {
        await ApiService.updateProfile(profileData);
      }
      
      updateUser(profileData);
      setProfile({ ...profile, ...profileData });
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Profile</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            {profile.profile_image_url ? (
              <img 
                src={`http://localhost:3001${profile.profile_image_url}`} 
                alt="Profile" 
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-green-600"
              />
            ) : (
              <div className="w-24 h-24 bg-green-600 rounded-full mx-auto flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
            </div>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                    value={profile.username || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                    value={profile.email || ''}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                disabled
              />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                  placeholder="Enter full name"
                  value={profile.full_name || ''}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                    placeholder="Enter phone number"
                    value={profile.phone || ''}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Enter address"
                    value={profile.address || ''}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Profile Image Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Image</label>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setImageMethod('url')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      imageMethod === 'url' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    <Link className="h-4 w-4" />
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMethod('sample')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      imageMethod === 'sample' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    <Image className="h-4 w-4" />
                    Sample Images
                  </button>
                </div>

                {imageMethod === 'url' && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://example.com/profile-image.jpg"
                      value={profile.profile_image_url || ''}
                      onChange={(e) => setProfile({...profile, profile_image_url: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image will be downloaded and stored locally</p>
                  </div>
                )}

                {imageMethod === 'sample' && (
                  <div>
                    <div className="grid grid-cols-4 gap-3 max-h-32 overflow-y-auto">
                      {sampleImages.slice(0, 4).map(sample => (
                        <div
                          key={sample.id}
                          onClick={() => setSelectedSampleImage(sample)}
                          className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                            selectedSampleImage?.id === sample.id ? 'border-green-600' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={sample.url}
                            alt={sample.name}
                            className="w-full h-16 object-cover"
                          />
                          <p className="text-xs p-1 text-center bg-gray-50">{sample.name}</p>
                        </div>
                      ))}
                    </div>
                    {selectedSampleImage && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">Selected: {selectedSampleImage.name}</p>
                      </div>
                    )}
                  </div>
                )}
            </div>

            <button
              type="submit"
              disabled={saving}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Update Profile
                  </>
                )}
            </button>
          </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {profile.username || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {profile.email || 'Not provided'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {profile.full_name || 'Not provided'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {profile.phone || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {profile.address || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const { user, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginForm />;

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomePage onProductClick={(productId) => { setSelectedProductId(productId); setCurrentView('product-detail'); }} />;
      case 'myListings': return <MyListingsPage />;
      case 'favorites': return <FavoritesPage />;
      case 'cart': return <CartPage />;
      case 'purchases': return <PurchasesPage />;
      case 'profile': return <ProfilePage />;
      case 'product-detail': return <ProductDetailPage productId={selectedProductId} onBack={() => setCurrentView('home')} />;
      default: return <HomePage onProductClick={(productId) => { setSelectedProductId(productId); setCurrentView('product-detail'); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} setCurrentView={setCurrentView} onLogout={logout} />
      {renderView()}
    </div>
  );
};

export default function AppWrapper() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
    </ErrorBoundary>
  );
}