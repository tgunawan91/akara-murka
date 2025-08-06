import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Store,
  UserCheck,
  Tags,
  TrendingUp,
  Receipt,
  FileText
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Kasir', href: '/pos', icon: ShoppingCart },
  { name: 'Produk', href: '/products', icon: Package },
  { name: 'Kategori', href: '/categories', icon: Tags },
  { name: 'Pelanggan', href: '/customers', icon: Users },
  { name: 'Transaksi', href: '/transactions', icon: Receipt },
  { name: 'Stok', href: '/inventory', icon: TrendingUp },
  { name: 'Laporan', href: '/reports', icon: FileText },
  { name: 'Pegawai', href: '/employees', icon: UserCheck },
  { name: 'Outlet', href: '/outlets', icon: Store },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { state } = useSidebar();
  
  const filteredNavigation = navigation.filter(item => {
    // Hide employee and outlet management for kasir role
    if (profile?.role === 'kasir' && ['employees', 'outlets'].includes(item.href.replace('/', ''))) {
      return false;
    }
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {state === "expanded" && (
            <div>
              <h1 className="font-semibold text-sidebar-foreground">Swift POS</h1>
              <p className="text-xs text-sidebar-foreground/70">Retail System</p>
            </div>
          )}
        </div>
        
        {/* User info - show when expanded */}
        {state === "expanded" && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sidebar-border">
            <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-sidebar-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{profile?.full_name}</p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">{profile?.role}</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <NavLink
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 w-full',
                        isActive(item.href)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
            state === "collapsed" ? "justify-center px-2" : "justify-start"
          )}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {state === "expanded" && <span>Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}