import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  CreditCard, 
  UserCheck, 
  Settings, 
  Store, 
  ClipboardList, 
  FileText,
  FolderOpen,
  LogOut
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Produk', href: '/products', icon: Package },
  { name: 'Kategori', href: '/categories', icon: FolderOpen },
  { name: 'Inventori', href: '/inventory', icon: ClipboardList },
  { name: 'Pelanggan', href: '/customers', icon: Users },
  { name: 'Transaksi', href: '/transactions', icon: CreditCard },
  { name: 'Laporan', href: '/reports', icon: FileText },
  { name: 'Pegawai', href: '/employees', icon: UserCheck },
  { name: 'Outlet', href: '/outlets', icon: Store },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter(item => {
    if (profile?.role === 'kasir') {
      return !['employees', 'outlets'].includes(item.href.replace('/', ''));
    }
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            S
          </div>
          {state === "expanded" && (
            <div>
              <h2 className="font-semibold text-foreground">Swift POS</h2>
              {profile && (
                <div className="text-xs text-muted-foreground">
                  <div>{profile.full_name}</div>
                  <div className="capitalize">{profile.role}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {state === "expanded" && <span>{item.name}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-4 w-4" />
          {state === "expanded" && <span>Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}