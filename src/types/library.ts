// Book Types
export interface Book {
  _id: string;  // MongoDB uses _id, not id
  title: string;
  author: string;
  category: string;
  isbn?: string;
  totalCopies: number;
  availableCopies: number;
  location?: {
    shelf?: string;
    row?: string;
  };
  status: 'available' | 'reserved' | 'damaged' | 'lost';
  createdAt?: string;
  updatedAt?: string;
}

// Borrower Types
export interface Borrower {
  _id: string;
  name: string;
  type: 'student' | 'teacher';
  identifier: string;
  email?: string;
  phone?: string;
  grade?: string;
  department?: string;
  status: 'active' | 'inactive';
  maxBorrowLimit: number;
  currentBorrowCount: number;
  blacklisted: boolean;
  blacklistReason?: string;
  blacklistedUntil?: string;
  registrationDate: string;
  stats?: {
    total: number;
    active: number;
    overdue: number;
    returned: number;
  };
}

// Borrowing Record Types
export interface BorrowingRecord {
  _id: string;
  borrowerId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost' | 'damaged';
  renewals: number;
  violation?: {
    type: 'overdue' | 'lost' | 'damaged' | 'none';
    reportedDate?: string;
    resolvedDate?: string;
    notes?: string;
  };
  book?: Book; // Populated book details
  borrower?: Borrower; // Populated borrower details
}

// API Response Types
export interface BooksResponse {
  books: Book[];
  currentPage: number;
  totalPages: number;
  totalBooks: number;
}

export interface BorrowersResponse {
  borrowers: Borrower[];
  currentPage: number;
  totalPages: number;
  totalBorrowers: number;
}

export interface BorrowerDetailsResponse {
  borrower: Borrower;
  records: BorrowingRecord[];
  stats: {
    total: number;
    active: number;
    overdue: number;
    returned: number;
    lost: number;
  };
}

// Form Data Types
export interface BookFormData {
  title: string;
  author: string;
  category: string;
  isbn?: string;
  totalCopies: number;
}

export interface BorrowerFormData {
  name: string;
  type: 'student' | 'teacher';
  identifier: string;
  email?: string;
  phone?: string;
  grade?: string;
  department?: string;
}

// Circulation Types
export interface ActiveLoan {
  _id: string;
  borrowerId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'overdue' | 'returned' | 'lost' | 'damaged';
  renewals: number;
  book?: Book;
  borrower?: Borrower;
  violation?: {
    type: 'overdue' | 'lost' | 'damaged' | 'none';
    reportedDate?: string;
    resolvedDate?: string;
    notes?: string;
  };
}

export interface BorrowFormData {
  bookId: string;
  borrowerId: string;
  dueDate: string;
}

export interface CirculationStats {
  activeLoans: number;
  overdueLoans: number;
  todayStats: {
    borrowed: number;
    returned: number;
  };
  weeklyStats: {
    borrowed: number;
  };
  monthlyStats: {
    borrowed: number;
  };
  popularBooks: Array<{
    _id: string;
    book: {
      title: string;
      author: string;
    };
    count: number;
  }>;
  activeBorrowers: Array<{
    _id: string;
    borrower: {
      name: string;
      identifier: string;
    };
    count: number;
  }>;
  fines?: {
    unpaid: {
      total: number;
      count: number;
    };
    paid: {
      total: number;
      count: number;
    };
  };
}

export interface DueSoonLoan {
  _id: string;
  bookId: string;
  borrowerId: string;
  dueDate: string;
  book: {
    title: string;
    author: string;
  };
  borrower: {
    name: string;
    email?: string;
    phone?: string;
  };
}

export interface ReturnFormData {
  recordId: string;
  condition?: 'good' | 'damaged' | 'lost';
}

// Dashboard Types
export interface DashboardStats {
  totalBooks: number;
  totalBorrowers: number;
  activeLoans: number;
  overdueLoans: number;
  booksByCategory: Array<{
    _id: string;
    count: number;
    totalCopies: number;
    availableCopies: number;
  }>;
  recentActivities: Array<{
    _id: string;
    type: 'borrow' | 'return' | 'renew';
    bookTitle: string;
    borrowerName: string;
    date: string;
    status?: string;
  }>;
}

// Auth Types (for future use)
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'librarian' | 'assistant';
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}