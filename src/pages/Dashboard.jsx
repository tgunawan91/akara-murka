import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    if (!profile?.outlet_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Today's sales and transactions
      const { data: todayTransactions } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('outlet_id', profile.outlet_id)
        .gte('created_at', today + 'T00:00:00')
        .eq('status', 'completed');

      // Monthly revenue
      const { data: monthlyTransactions } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('outlet_id', profile.outlet_id)
        .gte('created_at', monthStart)
        .eq('status', 'completed');

      // Total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('outlet_id', profile.outlet_id)
        .eq('is_active', true);

      // Total customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('outlet_id', profile.outlet_id);

      // Low stock products
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('outlet_id', profile.outlet_id)
        .eq('is_active', true)
        .filter('stock', 'lte', 'min_stock');

      const todaySales = todayTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

      setStats({
        todaySales,
        todayTransactions: todayTransactions?.length || 0,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
        lowStockProducts: lowStockCount || 0,
        monthlyRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Penjualan Hari Ini',
      value: formatCurrency(stats.todaySales),
      description: `${stats.todayTransactions} transaksi`,
      icon: DollarSign,
      color: 'text-success',
    },
    {
      title: 'Pendapatan Bulan Ini',
      value: formatCurrency(stats.monthlyRevenue),
      description: 'Total pendapatan bulanan',
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Total Produk',
      value: stats.totalProducts.toString(),
      description: 'Produk aktif',
      icon: Package,
      color: 'text-muted-foreground',
    },
    {
      title: 'Total Pelanggan',
      value: stats.totalCustomers.toString(),
      description: 'Pelanggan terdaftar',
      icon: Users,
      color: 'text-muted-foreground',
    },
    {
      title: 'Stok Menipis',
      value: stats.lowStockProducts.toString(),
      description: 'Perlu restok',
      icon: AlertTriangle,
      color: 'text-warning',
    },
    {
      title: 'Transaksi Hari Ini',
      value: stats.todayTransactions.toString(),
      description: 'Transaksi selesai',
      icon: ShoppingCart,
      color: 'text-success',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {profile?.full_name}! Berikut ringkasan bisnis Anda hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Akses Cepat
            </CardTitle>
            <CardDescription>
              Fitur yang sering digunakan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/pos" className="flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors">
              <ShoppingCart className="h-5 w-5" />
              <div>
                <p className="font-medium">Mulai Transaksi</p>
                <p className="text-sm opacity-90">Buka kasir untuk melayani pelanggan</p>
              </div>
            </a>
            <a href="/products" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
              <Package className="h-5 w-5" />
              <div>
                <p className="font-medium">Kelola Produk</p>
                <p className="text-sm text-muted-foreground">Tambah atau edit produk</p>
              </div>
            </a>
            <a href="/reports" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
              <BarChart3 className="h-5 w-5" />
              <div>
                <p className="font-medium">Lihat Laporan</p>
                <p className="text-sm text-muted-foreground">Analisis penjualan dan stok</p>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informasi Sistem
            </CardTitle>
            <CardDescription>
              Status dan informasi penting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium">Status Sistem</p>
                <p className="text-sm text-muted-foreground">Online dan berjalan normal</p>
              </div>
              <div className="w-3 h-3 bg-success rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <p className="font-medium">Backup Terakhir</p>
                <p className="text-sm text-muted-foreground">Data tersinkronisasi otomatis</p>
              </div>
              <div className="w-3 h-3 bg-success rounded-full"></div>
            </div>
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div>
                  <p className="font-medium text-warning">Peringatan Stok</p>
                  <p className="text-sm text-warning/80">{stats.lowStockProducts} produk perlu restok</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;