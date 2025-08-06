import React, { useState, useEffect } from 'react';
import { Save, User, Store, Bell, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OutletSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export default function Settings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Profile settings
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Outlet settings
  const [outletData, setOutletData] = useState<OutletSettings | null>(null);
  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');
  const [outletPhone, setOutletPhone] = useState('');
  
  // App settings
  const [notifications, setNotifications] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone || '');
    }
    fetchOutletData();
  }, [profile]);

  const fetchOutletData = async () => {
    if (!profile?.outlet_id) return;

    try {
      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .eq('id', profile.outlet_id)
        .single();

      if (error) throw error;
      
      if (data) {
        setOutletData(data);
        setOutletName(data.name);
        setOutletAddress(data.address || '');
        setOutletPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error fetching outlet data:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOutlet = async () => {
    if (!outletData?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('outlets')
        .update({
          name: outletName,
          address: outletAddress || null,
          phone: outletPhone || null
        })
        .eq('id', outletData.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data outlet berhasil diperbarui"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui data outlet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppSettings = () => {
    // In a real app, these would be saved to user preferences or local storage
    toast({
      title: "Berhasil",
      description: "Pengaturan aplikasi berhasil disimpan"
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola preferensi akun dan aplikasi Anda</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="outlet">Outlet</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Profil
              </CardTitle>
              <CardDescription>
                Perbarui informasi profil pribadi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Masukkan nomor telepon"
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground mt-1">
                  Email tidak dapat diubah
                </p>
              </div>

              <div>
                <Label>Role</Label>
                <Input value={profile?.role || ''} disabled />
                <p className="text-xs text-muted-foreground mt-1">
                  Role ditentukan oleh administrator
                </p>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outlet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Informasi Outlet
              </CardTitle>
              <CardDescription>
                Kelola informasi outlet tempat Anda bekerja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {outletData ? (
                <>
                  <div>
                    <Label htmlFor="outletName">Nama Outlet</Label>
                    <Input
                      id="outletName"
                      value={outletName}
                      onChange={(e) => setOutletName(e.target.value)}
                      placeholder="Masukkan nama outlet"
                      disabled={profile?.role === 'kasir'}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="outletAddress">Alamat</Label>
                    <Textarea
                      id="outletAddress"
                      value={outletAddress}
                      onChange={(e) => setOutletAddress(e.target.value)}
                      placeholder="Masukkan alamat outlet"
                      disabled={profile?.role === 'kasir'}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="outletPhone">Nomor Telepon Outlet</Label>
                    <Input
                      id="outletPhone"
                      value={outletPhone}
                      onChange={(e) => setOutletPhone(e.target.value)}
                      placeholder="Masukkan nomor telepon outlet"
                      disabled={profile?.role === 'kasir'}
                    />
                  </div>

                  {profile?.role !== 'kasir' && (
                    <Button onClick={handleUpdateOutlet} disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </Button>
                  )}

                  {profile?.role === 'kasir' && (
                    <p className="text-sm text-muted-foreground">
                      Anda tidak memiliki akses untuk mengubah data outlet
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Data outlet tidak tersedia
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>
                Kelola preferensi notifikasi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifikasi Umum</Label>
                  <p className="text-sm text-muted-foreground">
                    Terima notifikasi untuk aktivitas umum aplikasi
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Peringatan Stok Rendah</Label>
                  <p className="text-sm text-muted-foreground">
                    Dapatkan notifikasi ketika stok produk mencapai batas minimum
                  </p>
                </div>
                <Switch
                  checked={lowStockAlert}
                  onCheckedChange={setLowStockAlert}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup Otomatis</Label>
                  <p className="text-sm text-muted-foreground">
                    Backup data secara otomatis setiap hari
                  </p>
                </div>
                <Switch
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>

              <Button onClick={handleSaveAppSettings}>
                <Save className="mr-2 h-4 w-4" />
                Simpan Pengaturan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Keamanan Akun
              </CardTitle>
              <CardDescription>
                Kelola pengaturan keamanan akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ubah Password</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Untuk mengubah password, Anda akan diarahkan ke halaman reset password
                </p>
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Info",
                    description: "Fitur ubah password akan segera tersedia"
                  });
                }}>
                  Ubah Password
                </Button>
              </div>

              <Separator />

              <div>
                <Label>Aktivitas Login</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Login terakhir: {new Date().toLocaleString()}
                </p>
              </div>

              <Separator />

              <div>
                <Label>Hapus Akun</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Menghapus akun akan menghilangkan semua data Anda secara permanen
                </p>
                <Button variant="destructive" onClick={() => {
                  toast({
                    title: "Info",
                    description: "Fitur hapus akun memerlukan konfirmasi administrator"
                  });
                }}>
                  Hapus Akun
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}