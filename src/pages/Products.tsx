import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Package, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  min_stock?: number;
  barcode?: string;
  image_url?: string;
  category_id?: string;
  unit?: string;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const Products = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock: '',
    min_stock: '5',
    barcode: '',
    image_url: '',
    category_id: '',
    unit: 'pcs',
    is_active: true
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [profile, showInactive]);

  const fetchProducts = async () => {
    if (!profile?.outlet_id) return;

    let query = supabase
      .from('products')
      .select('*')
      .eq('outlet_id', profile.outlet_id)
      .order('created_at', { ascending: false });

    if (!showInactive) {
      query = query.eq('is_active', true);
    }

    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    if (!profile?.outlet_id) return;

    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('outlet_id', profile.outlet_id);

    setCategories(data || []);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost_price: '',
      stock: '',
      min_stock: '5',
      barcode: '',
      image_url: '',
      category_id: '',
      unit: 'pcs',
      is_active: true
    });
    setEditingProduct(null);
  };

  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        cost_price: product.cost_price?.toString() || '',
        stock: product.stock.toString(),
        min_stock: product.min_stock?.toString() || '5',
        barcode: product.barcode || '',
        image_url: product.image_url || '',
        category_id: product.category_id || '',
        unit: product.unit || 'pcs',
        is_active: product.is_active
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
        barcode: formData.barcode || null,
        image_url: formData.image_url || null,
        category_id: formData.category_id || null,
        unit: formData.unit,
        is_active: formData.is_active,
        outlet_id: profile?.outlet_id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Produk Diperbarui",
          description: "Produk berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Produk Ditambahkan",
          description: "Produk baru berhasil ditambahkan",
        });
      }

      closeDialog();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan produk",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produk Dihapus",
        description: "Produk berhasil dihapus",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Gagal Menghapus",
        description: "Terjadi kesalahan saat menghapus produk",
        variant: "destructive"
      });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Status Diperbarui",
        description: `Produk ${!product.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
      });

      fetchProducts();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Gagal Memperbarui",
        description: "Terjadi kesalahan saat memperbarui status produk",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Produk</h1>
          <p className="text-muted-foreground">Kelola produk, stok, dan kategori</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {products.filter(p => p.is_active && p.stock <= (p.min_stock || 5)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(products.reduce((sum, p) => sum + (p.stock * p.price), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Nonaktif</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => !p.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari produk atau barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showInactive ? "default" : "outline"}
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
          {showInactive ? 'Semua Produk' : 'Tampilkan Nonaktif'}
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.unit}</p>
                      {product.barcode && (
                        <p className="text-xs text-muted-foreground">#{product.barcode}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getCategoryName(product.category_id || '')}</TableCell>
                <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={product.stock <= (product.min_stock || 5) ? 'text-warning font-medium' : ''}>
                      {product.stock}
                    </span>
                    {product.stock <= (product.min_stock || 5) && (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleProductStatus(product)}
                    >
                      {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi informasi produk di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md"
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Harga Jual *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_price">Harga Beli</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stok *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stok Minimal</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL Gambar</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
              <Label htmlFor="is_active">Produk Aktif</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Batal
              </Button>
              <Button type="submit">
                {editingProduct ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;