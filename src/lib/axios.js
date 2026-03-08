import axios from 'axios';

// Hardcoded API URL - change this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error(`❌ ${error.response.status} ${error.config.url}:`, error.response.data);
      
      // Handle specific status codes
      switch (error.response.status) {
        case 400:
          error.message = error.response.data.message || 'Bad request';
          break;
        case 401:
          error.message = 'Unauthorized. Please login again.';
          break;
        case 403:
          error.message = 'You do not have permission to perform this action';
          break;
        case 404:
          error.message = 'Resource not found';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
        default:
          error.message = error.response.data.message || 'An error occurred';
      }
    } else if (error.request) {
      // Request made but no response
      console.error('📡 No response from server');
      error.message = 'Cannot connect to server. Please check if the backend is running.';
    }
    
    return Promise.reject(error);
  }
);

// ==================== BOOK API ENDPOINTS ====================
export const bookAPI = {
  // Get all books with search and category filter
  getAll: (params = {}) => api.get('/books', { params }),
  
  // Get single book by ID
  getById: (id) => api.get(`/books/${id}`),
  
  // Create new book
  create: (data) => api.post('/books', data),
  
  // Update book
  update: (id, data) => api.put(`/books/${id}`, data),
  
  // Delete book
  delete: (id) => api.delete(`/books/${id}`),
  
  // Get category statistics
  getStats: () => api.get('/books/stats/categories'),
  
  // Borrow a book (if using book-specific endpoints)
  borrow: (id) => api.post(`/books/${id}/borrow`),
  
  // Return a book (if using book-specific endpoints)
  return: (id) => api.post(`/books/${id}/return`)
};

// ==================== BORROWER API ENDPOINTS ====================
export const borrowerAPI = {
  // Get all borrowers with optional search
  getAll: (search = '', status = '', type = '') => {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (type) params.type = type;
    return api.get('/borrowers', { params });
  },
  
  // Get single borrower with history
  getById: (id) => api.get(`/borrowers/${id}`),
  
  // Create new borrower
  create: (data) => api.post('/borrowers', data),
  
  // Update borrower
  update: (id, data) => api.put(`/borrowers/${id}`, data),
  
  // Delete borrower (soft delete)
  delete: (id) => api.delete(`/borrowers/${id}`),
  
  // Get borrower's active borrowings
  getActiveBorrowings: (id) => api.get(`/borrowers/${id}/active`),
  
  // Get borrower's history with pagination
  getHistory: (id, page = 1, limit = 10) => 
    api.get(`/borrowers/${id}/history`, { params: { page, limit } })
};

// ==================== CIRCULATION API ENDPOINTS ====================
export const circulationAPI = {
  // Borrow a book
  borrow: (data) => api.post('/circulation/borrow', data),
  
  // Return a book
  return: (recordId) => api.post(`/circulation/return/${recordId}`),
  
  // Renew a book
  renew: (recordId, additionalDays = 7) => 
    api.post(`/circulation/renew/${recordId}`, { additionalDays }),
  
  // Get all active loans
  getActiveLoans: () => api.get('/circulation/active'),
  
  // Get overdue loans
  getOverdueLoans: () => api.get('/circulation/overdue'),
  
  // Check book availability
  checkAvailability: (bookId) => api.get(`/circulation/check-availability/${bookId}`),
  
  // Get circulation stats
  getStats: () => api.get('/circulation/stats'),
  
  // Get due soon books (next 7 days)
  getDueSoon: () => api.get('/circulation/due-soon'),
  
  // Get borrower's history
  getBorrowerHistory: (borrowerId, page = 1, limit = 10) => 
    api.get(`/circulation/borrower/${borrowerId}/history`, { params: { page, limit } }),
  
  // Get book's history
  getBookHistory: (bookId, page = 1, limit = 10) => 
    api.get(`/circulation/book/${bookId}/history`, { params: { page, limit } }),
  
  // Get fine payment status (if using fines)
  getFineStatus: (recordId) => api.get(`/circulation/fines/${recordId}`),
  
  // Pay fine (if using fines)
  payFine: (recordId) => api.post(`/circulation/fines/${recordId}/pay`),
  
  // Bulk return books
  bulkReturn: (recordIds) => api.post('/circulation/bulk-return', { recordIds }),
  
  // Process overdue (admin only)
  processOverdue: () => api.post('/circulation/process-overdue')
};

// ==================== DASHBOARD API ENDPOINTS ====================
export const dashboardAPI = {
  // Get main dashboard statistics
  getStats: () => api.get('/dashboard/stats'),
  
  // Get recent activities
  getRecentActivities: (limit = 10) => 
    api.get('/dashboard/recent-activities', { params: { limit } }),
  
  // Get borrower rankings
  getBorrowerRankings: () => api.get('/dashboard/borrower-rankings'),
  
  // Get overdue books
  getOverdueBooks: () => api.get('/dashboard/overdue-books'),
  
  // Get books by category
  getBooksByCategory: () => api.get('/dashboard/books-by-category')
};

// ==================== AUTH API ENDPOINTS (for future use) ====================
export const authAPI = {
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Register new user
  register: (userData) => api.post('/auth/register', userData),
  
  // Logout user
  logout: () => api.post('/auth/logout'),
  
  // Get current user profile
  getProfile: () => api.get('/auth/profile'),
  
  // Update user profile
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Change password
  changePassword: (data) => api.post('/auth/change-password', data),
  
  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
};

// ==================== REPORTS API ENDPOINTS (for future use) ====================
export const reportsAPI = {
  // Get borrowing reports
  getBorrowingReport: (startDate, endDate) => 
    api.get('/reports/borrowing', { params: { startDate, endDate } }),
  
  // Get popular books report
  getPopularBooks: (limit = 10) => 
    api.get('/reports/popular-books', { params: { limit } }),
  
  // Get borrower activity report
  getBorrowerActivity: (borrowerId, startDate, endDate) => 
    api.get(`/reports/borrower/${borrowerId}`, { params: { startDate, endDate } }),
  
  // Get category statistics
  getCategoryStats: () => api.get('/reports/categories'),
  
  // Export data
  exportData: (type, format = 'csv') => 
    api.get(`/reports/export/${type}`, { params: { format }, responseType: 'blob' })
};

// ==================== SETTINGS API ENDPOINTS (for future use) ====================
export const settingsAPI = {
  // Get library settings
  getSettings: () => api.get('/settings'),
  
  // Update library settings
  updateSettings: (data) => api.put('/settings', data),
  
  // Get categories
  getCategories: () => api.get('/settings/categories'),
  
  // Add category
  addCategory: (name) => api.post('/settings/categories', { name }),
  
  // Delete category
  deleteCategory: (id) => api.delete(`/settings/categories/${id}`)
};

// ==================== HELPER FUNCTIONS ====================

// Handle API errors gracefully
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      status: error.response.status,
      message: error.response.data.message || 'An error occurred',
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      status: 503,
      message: 'Network error. Please check your connection.',
      data: null
    };
  } else {
    // Something else happened
    return {
      status: 500,
      message: error.message || 'An unexpected error occurred',
      data: null
    };
  }
};

// Cancel token for requests (useful for search inputs)
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Export the base api instance for custom calls
export default api;

// Also export as named export for convenience
export { api as axiosInstance };