import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, BookOpen, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { borrowerAPI, bookAPI } from '@/lib/axios';

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [selectedBorrowerData, setSelectedBorrowerData] = useState(null);
  const [borrowingHistory, setBorrowingHistory] = useState([]);
  const [bookCache, setBookCache] = useState({});
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch borrowers on mount and when search changes
  useEffect(() => {
    fetchBorrowers();
  }, [search]);

  const fetchBorrowers = async () => {
    setLoading(true);
    try {
      const response = await borrowerAPI.getAll(search);
      setBorrowers(response.data.borrowers || []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch borrowers');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchBookDetails = async (bookId) => {
    // Return from cache if already fetched
    if (bookCache[bookId]) {
      return bookCache[bookId];
    }
    
    try {
      const response = await bookAPI.getById(bookId);
      const bookData = response.data;
      setBookCache(prev => ({ ...prev, [bookId]: bookData }));
      return bookData;
    } catch (error) {
      console.error('Failed to fetch book:', bookId);
      return { title: 'Unknown Book', author: 'Unknown Author' };
    }
  };

  const fetchBorrowerDetails = async (id) => {
    try {
      const response = await borrowerAPI.getById(id);
      const data = response.data;
      
      setSelectedBorrowerData(data.borrower);
      
      // Fetch book details for each record
      const recordsWithBooks = await Promise.all(
        (data.records || []).map(async (record) => {
          const book = await fetchBookDetails(record.bookId);
          return { ...record, book };
        })
      );
      
      setBorrowingHistory(recordsWithBooks);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch borrower details');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !identifier) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await borrowerAPI.create({ 
        name, 
        type, 
        identifier 
      });
      
      toast.success('Borrower added successfully');
      setName('');
      setIdentifier('');
      setType('student');
      setDialogOpen(false);
      fetchBorrowers(); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Failed to add borrower');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectBorrower = async (id) => {
    setSelectedBorrower(id);
    await fetchBorrowerDetails(id);
  };

  const handleBackToList = () => {
    setSelectedBorrower(null);
    setSelectedBorrowerData(null);
    setBorrowingHistory([]);
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
        <h1 className="text-2xl font-bold font-display">Borrowers</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />Add Borrower
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Borrower</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  disabled={submitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Borrower Type *</Label>
                <Select value={type} onValueChange={setType} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identifier">ID Number *</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Student/Employee ID"
                  disabled={submitting}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Borrower'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Borrower Details View */}
      {selectedBorrower && selectedBorrowerData ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={handleBackToList}>
            ← Back to list
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5" />
                    {selectedBorrowerData.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    ID: {selectedBorrowerData.identifier}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{selectedBorrowerData.type}</Badge>
                  {selectedBorrowerData.blacklisted && (
                    <Badge variant="destructive">Blacklisted</Badge>
                  )}
                </div>
              </div>
              
              {/* Blacklist Warning */}
              {selectedBorrowerData.blacklisted && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Blacklisted until: {format(new Date(selectedBorrowerData.blacklistedUntil), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-destructive/80 mt-1">
                    Reason: {selectedBorrowerData.blacklistReason}
                  </p>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <h3 className="font-semibold mb-4">
                Borrowing History ({borrowingHistory.length} records)
              </h3>
              
              {borrowingHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No borrowing history yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {borrowingHistory.map((record) => (
                    <div
                      key={record._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {record.book?.title || 'Unknown Book'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {record.book?.author || 'Unknown Author'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs sm:ml-auto">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(record.borrowDate), 'MMM d, yyyy')}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(record.dueDate), 'MMM d, yyyy')}
                        </span>
                        
                        {record.status === 'returned' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Returned
                          </Badge>
                        ) : record.status === 'overdue' ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Borrowed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Borrowers List View */
        <>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-5 bg-muted rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-4 bg-muted rounded w-12"></div>
                      <div className="h-4 bg-muted rounded w-12"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : borrowers.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="mx-auto h-12 w-12 mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground mb-2">No borrowers found</p>
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Add Your First Borrower
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {borrowers.map((borrower) => {
                const stats = borrower.stats || { total: 0, active: 0, overdue: 0 };
                
                return (
                  <Card
                    key={borrower._id}
                    className={`cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] ${
                      borrower.blacklisted ? 'border-destructive/50 bg-destructive/5' : ''
                    }`}
                    onClick={() => handleSelectBorrower(borrower._id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-lg">{borrower.name}</p>
                          <p className="text-sm text-muted-foreground">{borrower.identifier}</p>
                        </div>
                        <Badge variant="secondary">{borrower.type}</Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="bg-muted/50">
                          Total: {stats.total}
                        </Badge>
                        {stats.active > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Active: {stats.active}
                          </Badge>
                        )}
                        {stats.overdue > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue: {stats.overdue}
                          </Badge>
                        )}
                        {borrower.blacklisted && (
                          <Badge variant="destructive" className="text-xs">
                            Blacklisted
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        {borrower.currentBorrowCount} / {borrower.maxBorrowLimit} books borrowed
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}