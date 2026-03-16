import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { fetchRecruitments } from "@/lib/store";
import Index from "./pages/index";
import Workspace from "./pages/Workspace";
import RecruitmentSharePage from "./pages/RecruitmentSharePage";
import TripPlanner from "./pages/TripPlanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Supabase 사용 시 전역 모집글 캐시 초기화 (워크스페이스 등에서 getRecruitments() 사용)
  useEffect(() => {
    fetchRecruitments();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/workspace/:id" element={<Workspace />} />
          <Route path="/r/:id" element={<RecruitmentSharePage />} />
          <Route path="/planner" element={<TripPlanner />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
