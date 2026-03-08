import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { bookAPI } from '@/lib/axios';
import { Book, BookFormData } from '@/types/library';

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Mathematics', 'Literature', 'Technology', 'Art', 'Philosophy', 'Other'];

interface BookFormProps {
  book?: Book;
  onSave: (data: BookFormData) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
}

function BookForm({ book, onSave, onClose, submitting }: BookFormProps) {
  const [title, setTitle] = useState(book?.title || '');
  const [author, setAuthor] = useState(book?.author || '');
  const [category, setCategory] = useState(book?.category || '');
  const [isbn, setIsbn] = useState(book?.isbn || '');
  const [totalCopies, setTotalCopies] = useState(book?.totalCopies?.toString() || '1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !category) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    await onSave({ 
      title, 
      author, 
      category, 
      isbn: isbn || undefined, 
      totalCopies: parseInt(totalCopies) || 1 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input 
          id="title"
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="Enter book title"
          disabled={submitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="author">Author *</Label>
        <Input 
          id="author"
          value={author} 
          onChange={e => setAuthor(e.target.value)} 
          placeholder="Enter author name"
          disabled={submitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={category} onValueChange={setCategory} disabled={submitting}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="isbn">ISBN</Label>
        <Input 
          id="isbn"
          value={isbn} 
          onChange={e => setIsbn(e.target.value)} 
          placeholder="ISBN (optional)"
          disabled={submitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="totalCopies">Total Copies</Label>
        <Input 
          id="totalCopies"
          type="number" 
          min="1" 
          value={totalCopies} 
          onChange={e => setTotalCopies(e.target.value)}
          disabled={submitting}
        />
      </div>
      
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {book ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            book ? 'Update Book' : 'Add Book'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Fetch books on mount and when filters change
  useEffect(() => {
    fetchBooks();
  }, [search, filterCategory]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterCategory && filterCategory !== 'all') params.category = filterCategory;
      
      const response = await bookAPI.getAll(params);
      setBooks(response.data.books || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch books');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleSave = async (bookData: BookFormData) => {
    setSubmitting(true);
    try {
      if (editBook) {
        // Update existing book
        await bookAPI.update(editBook._id, bookData);
        toast.success('Book updated successfully');
      } else {
        // Add new book
        await bookAPI.create(bookData);
        toast.success('Book added successfully');
      }
      
      setDialogOpen(false);
      setEditBook(undefined);
      fetchBooks(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || `Failed to ${editBook ? 'update' : 'add'} book`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bookId: string, bookTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      return;
    }
    
    try {
      await bookAPI.delete(bookId);
      toast.success('Book deleted successfully');
      fetchBooks(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete book');
    }
  };

  const handleEdit = (book: Book) => {
    setEditBook(book);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditBook(undefined);
  };

  // Reset form when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditBook(undefined);
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-display">Books</h1>
        
        {/* Dialog Trigger - This is the button that opens the modal */}
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />Add Book
            </Button>
          </DialogTrigger>
          
          {/* Dialog Content - This is the modal itself */}
          <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{editBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
            </DialogHeader>
            <BookForm 
              book={editBook} 
              onSave={handleSave} 
              onClose={handleDialogClose}
              submitting={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or author..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-40" />
            <p className="mb-4">No books found.</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Your First Book
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map(book => (
            <Card key={book._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base leading-tight line-clamp-2">
                    {book.title}
                  </CardTitle>
                  <Badge 
                    variant={book.availableCopies > 0 ? 'default' : 'destructive'} 
                    className="shrink-0 text-xs"
                  >
                    {book.availableCopies}/{book.totalCopies}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-xs">
                    {book.category}
                  </Badge>
                  {book.isbn && (
                    <span className="text-xs text-muted-foreground">
                      ISBN: {book.isbn}
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => handleEdit(book)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(book._id, book.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}