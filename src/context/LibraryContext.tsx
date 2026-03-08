import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, Borrower, BorrowRecord } from '@/types/library';

interface LibraryContextType {
  books: Book[];
  borrowers: Borrower[];
  records: BorrowRecord[];
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>) => void;
  updateBook: (book: Book) => void;
  deleteBook: (id: string) => void;
  addBorrower: (borrower: Omit<Borrower, 'id'>) => void;
  borrowBook: (bookId: string, borrowerId: string, dueDate: string) => boolean;
  returnBook: (recordId: string) => void;
  getBookById: (id: string) => Book | undefined;
  getBorrowerById: (id: string) => Borrower | undefined;
  getRecordsByBorrower: (borrowerId: string) => BorrowRecord[];
  getOverdueRecords: () => BorrowRecord[];
  getBorrowerStats: () => { borrower: Borrower; onTime: number; late: number; total: number; score: number }[];
}

const LibraryContext = createContext<LibraryContextType | null>(null);

const STORAGE_KEYS = { books: 'lib_books', borrowers: 'lib_borrowers', records: 'lib_records' };

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>(() => load(STORAGE_KEYS.books, []));
  const [borrowers, setBorrowers] = useState<Borrower[]>(() => load(STORAGE_KEYS.borrowers, []));
  const [records, setRecords] = useState<BorrowRecord[]>(() => load(STORAGE_KEYS.records, []));

  useEffect(() => localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books)), [books]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.borrowers, JSON.stringify(borrowers)), [borrowers]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records)), [records]);

  // Auto-mark overdue
  useEffect(() => {
    const now = new Date().toISOString();
    setRecords(prev => prev.map(r =>
      r.status === 'borrowed' && r.dueDate < now ? { ...r, status: 'overdue' as const } : r
    ));
  }, []);

  const addBook = useCallback((book: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>) => {
    const newBook: Book = { ...book, id: crypto.randomUUID(), createdAt: new Date().toISOString(), availableCopies: book.totalCopies };
    setBooks(prev => [...prev, newBook]);
  }, []);

  const updateBook = useCallback((book: Book) => {
    setBooks(prev => prev.map(b => b.id === book.id ? book : b));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  }, []);

  const addBorrower = useCallback((borrower: Omit<Borrower, 'id'>) => {
    setBorrowers(prev => [...prev, { ...borrower, id: crypto.randomUUID() }]);
  }, []);

  const borrowBook = useCallback((bookId: string, borrowerId: string, dueDate: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.availableCopies <= 0) return false;
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b));
    const record: BorrowRecord = {
      id: crypto.randomUUID(), bookId, borrowerId,
      borrowDate: new Date().toISOString(), dueDate, returnDate: null, status: 'borrowed',
    };
    setRecords(prev => [...prev, record]);
    return true;
  }, [books]);

  const returnBook = useCallback((recordId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      const now = new Date().toISOString();
      return { ...r, returnDate: now, status: 'returned' as const };
    }));
    const record = records.find(r => r.id === recordId);
    if (record) {
      setBooks(prev => prev.map(b => b.id === record.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b));
    }
  }, [records]);

  const getBookById = useCallback((id: string) => books.find(b => b.id === id), [books]);
  const getBorrowerById = useCallback((id: string) => borrowers.find(b => b.id === id), [borrowers]);
  const getRecordsByBorrower = useCallback((borrowerId: string) => records.filter(r => r.borrowerId === borrowerId), [records]);
  const getOverdueRecords = useCallback(() => {
    const now = new Date().toISOString();
    return records.filter(r => (r.status === 'overdue' || (r.status === 'borrowed' && r.dueDate < now)));
  }, [records]);

  const getBorrowerStats = useCallback(() => {
    return borrowers.map(borrower => {
      const bRecords = records.filter(r => r.borrowerId === borrower.id && r.status === 'returned');
      const onTime = bRecords.filter(r => r.returnDate && r.returnDate <= r.dueDate).length;
      const late = bRecords.filter(r => r.returnDate && r.returnDate > r.dueDate).length;
      const total = records.filter(r => r.borrowerId === borrower.id).length;
      const score = bRecords.length > 0 ? (onTime / bRecords.length) * 100 : (total > 0 ? 0 : -1);
      return { borrower, onTime, late, total, score };
    }).filter(s => s.total > 0).sort((a, b) => b.score - a.score);
  }, [borrowers, records]);

  return (
    <LibraryContext.Provider value={{
      books, borrowers, records, addBook, updateBook, deleteBook, addBorrower,
      borrowBook, returnBook, getBookById, getBorrowerById, getRecordsByBorrower,
      getOverdueRecords, getBorrowerStats,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
