import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground">
            Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Button onClick={() => navigate('/dashboard')} className="gap-2">
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;