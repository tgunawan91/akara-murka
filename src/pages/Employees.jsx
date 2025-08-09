import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Employees() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('kasir');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, [profile?.outlet_id]);

  const fetchEmployees = async () => {
    if (!profile?.outlet_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('outlet_id', profile.outlet_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data pegawai",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !role || !profile?.outlet_id) return;

    try {
      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone || null,
            role
          })
          .eq('id', editingEmployee.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data pegawai berhasil diperbarui"
        });
      } else {
        // Create new employee (this would typically involve creating a new user account)
        // For now, we'll show a message that this feature needs backend implementation
        toast({
          title: "Info",
          description: "Fitur tambah pegawai memerlukan implementasi backend untuk membuat akun user baru",
          variant: "default"
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan data pegawai",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFullName(employee.full_name);
    setPhone(employee.phone || '');
    setRole(employee.role);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (employee) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Pegawai ${employee.is_active ? 'dinonaktifkan' : 'diaktifkan'}`
      });

      fetchEmployees();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status pegawai",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setRole('kasir');
    setEmail('');
    setPassword('');
    setEditingEmployee(null);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'kasir': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has permission to manage employees
  if (profile?.role === 'kasir') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Akses Terbatas</CardTitle>
            <CardDescription>Anda tidak memiliki akses untuk mengelola pegawai</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pegawai</h1>
          <p className="text-muted-foreground">Kelola data pegawai dan hak akses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pegawai
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              {!editingEmployee && (
                <>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingEmployee ? 'Update Pegawai' : 'Tambah Pegawai'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pegawai Aktif</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(e => e.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pegawai Non-Aktif</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {employees.filter(e => !e.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Cari pegawai..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pegawai</CardTitle>
          <CardDescription>Kelola pegawai dan hak akses mereka</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.full_name}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(employee.role)}>
                      {employee.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                      {employee.is_active ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(employee.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={employee.is_active ? 'text-red-600' : 'text-green-600'}
                          >
                            {employee.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin {employee.is_active ? 'menonaktifkan' : 'mengaktifkan'} pegawai {employee.full_name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleStatus(employee)}>
                              Ya, {employee.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}