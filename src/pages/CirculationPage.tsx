import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRightLeft, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Users, 
  Clock,
  Search,
  Loader2,
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { circulationAPI, bookAPI, borrowerAPI } from '@/lib/axios';

interface ActiveLoan {
  _id: string;
  borrowerId: any; // Can be object or string depending on population
  bookId: any;     // Can be object or string depending on population
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'overdue' | 'returned' | 'lost' | 'damaged';
  renewals: number;
}

export default function CirculationPage() {
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<ActiveLoan[]>([]);
  const [dueSoonLoans, setDueSoonLoans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Borrow form state
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);
  const [borrowers, setBorrowers] = useState<any[]>([]);
  
  // Search/filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchActiveLoans(),
        fetchOverdueLoans(),
        fetchDueSoon(),
        fetchStats(),
        fetchAvailableBooks(),
        fetchBorrowers()
      ]);
    } catch (error: any) {
      toast.error('Failed to fetch circulation data');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchActiveLoans = async () => {
    try {
      const response = await circulationAPI.getActiveLoans();
      console.log('🔍 Active Loans Response:', response.data);
      setActiveLoans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch active loans:', error);
    }
  };

  const fetchOverdueLoans = async () => {
    try {
      const response = await circulationAPI.getOverdueLoans();
      console.log('🔍 Overdue Loans Response:', response.data);
      setOverdueLoans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch overdue loans:', error);
    }
  };

  const fetchDueSoon = async () => {
    try {
      const response = await circulationAPI.getDueSoon();
      console.log('🔍 Due Soon Response:', response.data);
      setDueSoonLoans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch due soon books:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await circulationAPI.getStats();
      console.log('🔍 Stats Response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const response = await bookAPI.getAll({});
      const available = (response.data.books || []).filter(
        (book: any) => book.availableCopies > 0
      );
      setAvailableBooks(available);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };

  const fetchBorrowers = async () => {
    try {
      const response = await borrowerAPI.getAll();
      const activeBorrowers = (response.data.borrowers || []).filter(
        (b: any) => b.status === 'active' && !b.blacklisted
      );
      setBorrowers(activeBorrowers);
    } catch (error) {
      console.error('Failed to fetch borrowers:', error);
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBook || !selectedBorrower || !dueDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const borrowData = {
        bookId: selectedBook,
        borrowerId: selectedBorrower,
        dueDate: new Date(dueDate).toISOString()
      };

      await circulationAPI.borrow(borrowData);
      
      toast.success('Book borrowed successfully');
      
      // Reset form
      setSelectedBook('');
      setSelectedBorrower('');
      setDueDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
      
      // Refresh data
      await fetchAllData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to borrow book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (recordId: string, bookTitle: string) => {
    try {
      await circulationAPI.return(recordId);
      toast.success(`"${bookTitle}" returned successfully`);
      await fetchAllData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to return book');
    }
  };

  const handleRenew = async (recordId: string, bookTitle: string) => {
    try {
      await circulationAPI.renew(recordId);
      toast.success(`"${bookTitle}" renewed successfully`);
      await fetchAllData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to renew book');
    }
  };

  const handleRefresh = () => {
    fetchAllData();
    toast.success('Data refreshed');
  };

  // Helper function to safely get book title
  const getBookTitle = (loan: ActiveLoan) => {
    if (!loan.bookId) return 'Unknown Book';
    if (typeof loan.bookId === 'object' && loan.bookId.title) {
      return loan.bookId.title;
    }
    return 'Loading...';
  };

  // Helper function to safely get book author
  const getBookAuthor = (loan: ActiveLoan) => {
    if (!loan.bookId) return 'Unknown Author';
    if (typeof loan.bookId === 'object' && loan.bookId.author) {
      return loan.bookId.author;
    }
    return '';
  };

  // Helper function to safely get borrower name
  const getBorrowerName = (loan: ActiveLoan) => {
    if (!loan.borrowerId) return 'Unknown Borrower';
    if (typeof loan.borrowerId === 'object' && loan.borrowerId.name) {
      return loan.borrowerId.name;
    }
    return 'Loading...';
  };

  // Helper function to safely get borrower identifier
  const getBorrowerIdentifier = (loan: ActiveLoan) => {
    if (!loan.borrowerId) return '';
    if (typeof loan.borrowerId === 'object' && loan.borrowerId.identifier) {
      return loan.borrowerId.identifier;
    }
    return '';
  };

  // Set default due date to 14 days from now
  useEffect(() => {
    if (!dueDate) {
      const defaultDue = addDays(new Date(), 14);
      setDueDate(format(defaultDue, 'yyyy-MM-dd'));
    }
  }, []);

  // Filter loans based on search
  const filteredActiveLoans = activeLoans.filter(loan => {
    const bookTitle = getBookTitle(loan).toLowerCase();
    const borrowerName = getBorrowerName(loan).toLowerCase();
    const search = searchTerm.toLowerCase();
    return bookTitle.includes(search) || borrowerName.includes(search);
  });

  const filteredOverdueLoans = overdueLoans.filter(loan => {
    const bookTitle = getBookTitle(loan).toLowerCase();
    const borrowerName = getBorrowerName(loan).toLowerCase();
    const search = searchTerm.toLowerCase();
    return bookTitle.includes(search) || borrowerName.includes(search);
  });

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-display">Circulation</h1>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                  <p className="text-2xl font-bold">{stats.activeLoans || 0}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-destructive">{stats.overdueLoans || 0}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Borrowed Today</p>
                  <p className="text-2xl font-bold">{stats.todayStats?.borrowed || 0}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <ArrowRightLeft className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Returned Today</p>
                  <p className="text-2xl font-bold">{stats.todayStats?.returned || 0}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Borrow Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Lend a Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBorrow} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="book">Book *</Label>
              <Select value={selectedBook} onValueChange={setSelectedBook} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  {availableBooks.map(book => (
                    <SelectItem key={book._id} value={book._id}>
                      {book.title} ({book.availableCopies} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrower">Borrower *</Label>
              <Select value={selectedBorrower} onValueChange={setSelectedBorrower} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select borrower" />
                </SelectTrigger>
                <SelectContent>
                  {borrowers.map(borrower => (
                    <SelectItem key={borrower._id} value={borrower._id}>
                      {borrower.name} ({borrower.identifier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                disabled={submitting}
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Lend Book'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Due Soon Alert */}
      {dueSoonLoans.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              <span className="font-semibold">{dueSoonLoans.length}</span> books due in the next 7 days
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by book title or borrower name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs for Active and Overdue Loans */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="relative">
            Active Loans
            {activeLoans.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activeLoans.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            Overdue
            {overdueLoans.length > 0 && (
              <Badge variant="destructive" className="ml-2">{overdueLoans.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActiveLoans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-40" />
                <p>No active loans found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredActiveLoans.map((loan) => (
                <Card key={loan._id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{getBookTitle(loan)}</span>
                          {getBookAuthor(loan) && (
                            <Badge variant="outline" className="text-xs">
                              {getBookAuthor(loan)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{getBorrowerName(loan)}</span>
                          {getBorrowerIdentifier(loan) && (
                            <>
                              <span>•</span>
                              <span>{getBorrowerIdentifier(loan)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Borrowed: {format(new Date(loan.borrowDate), 'MMM d, yyyy')}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            Due: {format(new Date(loan.dueDate), 'MMM d, yyyy')}
                          </span>
                          {loan.renewals > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Renewed {loan.renewals}×
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRenew(loan._id, getBookTitle(loan))}
                        >
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          Renew
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleReturn(loan._id, getBookTitle(loan))}
                        >
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Return
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOverdueLoans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-40" />
                <p>No overdue loans. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredOverdueLoans.map((loan) => {
                const daysOverdue = Math.ceil(
                  (new Date().getTime() - new Date(loan.dueDate).getTime()) / 
                  (1000 * 60 * 60 * 24)
                );

                return (
                  <Card key={loan._id} className="border-destructive/50 bg-destructive/5">
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                            <span className="font-medium truncate">{getBookTitle(loan)}</span>
                            <Badge variant="destructive" className="text-xs">
                              {daysOverdue} days overdue
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{getBorrowerName(loan)}</span>
                            {getBorrowerIdentifier(loan) && (
                              <>
                                <span>•</span>
                                <span>{getBorrowerIdentifier(loan)}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Borrowed: {format(new Date(loan.borrowDate), 'MMM d, yyyy')}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-destructive font-medium">
                              Due: {format(new Date(loan.dueDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReturn(loan._id, getBookTitle(loan))}
                        >
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Return & Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Popular Books Section */}
      {stats && stats.popularBooks && stats.popularBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Popular Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.popularBooks.map((item: any, index: number) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <span className="text-sm">{item.book?.title || 'Unknown'}</span>
                  </div>
                  <Badge variant="secondary">{item.count} borrows</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}