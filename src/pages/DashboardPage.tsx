import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Trophy, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  UserCheck,
  UserX,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { dashboardAPI } from '@/lib/axios';
import { 
  DashboardStats, 
  BorrowerRanking, 
  OverdueRecord,
  RecentActivity 
} from '@/types/library';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rankings, setRankings] = useState<BorrowerRanking[]>([]);
  const [overdueRecords, setOverdueRecords] = useState<OverdueRecord[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsResponse,
        rankingsResponse,
        overdueResponse,
        activitiesResponse
      ] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getBorrowerRankings(),
        dashboardAPI.getOverdueBooks(),
        dashboardAPI.getRecentActivities(10)
      ]);

      setStats(statsResponse.data);
      setRankings(rankingsResponse.data || []);
      setOverdueRecords(overdueResponse.data || []);
      setRecentActivities(activitiesResponse.data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  // Get best and worst borrowers from rankings
  const bestBorrower = rankings.length > 0 ? rankings[0] : null;
  const worstBorrower = rankings.length > 1 ? rankings[rankings.length - 1] : null;

  if (loading) {
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
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalBooks || 0}</p>
                <p className="text-xs text-muted-foreground">Total Books</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalAvailable || 0}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeLoans || 0}</p>
                <p className="text-xs text-muted-foreground">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats?.overdueCount || 0}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Borrowers</p>
            <p className="text-xl font-bold">{stats?.totalBorrowers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Return Rate</p>
            <p className="text-xl font-bold">
              {stats?.totalBooks && stats.totalBooks > 0
                ? Math.round(((stats.totalBooks - stats.totalAvailable) / stats.totalBooks) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-xl font-bold">{stats?.booksByCategory?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active Borrowers</p>
            <p className="text-xl font-bold">
              {stats?.totalBorrowers && stats.activeLoans
                ? Math.min(stats.activeLoans, stats.totalBorrowers)
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best & Worst Borrowers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Borrower Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No borrower data yet.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Best Borrower */}
                {bestBorrower && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          Best Borrower
                        </p>
                        <p className="font-semibold text-lg">{bestBorrower.borrower?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {bestBorrower.borrower?.identifier}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        {Math.round(bestBorrower.score)}% on time
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>✅ {bestBorrower.onTime} on time</span>
                      <span>⚠️ {bestBorrower.late} late</span>
                      <span>📚 {bestBorrower.total} total</span>
                    </div>
                  </div>
                )}

                {/* Worst Borrower */}
                {worstBorrower && worstBorrower.borrowerId !== bestBorrower?.borrowerId && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Needs Improvement
                        </p>
                        <p className="font-semibold text-lg">{worstBorrower.borrower?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {worstBorrower.borrower?.identifier}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        {Math.round(worstBorrower.score)}% on time
                      </Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>✅ {worstBorrower.onTime} on time</span>
                      <span>⚠️ {worstBorrower.late} late</span>
                      <span>📚 {worstBorrower.total} total</span>
                    </div>
                  </div>
                )}

                {/* All Rankings */}
                {rankings.length > 2 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-muted-foreground">All Borrowers</p>
                    <div className="space-y-1">
                      {rankings.map((borrower, index) => (
                        <div
                          key={borrower.borrowerId}
                          className="flex items-center justify-between text-sm py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium w-6 ${
                              index === 0 ? 'text-yellow-500' :
                              index === rankings.length - 1 ? 'text-red-500' :
                              'text-muted-foreground'
                            }`}>
                              #{index + 1}
                            </span>
                            <span className="font-medium">{borrower.borrower?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({borrower.borrower?.identifier})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(borrower.score)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {borrower.total} borrows
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Books */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Overdue Books
              {overdueRecords.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {overdueRecords.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-3 rounded-full bg-green-100 mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-muted-foreground">No overdue books. Great job! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueRecords.slice(0, 5).map((record) => (
                  <Card key={record._id} className="border-destructive/20 bg-destructive/5">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm">{record.book?.title}</p>
                        <Badge variant="destructive" className="text-xs">
                          {record.daysOverdue} days
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {record.book?.author}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{record.borrower?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {format(new Date(record.dueDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {overdueRecords.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    And {overdueRecords.length - 5} more overdue books...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Books by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Books by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.booksByCategory || stats.booksByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No category data available.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.booksByCategory.map((category) => (
                  <div key={category._id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category._id}</span>
                      <span className="text-muted-foreground">
                        {category.availableCopies}/{category.totalCopies} available
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(category.availableCopies / category.totalCopies) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {category.count} books · {category.totalCopies} total copies
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activities.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-1.5 rounded-full ${
                      activity.type === 'borrow' ? 'bg-green-100' :
                      activity.type === 'return' ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                      {activity.type === 'borrow' ? (
                        <BookOpen className="h-3 w-3 text-green-600" />
                      ) : activity.type === 'return' ? (
                        <TrendingUp className="h-3 w-3 text-blue-600" />
                      ) : (
                        <RefreshCw className="h-3 w-3 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.type === 'borrow' ? 'Borrowed' :
                         activity.type === 'return' ? 'Returned' :
                         'Renewed'} <span className="text-primary">{activity.book?.title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {activity.borrower?.name} · {format(new Date(activity.date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for check icon
function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}