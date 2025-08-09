import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Store, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Outlets() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [outlets, setOutlets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchOutlets();
  }, [user?.id]);

  const fetchOutlets = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOutlets(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data outlet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !user?.id) return;

    try {
      if (editingOutlet) {
        // Update existing outlet
        const { error } = await supabase
          .from('outlets')
          .update({
            name,
            address: address || null,
            phone: phone || null,
            is_active: isActive
          })
          .eq('id', editingOutlet.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data outlet berhasil diperbarui"
        });
      } else {
        // Create new outlet
        const { error } = await supabase
          .from('outlets')
          .insert({
            name,
            address: address || null,
            phone: phone || null,
            is_active: isActive,
            owner_id: user.id
          });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Outlet baru berhasil ditambahkan"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchOutlets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan data outlet",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (outlet) => {
    setEditingOutlet(outlet);
    setName(outlet.name);
    setAddress(outlet.address || '');
    setPhone(outlet.phone || '');
    setIsActive(outlet.is_active);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setIsActive(true);
    setEditingOutlet(null);
  };

  const filteredOutlets = outlets.filter(outlet =>
    outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (outlet.address && outlet.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has permission to manage outlets
  if (profile?.role === 'kasir') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Akses Terbatas</CardTitle>
            <CardDescription>Anda tidak memiliki akses untuk mengelola outlet</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Outlet</h1>
          <p className="text-muted-foreground">Kelola outlet dan cabang toko Anda</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Outlet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingOutlet ? 'Edit Outlet' : 'Tambah Outlet Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Outlet</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama outlet"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label>Outlet Aktif</Label>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingOutlet ? 'Update Outlet' : 'Tambah Outlet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outlet</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outlets.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outlet Aktif</CardTitle>
            <Store className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {outlets.filter(o => o.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outlet Non-Aktif</CardTitle>
            <Store className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {outlets.filter(o => !o.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Cari outlet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Outlets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOutlets.map((outlet) => (
          <Card key={outlet.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    {outlet.name}
                  </CardTitle>
                  <Badge variant={outlet.is_active ? 'default' : 'secondary'} className="mt-2">
                    {outlet.is_active ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(outlet)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {outlet.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{outlet.address}</p>
                </div>
              )}
              
              {outlet.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{outlet.phone}</p>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Dibuat: {new Date(outlet.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOutlets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum ada outlet</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Tidak ada outlet yang sesuai dengan pencarian.' : 'Mulai dengan menambahkan outlet pertama Anda.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Outlet
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}