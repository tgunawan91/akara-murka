import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  UserCheck,
  Tags,
  TrendingUp,
  Receipt,
  FileText
} from 'lucide-react';

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

export const Sidebar = () => {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    // Hide employee and outlet management for kasir role
    if (profile?.role === 'kasir' && ['employees', 'outlets'].includes(item.href.replace('/', ''))) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-sidebar-foreground">Swift POS</h1>
          <p className="text-xs text-sidebar-foreground/70">Retail System</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-sidebar-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{profile?.full_name}</p>
            <p className="text-xs text-sidebar-foreground/70 capitalize">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </Button>
      </div>
    </div>
  );
};