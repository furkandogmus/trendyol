import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Alert,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  CurrencyExchange as CurrencyIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Dashboard = ({ urunler }) => {
  const [dolarKuru, setDolarKuru] = useState(30.0);
  const [dolarKuruDialogOpen, setDolarKuruDialogOpen] = useState(false);
  const [dolarKuruForm, setDolarKuruForm] = useState({
    yeniKur: '42.00'
  });

  // localStorage'dan dolar kurunu yükle
  useEffect(() => {
    const savedDolarKuru = localStorage.getItem('dolarKuru');
    if (savedDolarKuru) {
      setDolarKuru(parseFloat(savedDolarKuru));
      setDolarKuruForm({ yeniKur: parseFloat(savedDolarKuru).toFixed(2) });
    }
  }, []);

  // Dolar kurunu localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('dolarKuru', dolarKuru.toString());
  }, [dolarKuru]);

  // Dolar kuru dialog açma
  const handleOpenDolarKuruDialog = () => {
    setDolarKuruForm({ yeniKur: dolarKuru.toFixed(2) });
    setDolarKuruDialogOpen(true);
  };

  // Dolar kuru dialog kapatma
  const handleCloseDolarKuruDialog = () => {
    setDolarKuruDialogOpen(false);
  };

  // Dolar kuru güncelleme
  const handleUpdateDolarKuru = () => {
    const yeniKur = parseFloat(dolarKuruForm.yeniKur);
    if (isNaN(yeniKur) || yeniKur <= 0) {
      alert('Lütfen geçerli bir dolar kuru girin!');
      return;
    }
    
    setDolarKuru(yeniKur);
    handleCloseDolarKuruDialog();
  };

  // Veri analizi
  const totalUrun = urunler?.length || 0;
  const totalSatis = urunler?.reduce((sum, urun) => {
    const satisTutari = parseFloat(urun['Piyasa Satış Fiyatı (KDV Dahil)'] || 0);
    return sum + (isNaN(satisTutari) ? 0 : satisTutari);
  }, 0) || 0;
  
  const totalDolar = urunler?.reduce((sum, urun) => {
    const dolarTutari = parseFloat(urun['Dolar Fiyatı'] || 0);
    return sum + (isNaN(dolarTutari) ? 0 : dolarTutari);
  }, 0) || 0;

  const totalStok = urunler?.reduce((sum, urun) => {
    const stokAdedi = parseInt(urun['Ürün Stok Adedi'] || 0);
    return sum + (isNaN(stokAdedi) ? 0 : stokAdedi);
  }, 0) || 0;

  // Dolar bazlı hesaplamalar
  const totalSatisDolar = totalSatis / dolarKuru;

  // Kategori analizi
  const kategoriAnalizi = urunler?.reduce((acc, urun) => {
    const kategori = urun['Kategori İsmi'] || 'Kategorisiz';
    acc[kategori] = (acc[kategori] || 0) + 1;
    return acc;
  }, {}) || {};

  const kategoriChartData = Object.entries(kategoriAnalizi).map(([kategori, count]) => ({
    kategori,
    count
  }));

  // Marka analizi
  const markaAnalizi = urunler?.reduce((acc, urun) => {
    const marka = urun['Marka'] || 'Markasız';
    acc[marka] = (acc[marka] || 0) + 1;
    return acc;
  }, {}) || {};

  const markaChartData = Object.entries(markaAnalizi)
    .map(([marka, count]) => ({ marka, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Durum analizi
  const durumAnalizi = urunler?.reduce((acc, urun) => {
    const durum = urun['Durum'] || 'Bilinmeyen';
    acc[durum] = (acc[durum] || 0) + 1;
    return acc;
  }, {}) || {};

  const durumChartData = Object.entries(durumAnalizi).map(([durum, count]) => ({
    durum,
    count
  }));

  const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b', '#5d4037', '#616161'];

  // Şehir analizi - removed as not in new Excel structure
  // Kargo firması analizi - removed as not in new Excel structure

  if (!urunler || urunler.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon />
          Dashboard'u görmek için önce Excel dosyası yükleyin.
        </Alert>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Henüz veri yüklenmedi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            "Excel Yükle" sekmesinden sipariş verilerinizi yükleyin
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AnalyticsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5">
          Dashboard Özeti
        </Typography>
      </Box>

      {/* Dolar Kuru Bilgisi ve Düzenleme */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'success.light', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CurrencyIcon sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Güncel Dolar Kuru: ${dolarKuru.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Bu kur tüm dolar hesaplamalarında kullanılır
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleOpenDolarKuruDialog}
            sx={{ 
              bgcolor: 'white', 
              color: 'success.main',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            Kuru Düzenle
          </Button>
        </Box>
      </Paper>

      
      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="primary">
                {totalUrun}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Ürün
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                ₺{totalSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Piyasa Fiyatı (₺)
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                ${totalSatisDolar.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="warning.main">
                ${totalDolar.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Dolar Fiyatı ($)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShippingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="info.main">
                {totalStok.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Stok Adedi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Grid container spacing={3}>
        {/* Sipariş Durumu Pasta Grafiği */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                  Ürün Durumu Dağılımı
                </Typography>
              </Box>
              {durumChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={durumChartData}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ durum, percent }) => percent > 8 ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={85}
                      innerRadius={35}
                      fill="#8884d8"
                      dataKey="count"
                      paddingAngle={1}
                    >
                      {durumChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} ürün`, 'Adet']}
                      labelFormatter={(label) => `Durum: ${label}`}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={30}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                  <Typography variant="body2" color="text.secondary">
                    Veri bulunamadı
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Marka Analizi Bar Grafiği */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                  Marka Bazlı Ürün Dağılımı
                </Typography>
              </Box>
              {markaChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={markaChartData} 
                    margin={{ top: 15, right: 20, left: 20, bottom: 45 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="marka" 
                      angle={-35}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      fontSize={10}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      fontSize={10}
                      tick={{ fill: '#666' }}
                      width={35}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${value} ürün`, 'Adet']}
                      labelFormatter={(label) => `Marka: ${label}`}
                      contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc', fontSize: '12px' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#1976d2" 
                      radius={[3, 3, 0, 0]}
                      stroke="#0d47a1"
                      strokeWidth={0.5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                  <Typography variant="body2" color="text.secondary">
                    Veri bulunamadı
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Kategori Analizi */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShippingIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                  Kategori Dağılımı
                </Typography>
              </Box>
              
              {kategoriChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={kategoriChartData} 
                    margin={{ top: 15, right: 20, left: 80, bottom: 20 }}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      type="number"
                      fontSize={10}
                      tick={{ fill: '#666' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="category"
                      dataKey="kategori" 
                      fontSize={10}
                      tick={{ fill: '#666' }}
                      width={75}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${value} ürün`, 'Adet']}
                      labelFormatter={(label) => `Kategori: ${label}`}
                      contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc', fontSize: '12px' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#2e7d32" 
                      radius={[0, 3, 3, 0]}
                      stroke="#1b5e20"
                      strokeWidth={0.5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body2" color="text.secondary">
                    Kategori verisi bulunamadı
                  </Typography>
                </Box>
              )}
              
              {/* Kategori listesi */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShippingIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="subtitle2">
                    Kategoriler:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {kategoriChartData.map((item) => (
                    <Chip
                      key={item.kategori}
                      label={`${item.kategori}: ${item.count}`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
              
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hızlı İstatistikler */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PersonIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">
            Hızlı İstatistikler
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {Object.keys(kategoriAnalizi).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Farklı Kategori
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success">
                {Object.keys(markaAnalizi).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Farklı Marka
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning">
                {Object.keys(durumAnalizi).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Farklı Durum
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="info">
                {(totalSatis / totalUrun).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ortalama Piyasa Fiyatı (₺)
              </Typography>
              <Typography variant="body2" color="info.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                ${((totalSatis / totalUrun) / dolarKuru).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Ürün ve Stok Kodu Özeti */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ShoppingCartIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              Ürün ve Stok Kodu Bilgileri
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {urunler?.filter(u => u['Tedarikçi Stok Kodu'] && u['Tedarikçi Stok Kodu'].trim() !== '').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stok Kodu Olan Ürünler
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success">
                  {urunler?.filter(u => u['Marka'] && u['Marka'].trim() !== '').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Marka Bilgisi Olan Ürünler
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="warning">
                  {urunler?.filter(u => u['Ürün Adı'] && u['Ürün Adı'].trim() !== '').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ürün Adı Olan Ürünler
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

     
      {/* Dolar Kuru Düzenleme Dialog */}
      <Dialog 
        open={dolarKuruDialogOpen} 
        onClose={handleCloseDolarKuruDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CurrencyIcon sx={{ color: 'success.main' }} />
            Dolar Kuru Düzenle
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Mevcut dolar kuru: <strong>${dolarKuru.toFixed(2)}</strong>
            </Typography>
            <TextField
              fullWidth
              label="Yeni Dolar Kuru ($)"
              type="number"
              value={dolarKuruForm.yeniKur}
              onChange={(e) => setDolarKuruForm({ yeniKur: e.target.value })}
              inputProps={{ step: "0.01", min: "0.01" }}
              helperText="Bu kur tüm dolar hesaplamalarında kullanılacak"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDolarKuruDialog}>İptal</Button>
          <Button onClick={handleUpdateDolarKuru} variant="contained" color="success">
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
