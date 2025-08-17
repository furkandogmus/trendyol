import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Dashboard = ({ siparisler }) => {
  // Veri analizi - moved before early return
  const totalSiparis = siparisler?.length || 0;
  const totalSatis = siparisler?.reduce((sum, siparis) => {
    const satisTutari = parseFloat(siparis['Satış Tutarı'] || siparis['Satis Tutari'] || 0);
    return sum + (isNaN(satisTutari) ? 0 : satisTutari);
  }, 0) || 0;
  
  const totalIndirim = siparisler?.reduce((sum, siparis) => {
    const indirimTutari = parseFloat(siparis['İndirim Tutarı'] || siparis['Indirim Tutari'] || 0);
    return sum + (isNaN(indirimTutari) ? 0 : indirimTutari);
  }, 0) || 0;

  const totalKargo = siparisler?.reduce((sum, siparis) => {
    const kargoTutari = parseFloat(siparis['Faturalanan Kargo Tutarı'] || siparis['Faturalanan Kargo Tutari'] || 0);
    return sum + (isNaN(kargoTutari) ? 0 : kargoTutari);
  }, 0) || 0;

  // Şehir analizi
  const sehirAnalizi = siparisler?.reduce((acc, siparis) => {
    const sehir = siparis['İl'] || siparis['Il'] || 'Bilinmeyen';
    acc[sehir] = (acc[sehir] || 0) + 1;
    return acc;
  }, {}) || {};

  const sehirChartData = Object.entries(sehirAnalizi)
    .map(([sehir, count]) => ({ sehir, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Sipariş durumu analizi
  const durumAnalizi = siparisler?.reduce((acc, siparis) => {
    const durum = siparis['Sipariş Statüsü'] || siparis['Siparis Statusu'] || 'Bilinmeyen';
    acc[durum] = (acc[durum] || 0) + 1;
    return acc;
  }, {}) || {};

  const durumChartData = Object.entries(durumAnalizi).map(([durum, count]) => ({
    durum,
    count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Kargo firması analizi
  const kargoAnalizi = siparisler?.reduce((acc, siparis) => {
    const kargo = siparis['Kargo Firması'] || siparis['Kargo Firmasi'] || 'Bilinmeyen';
    // Boş string kontrolü ekle
    if (kargo && kargo.trim() !== '') {
      acc[kargo] = (acc[kargo] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  const kargoChartData = Object.entries(kargoAnalizi)
    .map(([kargo, count]) => ({ kargo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (!siparisler || siparisler.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          📊 Dashboard'u görmek için önce Excel dosyası yükleyin.
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
      <Typography variant="h5" gutterBottom>
        📊 Dashboard Özeti
      </Typography>

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="primary">
                {totalSiparis}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Sipariş
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
                Toplam Satış
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="warning.main">
                ₺{totalIndirim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam İndirim
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShippingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="info.main">
                ₺{totalKargo.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Kargo
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
              <Typography variant="h6" gutterBottom>
                📈 Sipariş Durumu Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={durumChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ durum, percent }) => `${durum} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {durumChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Şehir Analizi Bar Grafiği */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏙️ Şehir Bazlı Sipariş Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sehirChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sehir" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Kargo Firması Analizi */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚚 Kargo Firması Dağılımı
              </Typography>
              
              {/* Basit Dikey Bar Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kargoChartData} margin={{ left: 20, right: 20, top: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kargo" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Kargo firması listesi */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📋 Kargo Firmaları:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {kargoChartData.map((item) => (
                    <Chip
                      key={item.kargo}
                      label={`${item.kargo}: ${item.count}`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
              
              {/* Debug bilgisi */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  🔍 Debug: Toplam {Object.keys(kargoAnalizi).length} kargo firması bulundu. 
                  Chart data: {kargoChartData.length} adet
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    📊 Chart Data: {JSON.stringify(kargoChartData, null, 2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hızlı İstatistikler */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          📋 Hızlı İstatistikler
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {Object.keys(sehirAnalizi).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Farklı Şehir
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success">
                {Object.keys(kargoAnalizi).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kargo Firması
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning">
                {Object.keys(durumAnalizi).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sipariş Durumu
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="info">
                {(totalSatis / totalSiparis).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ortalama Sipariş Tutarı
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Ürün ve Stok Kodu Özeti */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            🏷️ Ürün ve Stok Kodu Bilgileri
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {siparisler?.filter(s => s['Stok Kodu'] && s['Stok Kodu'].trim() !== '').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stok Kodu Olan Ürünler
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success">
                  {siparisler?.filter(s => s['Marka'] && s['Marka'].trim() !== '').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Marka Bilgisi Olan Ürünler
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="warning">
                  {siparisler?.filter(s => s['Ürün Adı'] && s['Ürün Adı'].trim() !== '').length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ürün Adı Olan Siparişler
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
