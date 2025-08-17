import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Calculate as CalculateIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const KarZararAnalizi = ({ siparisler }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customCost, setCustomCost] = useState(0);
  const [customCostType, setCustomCostType] = useState('percentage');

  // Veri analizi - moved before early return
  const analysis = useMemo(() => {
    if (!siparisler || siparisler.length === 0) {
      return {
        totalSatis: 0,
        totalIndirim: 0,
        totalKargo: 0,
        totalKomisyon: 0,
        ekMaliyet: 0,
        netGelir: 0,
        karOrani: 0,
        totalAdet: 0,
        ortalamaSiparisTutari: 0,
        ortalamaKar: 0
      };
    }

    const totalSatis = siparisler.reduce((sum, s) => {
      const satisTutari = parseFloat(s['Satış Tutarı'] || s['Satis Tutari'] || 0);
      return sum + (isNaN(satisTutari) ? 0 : satisTutari);
    }, 0);

    const totalIndirim = siparisler.reduce((sum, s) => {
      const indirimTutari = parseFloat(s['İndirim Tutarı'] || s['Indirim Tutari'] || 0);
      return sum + (isNaN(indirimTutari) ? 0 : indirimTutari);
    }, 0);

    const totalKargo = siparisler.reduce((sum, s) => {
      const kargoTutari = parseFloat(s['Faturalanan Kargo Tutarı'] || s['Faturalanan Kargo Tutari'] || 0);
      return sum + (isNaN(kargoTutari) ? 0 : kargoTutari);
    }, 0);

    const totalAdet = siparisler.reduce((sum, s) => {
      const adet = parseInt(s['Adet'] || 0);
      return sum + (isNaN(adet) ? 0 : adet);
    }, 0);

    // Komisyon hesaplama (varsayılan %15)
    const totalKomisyon = siparisler.reduce((sum, s) => {
      const komisyonOrani = parseFloat(s['Komisyon Oranı'] || s['Komisyon Orani'] || 15);
      const satisTutari = parseFloat(s['Satış Tutarı'] || s['Satis Tutari'] || 0);
      return sum + (satisTutari * komisyonOrani / 100);
    }, 0);

    // Özel maliyet hesaplama
    let ekMaliyet = 0;
    if (customCost > 0) {
      if (customCostType === 'percentage') {
        ekMaliyet = totalSatis * customCost / 100;
      } else {
        ekMaliyet = customCost;
      }
    }

    const netGelir = totalSatis - totalIndirim - totalKargo - totalKomisyon - ekMaliyet;
    const karOrani = totalSatis > 0 ? (netGelir / totalSatis) * 100 : 0;

    return {
      totalSatis,
      totalIndirim,
      totalKargo,
      totalKomisyon,
      ekMaliyet,
      netGelir,
      karOrani,
      totalAdet,
      ortalamaSiparisTutari: totalSatis / siparisler.length,
      ortalamaKar: netGelir / siparisler.length
    };
  }, [siparisler, customCost, customCostType]);

  // Kategori bazlı analiz - moved before early return
  const categoryAnalysis = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    
    const categories = {};
    
    siparisler.forEach(siparis => {
      const marka = siparis['Marka'] || 'Bilinmeyen';
      const satisTutari = parseFloat(siparis['Satış Tutarı'] || siparis['Satis Tutari'] || 0);
      const adet = parseInt(siparis['Adet'] || 0);
      
      if (!categories[marka]) {
        categories[marka] = {
          satisTutari: 0,
          adet: 0,
          siparisSayisi: 0
        };
      }
      
      categories[marka].satisTutari += satisTutari;
      categories[marka].adet += adet;
      categories[marka].siparisSayisi += 1;
    });

    return Object.entries(categories)
      .map(([marka, data]) => ({
        marka,
        ...data,
        ortalamaTutar: data.satisTutari / data.siparisSayisi
      }))
      .sort((a, b) => b.satisTutari - a.satisTutari)
      .slice(0, 10);
  }, [siparisler]);

  // Zaman bazlı analiz - moved before early return
  const timeAnalysis = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    
    const monthlyData = {};
    
    siparisler.forEach(siparis => {
      const tarih = new Date(siparis['Sipariş Tarihi'] || siparis['Siparis Tarihi']);
      const monthKey = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
      const satisTutari = parseFloat(siparis['Satış Tutarı'] || siparis['Satis Tutari'] || 0);
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          satisTutari: 0,
          siparisSayisi: 0
        };
      }
      
      monthlyData[monthKey].satisTutari += satisTutari;
      monthlyData[monthKey].siparisSayisi += 1;
    });

    return Object.entries(monthlyData)
      .map(([ay, data]) => ({
        ay,
        ...data
      }))
      .sort((a, b) => a.ay.localeCompare(b.ay));
  }, [siparisler]);

  if (!siparisler || siparisler.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          📊 Kar-zarar analizini görmek için önce Excel dosyası yükleyin.
        </Alert>
      </Box>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const exportAnalysis = () => {
    const csvContent = [
      'Analiz Türü,Değer',
      `Toplam Satış,${analysis.totalSatis}`,
      `Toplam İndirim,${analysis.totalIndirim}`,
      `Toplam Kargo,${analysis.totalKargo}`,
      `Toplam Komisyon,${analysis.totalKomisyon}`,
      `Ek Maliyet,${analysis.ekMaliyet}`,
      `Net Gelir,${analysis.netGelir}`,
      `Kar Oranı,${analysis.karOrani}%`,
      `Toplam Adet,${analysis.totalAdet}`,
      `Ortalama Sipariş Tutarı,${analysis.ortalamaSiparisTutari}`,
      `Ortalama Kar,${analysis.ortalamaKar}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kar_zarar_analizi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📊 Kar-Zarar Analizi
      </Typography>

      {/* Filtreler */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Dönem</InputLabel>
              <Select
                value={selectedPeriod}
                label="Dönem"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="all">Tüm Dönem</MenuItem>
                <MenuItem value="month">Bu Ay</MenuItem>
                <MenuItem value="quarter">Bu Çeyrek</MenuItem>
                <MenuItem value="year">Bu Yıl</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Kategori</InputLabel>
              <Select
                value={selectedCategory}
                label="Kategori"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">Tüm Kategoriler</MenuItem>
                {categoryAnalysis.map((cat) => (
                  <MenuItem key={cat.marka} value={cat.marka}>{cat.marka}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Ek Maliyet"
              type="number"
              value={customCost}
              onChange={(e) => setCustomCost(parseFloat(e.target.value) || 0)}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {customCostType === 'percentage' ? '%' : '₺'}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Maliyet Türü</InputLabel>
              <Select
                value={customCostType}
                label="Maliyet Türü"
                onChange={(e) => setCustomCostType(e.target.value)}
              >
                <MenuItem value="percentage">Yüzde (%)</MenuItem>
                <MenuItem value="fixed">Sabit Tutar (₺)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Ana Metrikler */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                ₺{analysis.totalSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
              <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="primary.main">
                ₺{analysis.netGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Net Gelir
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalculateIcon sx={{ fontSize: 40, color: analysis.karOrani >= 0 ? 'success.main' : 'error.main', mb: 1 }} />
              <Typography variant="h4" component="div" color={analysis.karOrani >= 0 ? 'success.main' : 'error.main'}>
                {analysis.karOrani.toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kar Oranı
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDownIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" color="warning.main">
                ₺{(analysis.totalIndirim + analysis.totalKargo + analysis.totalKomisyon + analysis.ekMaliyet).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Maliyet
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detaylı Analiz */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Maliyet Dağılımı Pasta Grafiği */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Maliyet Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'İndirim', value: analysis.totalIndirim },
                      { name: 'Kargo', value: analysis.totalKargo },
                      { name: 'Komisyon', value: analysis.totalKomisyon },
                      { name: 'Ek Maliyet', value: analysis.ekMaliyet }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Aylık Trend Grafiği */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Aylık Satış Trendi
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ay" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="satisTutari" stroke="#8884d8" strokeWidth={2} name="Satış Tutarı" />
                  <Line type="monotone" dataKey="siparisSayisi" stroke="#82ca9d" strokeWidth={2} name="Sipariş Sayısı" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Marka Bazlı Analiz */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              🏷️ Marka Bazlı Performans
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportAnalysis}
              size="small"
            >
              Analizi İndir
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Marka</TableCell>
                  <TableCell>Stok Kodu</TableCell>
                  <TableCell align="right">Satış Tutarı</TableCell>
                  <TableCell align="right">Sipariş Sayısı</TableCell>
                  <TableCell align="right">Toplam Adet</TableCell>
                  <TableCell align="right">Ortalama Tutar</TableCell>
                  <TableCell align="right">Pazar Payı</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categoryAnalysis.map((category) => (
                  <TableRow key={category.marka}>
                    <TableCell>
                      <Chip label={category.marka} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" fontSize="0.75rem">
                        {siparisler.find(s => s['Marka'] === category.marka)?.['Stok Kodu'] || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        ₺{category.satisTutari.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{category.siparisSayisi}</TableCell>
                    <TableCell align="right">{category.adet}</TableCell>
                    <TableCell align="right">
                      ₺{category.ortalamaTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
                      {((category.satisTutari / analysis.totalSatis) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Kar-Zarar Özeti */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Kar-Zarar Özeti
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Gelir Kalemleri
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Toplam Satış:</Typography>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    ₺{analysis.totalSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight="bold">Net Gelir:</Typography>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    ₺{analysis.netGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Maliyet Kalemleri
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">İndirim:</Typography>
                  <Typography variant="body2" color="error.main">
                    -₺{analysis.totalIndirim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Kargo:</Typography>
                  <Typography variant="body2" color="error.main">
                    -₺{analysis.totalKargo.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Komisyon:</Typography>
                  <Typography variant="body2" color="error.main">
                    -₺{analysis.totalKomisyon.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                {analysis.ekMaliyet > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Ek Maliyet:</Typography>
                    <Typography variant="body2" color="error.main">
                      -₺{analysis.ekMaliyet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight="bold">Toplam Maliyet:</Typography>
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    -₺{(analysis.totalIndirim + analysis.totalKargo + analysis.totalKomisyon + analysis.ekMaliyet).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default KarZararAnalizi;
