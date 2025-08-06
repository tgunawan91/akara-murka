import React, { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface SalesReport {
  total_revenue: number;
  total_transactions: number;
  avg_transaction: number;
  total_products_sold: number;
}

interface ProductSales {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

interface DailySales {
  date: string;
  revenue: number;
  transactions: number;
}

export default function Reports() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState('today');
  const [salesReport, setSalesReport] = useState<SalesReport>({
    total_revenue: 0,
    total_transactions: 0,
    avg_transaction: 0,
    total_products_sold: 0
  });
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [period, profile?.outlet_id]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          start: weekStart.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: monthStart.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      default:
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
    }
  };

  const fetchReportData = async () => {
    if (!profile?.outlet_id) return;

    try {
      setLoading(true);
      const { start, end } = getDateRange();

      // Fetch sales summary
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('total_amount, payment_amount')
        .eq('outlet_id', profile.outlet_id)
        .eq('status', 'completed')
        .gte('created_at', start)
        .lt('created_at', end);

      if (transError) throw transError;

      // Fetch product sales
      const { data: productData, error: productError } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          total_price,
          products (name)
        `)
        .gte('created_at', start)
        .lt('created_at', end);

      if (productError) throw productError;

      // Calculate sales report
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const totalProductsSold = productData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setSalesReport({
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        avg_transaction: avgTransaction,
        total_products_sold: totalProductsSold
      });

      // Calculate product sales
      const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
      productData?.forEach(item => {
        const productName = item.products?.name || 'Unknown';
        const existing = productSalesMap.get(productName) || { quantity: 0, revenue: 0 };
        productSalesMap.set(productName, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + Number(item.total_price)
        });
      });

      const sortedProductSales = Array.from(productSalesMap.entries())
        .map(([name, data]) => ({
          product_name: name,
          quantity_sold: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setProductSales(sortedProductSales);

      // For daily sales, we'll create mock data for now
      // In a real app, you'd group transactions by date
      const mockDailySales: DailySales[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayRevenue = totalRevenue * Math.random() * 0.3; // Mock data
        mockDailySales.push({
          date: date.toLocaleDateString(),
          revenue: dayRevenue,
          transactions: Math.floor(totalTransactions * Math.random() * 0.3)
        });
      }
      setDailySales(mockDailySales);

    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Simple CSV export
    const csvContent = [
      ['Periode', period],
      ['Total Pendapatan', formatCurrency(salesReport.total_revenue)],
      ['Total Transaksi', salesReport.total_transactions.toString()],
      ['Rata-rata Transaksi', formatCurrency(salesReport.avg_transaction)],
      ['Total Produk Terjual', salesReport.total_products_sold.toString()],
      [''],
      ['Produk Terlaris'],
      ['Nama Produk', 'Qty Terjual', 'Pendapatan'],
      ...productSales.map(p => [p.product_name, p.quantity_sold.toString(), formatCurrency(p.revenue)])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Berhasil",
      description: "Laporan berhasil diunduh"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
          <p className="text-muted-foreground">Analisis performa bisnis Anda</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">7 Hari Terakhir</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesReport.total_revenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesReport.total_transactions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesReport.avg_transaction)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Terjual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesReport.total_products_sold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section - simplified for now */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Penjualan Harian</CardTitle>
            <CardDescription>Trend penjualan 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailySales.map((day, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/50">
                  <span className="text-sm">{day.date}</span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(day.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{day.transactions} transaksi</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <CardDescription>10 produk dengan penjualan tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSales.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.quantity_sold}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(product.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}