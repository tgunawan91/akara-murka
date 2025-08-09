import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  Search, 
  Receipt, 
  Eye, 
  Filter,
  Download,
  Calendar,
  User,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Transactions = () => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [profile]);

  const fetchTransactions = async () => {
    if (!profile?.outlet_id) return;

    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (name, phone),
        transaction_items (
          *,
          products (name, unit)
        )
      `)
      .eq('outlet_id', profile.outlet_id)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
    setLoading(false);
  };

  const openTransactionDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'tunai':
        return <Banknote className="h-4 w-4" />;
      case 'kartu_debit':
      case 'kartu_kredit':
        return <CreditCard className="h-4 w-4" />;
      case 'transfer':
      case 'qris':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'tunai':
        return 'Tunai';
      case 'kartu_debit':
        return 'Kartu Debit';
      case 'kartu_kredit':
        return 'Kartu Kredit';
      case 'transfer':
        return 'Transfer';
      case 'qris':
        return 'QRIS';
      default:
        return method;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Selesai</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || transaction.payment_method === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todayTransactions = transactions.filter(t => {
    const today = new Date().toDateString();
    const transactionDate = new Date(t.created_at).toDateString();
    return today === transactionDate && t.status === 'completed';
  });

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Riwayat Transaksi</h1>
          <p className="text-muted-foreground">Pantau semua transaksi penjualan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTransactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <Banknote className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(todayRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <Banknote className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari nomor transaksi atau pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Semua Status</option>
          <option value="completed">Selesai</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Semua Pembayaran</option>
          <option value="tunai">Tunai</option>
          <option value="kartu_debit">Kartu Debit</option>
          <option value="kartu_kredit">Kartu Kredit</option>
          <option value="transfer">Transfer</option>
          <option value="qris">QRIS</option>
        </select>
      </div>

      {/* Transactions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pembayaran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.transaction_number}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {transaction.customers?.name || 'Pelanggan Umum'}
                      </p>
                      {transaction.customers?.phone && (
                        <p className="text-xs text-muted-foreground">
                          {transaction.customers.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatCurrency(transaction.total_amount)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(transaction.payment_method)}
                    <span>{getPaymentMethodLabel(transaction.payment_method)}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>
                  <span className="text-sm">{formatDateTime(transaction.created_at)}</span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTransactionDetail(transaction)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                    ? 'Tidak ada transaksi yang ditemukan' 
                    : 'Belum ada transaksi'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.transaction_number}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informasi Transaksi</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Nomor:</span> {selectedTransaction.transaction_number}</p>
                    <p><span className="text-muted-foreground">Waktu:</span> {formatDateTime(selectedTransaction.created_at)}</p>
                    <p><span className="text-muted-foreground">Status:</span> {getStatusBadge(selectedTransaction.status)}</p>
                    <p><span className="text-muted-foreground">Pembayaran:</span> {getPaymentMethodLabel(selectedTransaction.payment_method)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Pelanggan</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Nama:</span> {selectedTransaction.customers?.name || 'Pelanggan Umum'}</p>
                    {selectedTransaction.customers?.phone && (
                      <p><span className="text-muted-foreground">Telepon:</span> {selectedTransaction.customers.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Item Transaksi</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction.transaction_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.products.name}</p>
                            <p className="text-xs text-muted-foreground">{item.products.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(item.total_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Pembayaran:</span>
                  <span>{formatCurrency(selectedTransaction.total_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;