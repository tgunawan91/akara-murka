import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, generateTransactionNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Smartphone,
  User,
  Calculator
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  image_url?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

const POS = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'kartu_debit' | 'transfer'>('tunai');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [profile]);

  const fetchProducts = async () => {
    if (!profile?.outlet_id) return;

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('outlet_id', profile.outlet_id)
      .eq('is_active', true)
      .gt('stock', 0);

    setProducts(data || []);
  };

  const fetchCustomers = async () => {
    if (!profile?.outlet_id) return;

    const { data } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('outlet_id', profile.outlet_id)
      .limit(10);

    setCustomers(data || []);
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        updateCartQuantity(product.id, existingItem.quantity + 1);
      } else {
        toast({
          title: "Stok Tidak Cukup",
          description: "Stok produk tidak mencukupi",
          variant: "destructive"
        });
      }
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        subtotal: product.price
      }]);
    }
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, subtotal: item.product.price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentAmount(0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  const change = paymentAmount - total;

  const processTransaction = async () => {
    if (cart.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === 'tunai' && paymentAmount < total) {
      toast({
        title: "Pembayaran Kurang",
        description: "Jumlah pembayaran kurang dari total",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const transactionNumber = generateTransactionNumber();

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          outlet_id: profile?.outlet_id,
          cashier_id: profile?.user_id,
          customer_id: selectedCustomer?.id,
          subtotal,
          tax_amount: tax,
          total_amount: total,
          payment_method: paymentMethod,
          payment_amount: paymentAmount,
          change_amount: change > 0 ? change : 0,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update product stock and create stock movements
      for (const item of cart) {
        // Update stock
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock: item.product.stock - item.quantity 
          })
          .eq('id', item.product.id);

        if (stockError) throw stockError;

        // Create stock movement
        await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product.id,
            outlet_id: profile?.outlet_id,
            type: 'out',
            quantity: -item.quantity,
            reference_type: 'sale',
            reference_id: transaction.id,
            created_by: profile?.user_id,
            notes: `Penjualan ${transactionNumber}`
          });
      }

      toast({
        title: "Transaksi Berhasil",
        description: `Transaksi ${transactionNumber} berhasil diproses`,
      });

      clearCart();
      fetchProducts(); // Refresh products to update stock

    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Transaksi Gagal",
        description: "Terjadi kesalahan saat memproses transaksi",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Products Section */}
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Kasir POS</h1>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari produk atau scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                <p className="text-xs text-muted-foreground">Stok: {product.stock}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 border-l bg-card p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Keranjang
        </h2>

        {/* Customer Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pelanggan (Opsional)</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value);
              setSelectedCustomer(customer || null);
            }}
          >
            <option value="">Pelanggan Umum</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.phone && `(${customer.phone})`}
              </option>
            ))}
          </select>
        </div>

        <Separator />

        {/* Cart Items */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Keranjang kosong</p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 p-2 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator />

        {/* Payment Summary */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pajak (10%):</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Metode Pembayaran</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === 'tunai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('tunai')}
            >
              <Banknote className="h-4 w-4 mr-1" />
              Tunai
            </Button>
            <Button
              variant={paymentMethod === 'kartu_debit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('kartu_debit')}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Kartu
            </Button>
            <Button
              variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentMethod('transfer')}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Transfer
            </Button>
          </div>
        </div>

        {/* Payment Amount */}
        {paymentMethod === 'tunai' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Jumlah Bayar</label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              placeholder="Masukkan jumlah bayar"
            />
            {change > 0 && (
              <p className="text-sm">
                <span className="text-muted-foreground">Kembalian: </span>
                <span className="font-bold text-success">{formatCurrency(change)}</span>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full" 
            onClick={processTransaction}
            disabled={cart.length === 0 || isProcessing}
          >
            <Calculator className="h-4 w-4 mr-2" />
            {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={clearCart}
            disabled={cart.length === 0}
          >
            Bersihkan Keranjang
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POS;