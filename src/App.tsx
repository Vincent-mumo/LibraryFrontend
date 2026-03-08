import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LibraryProvider } from "@/context/LibraryContext";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import BooksPage from "./pages/BooksPage";
import BorrowersPage from "./pages/BorrowersPage";
import CirculationPage from "./pages/CirculationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LibraryProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/borrowers" element={<BorrowersPage />} />
              <Route path="/circulation" element={<CirculationPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </LibraryProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
