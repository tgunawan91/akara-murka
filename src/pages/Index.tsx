import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight, Package, Users, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Swift Retail POS</h1>
              <p className="text-sm text-muted-foreground">Sistem Kasir Modern</p>
            </div>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            Masuk ke Sistem
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Sistem POS Terdepan untuk{' '}
            <span className="text-primary">Bisnis Ritel Modern</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Kelola toko, pantau stok, proses transaksi, dan analisis penjualan dengan mudah. 
            Solusi lengkap untuk toko kelontong, minimarket, restoran, dan bisnis ritel lainnya.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="gap-2 text-lg px-8 py-3"
            >
              Mulai Sekarang
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Transaksi Cepat</h3>
            <p className="text-muted-foreground">
              Interface kasir yang intuitif dengan dukungan barcode scanner dan berbagai metode pembayaran
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Manajemen Stok</h3>
            <p className="text-muted-foreground">
              Pantau stok real-time, alert stok menipis, dan kelola kategori produk dengan mudah
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Laporan Lengkap</h3>
            <p className="text-muted-foreground">
              Analisis penjualan harian, bulanan, laporan keuntungan, dan insight bisnis yang mendalam
            </p>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto">
          <div className="p-6 bg-card rounded-2xl border">
            <Users className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multi User & Role</h3>
            <p className="text-muted-foreground">
              Kelola pegawai dengan role admin dan kasir, dengan kontrol akses yang berbeda untuk setiap peran
            </p>
          </div>
          <div className="p-6 bg-card rounded-2xl border">
            <Package className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multi Outlet</h3>
            <p className="text-muted-foreground">
              Dukungan untuk multiple toko/outlet dengan data terpisah dan laporan terpusat
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 Swift Retail POS. Solusi kasir digital untuk bisnis modern.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
