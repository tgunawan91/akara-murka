import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export const DashboardLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Mobile header with sidebar trigger */}
          <header className="flex md:hidden items-center h-14 px-4 border-b bg-background">
            <SidebarTrigger />
            <h1 className="ml-3 font-semibold text-foreground">Swift POS</h1>
          </header>
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        
        <Toaster />
      </div>
    </SidebarProvider>
  );
};