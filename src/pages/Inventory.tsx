import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  unit: string;
  category_id: string;
  categories?: {
    name: string;
  };
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  notes: string;
  created_at: string;
  products: {
    name: string;
  };
}

export default function Inventory() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [movementType, setMovementType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchStockMovements();
  }, [profile?.outlet_id]);

  const fetchProducts = async () => {
    if (!profile?.outlet_id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('outlet_id', profile.outlet_id)
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data produk",
        variant: "destructive"
      });
    }
  };

  const fetchStockMovements = async () => {
    if (!profile?.outlet_id) return;

    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            name
          )
        `)
        .eq('outlet_id', profile.outlet_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setStockMovements(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat riwayat stok",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !movementType || !quantity || !profile?.outlet_id) return;

    try {
      const quantityNum = parseInt(quantity);
      const isInbound = movementType === 'in';
      
      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: selectedProduct,
          outlet_id: profile.outlet_id,
          type: movementType,
          quantity: isInbound ? quantityNum : -quantityNum,
          notes,
          created_by: profile.user_id
        });

      if (movementError) throw movementError;

      // Update product stock
      const currentProduct = products.find(p => p.id === selectedProduct);
      if (currentProduct) {
        const newStock = isInbound 
          ? currentProduct.stock + quantityNum 
          : currentProduct.stock - quantityNum;

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', selectedProduct);

        if (updateError) throw updateError;
      }

      toast({
        title: "Berhasil",
        description: "Stok berhasil diperbarui"
      });

      // Reset form and refresh data
      setSelectedProduct('');
      setMovementType('');
      setQuantity('');
      setNotes('');
      setIsDialogOpen(false);
      fetchProducts();
      fetchStockMovements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui stok",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(product => product.stock <= product.min_stock);

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Habis', variant: 'destructive' as const };
    if (stock <= minStock) return { label: 'Rendah', variant: 'secondary' as const };
    return { label: 'Normal', variant: 'default' as const };
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
          <h1 className="text-3xl font-bold">Manajemen Stok</h1>
          <p className="text-muted-foreground">Kelola stok produk dan riwayat pergerakan</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Penyesuaian Stok
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Penyesuaian Stok</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Produk</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stok: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type">Tipe Pergerakan</Label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stok Masuk</SelectItem>
                    <SelectItem value="out">Stok Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Jumlah</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Masukkan jumlah"
                />
              </div>

              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan (opsional)"
                />
              </div>

              <Button onClick={handleStockAdjustment} className="w-full">
                Simpan Penyesuaian
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pergerakan Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stockMovements.filter(m => 
                new Date(m.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
          <CardDescription>Kelola stok produk Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Min. Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.stock, product.min_stock);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name || '-'}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.min_stock}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Stock Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pergerakan Stok</CardTitle>
          <CardDescription>10 pergerakan stok terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{movement.products.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {movement.type === 'in' ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          Masuk
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          Keluar
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{Math.abs(movement.quantity)}</TableCell>
                  <TableCell>{movement.notes || '-'}</TableCell>
                  <TableCell>{new Date(movement.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}