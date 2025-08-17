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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const KarZararAnalizi = ({ urunler }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customCost, setCustomCost] = useState(0);
  const [customCostType, setCustomCostType] = useState('percentage');

  // Veri analizi
  const analysis = useMemo(() => {
    if (!urunler || urunler.length === 0) {
      return {
        totalPiyasaSatis: 0,
        totalDolarFiyat: 0,
        totalStokAdedi: 0,
        totalKomisyon: 0,
        ekMaliyet: 0,
        netGelir: 0,
        karOrani: 0,
        totalUrun: 0,
        ortalamaPiyasaFiyati: 0,
        ortalamaKar: 0
      };
    }

    const totalPiyasaSatis = urunler.reduce((sum, u) => {
      const satisTutari = parseFloat(u['Piyasa Satış Fiyatı (KDV Dahil)'] || 0);
      return sum + (isNaN(satisTutari) ? 0 : satisTutari);
    }, 0);

    const totalDolarFiyat = urunler.reduce((sum, u) => {
      const dolarFiyat = parseFloat(u['Dolar Fiyatı'] || 0);
      return sum + (isNaN(dolarFiyat) ? 0 : dolarFiyat);
    }, 0);

    const totalStokAdedi = urunler.reduce((sum, u) => {
      const stokAdedi = parseInt(u['Ürün Stok Adedi'] || 0);
      return sum + (isNaN(stokAdedi) ? 0 : stokAdedi);
    }, 0);

    const totalUrun = urunler.length;

    // Komisyon hesaplama
    const totalKomisyon = urunler.reduce((sum, u) => {
      const komisyonOrani = parseFloat(u['Komisyon Oranı'] || 15);
      const satisTutari = parseFloat(u['Piyasa Satış Fiyatı (KDV Dahil)'] || 0);
      return sum + (satisTutari * komisyonOrani / 100);
    }, 0);

    // Özel maliyet hesaplama
    let ekMaliyet = 0;
    if (customCost > 0) {
      if (customCostType === 'percentage') {
        ekMaliyet = totalPiyasaSatis * customCost / 100;
      } else {
        ekMaliyet = customCost;
      }
    }

    // Basit kar hesaplama (piyasa fiyatı - dolar fiyatı * dolar kuru)
    const dolarKuru = 30.0; // Dashboard'dan alınabilir
    const toplamMaliyet = totalDolarFiyat * dolarKuru;
    const netGelir = totalPiyasaSatis - toplamMaliyet - totalKomisyon - ekMaliyet;
    const karOrani = totalPiyasaSatis > 0 ? (netGelir / totalPiyasaSatis) * 100 : 0;

    return {
      totalPiyasaSatis,
      totalDolarFiyat,
      totalStokAdedi,
      totalKomisyon,
      ekMaliyet,
      netGelir,
      karOrani,
      totalUrun,
      ortalamaPiyasaFiyati: totalUrun > 0 ? totalPiyasaSatis / totalUrun : 0,
      ortalamaKar: totalUrun > 0 ? netGelir / totalUrun : 0,
      toplamMaliyet
    };
  }, [urunler, customCost, customCostType]);

  // Kategori bazlı analiz - moved before early return
  const categoryAnalysis = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    
    const categories = {};
    
    urunler.forEach(urun => {
      const marka = urun['Marka'] || 'Bilinmeyen';
      const satisTutari = parseFloat(urun['Piyasa Satış Fiyatı (KDV Dahil)'] || 0);
      const adet = parseInt(urun['Ürün Stok Adedi'] || 0);
      
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
  }, [urunler]);

  // Zaman bazlı analiz - moved before early return
  const timeAnalysis = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    
    const monthlyData = {};
    
    urunler.forEach(urun => {
      const tarih = new Date(urun['Sipariş Tarihi'] || urun['Siparis Tarihi']);
      const monthKey = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`;
      const satisTutari = parseFloat(urun['Piyasa Satış Fiyatı (KDV Dahil)'] || 0);
      
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
  }, [urunler]);

  if (!urunler || urunler.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalculateIcon />
          Kar-zarar analizini görmek için önce Excel dosyası yükleyin.
        </Alert>
      </Box>
    );
  }


  const exportAnalysis = () => {
    const csvContent = [
      'Analiz Türü,Değer',
      `Toplam Piyasa Satış,${analysis.totalPiyasaSatis}`,
      `Toplam Dolar Fiyat,${analysis.totalDolarFiyat}`,
      `Toplam Stok Adedi,${analysis.totalStokAdedi}`,
      `Toplam Komisyon,${analysis.totalKomisyon}`,
      `Ek Maliyet,${analysis.ekMaliyet}`,
      `Net Gelir,${analysis.netGelir}`,
      `Kar Oranı,${analysis.karOrani}%`,
      `Toplam Ürün,${analysis.totalUrun}`,
      `Ortalama Piyasa Fiyatı,${analysis.ortalamaPiyasaFiyati}`,
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CalculateIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5">
          Kar-Zarar Analizi
        </Typography>
      </Box>

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
                ₺{analysis.totalPiyasaSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Piyasa Satış
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
                ₺{(analysis.totalKomisyon + analysis.ekMaliyet).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MoneyIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                  Maliyet Dağılımı
                </Typography>
              </Box>
              {(() => {
                const maliyetData = [
                  { name: 'Komisyon', value: analysis.totalKomisyon, color: '#9c27b0' },
                  { name: 'Ek Maliyet', value: analysis.ekMaliyet, color: '#795548' }
                ].filter(item => item.value > 0);
                
                return maliyetData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={maliyetData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={({ name, percent }) => 
                          percent > 8 ? `${name}\n${(percent * 100).toFixed(0)}%` : ''
                        }
                        outerRadius={85}
                        innerRadius={35}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={1}
                      >
                        {maliyetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, name]}
                        contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc', fontSize: '12px' }}
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
                      Maliyet verisi bulunamadı
                    </Typography>
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        {/* Aylık Trend Grafiği */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">
                  Aylık Satış Trendi
                </Typography>
              </Box>
              {timeAnalysis.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart 
                    data={timeAnalysis}
                    margin={{ top: 15, right: 25, left: 15, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="ay" 
                      fontSize={10}
                      tick={{ fill: '#666' }}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      fontSize={10}
                      tick={{ fill: '#666' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      width={35}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      fontSize={10}
                      tick={{ fill: '#666' }}
                      width={30}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        if (name === 'Satış Tutarı') {
                          return [`₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, name];
                        }
                        return [`${value} adet`, name];
                      }}
                      labelFormatter={(label) => `Ay: ${label}`}
                      contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={25}
                      iconType="line"
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="satisTutari" 
                      stroke="#1976d2" 
                      strokeWidth={2} 
                      name="Satış Tutarı"
                      dot={{ r: 3, fill: '#1976d2' }}
                      activeDot={{ r: 5, fill: '#0d47a1' }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="siparisSayisi" 
                      stroke="#388e3c" 
                      strokeWidth={2} 
                      name="Sipariş Sayısı"
                      dot={{ r: 3, fill: '#388e3c' }}
                      activeDot={{ r: 5, fill: '#1b5e20' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                  <Typography variant="body2" color="text.secondary">
                    Zaman serisi verisi bulunamadı
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Marka Bazlı Analiz */}
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6">
                Marka Bazlı Performans
              </Typography>
            </Box>
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
                        {urunler.find(u => u['Marka'] === category.marka)?.['Stok Kodu'] || 'N/A'}
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
                      {((category.satisTutari / analysis.totalPiyasaSatis) * 100).toFixed(1)}%
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CalculateIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              Kar-Zarar Özeti
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Gelir Kalemleri
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Toplam Piyasa Satış:</Typography>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    ₺{analysis.totalPiyasaSatis.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
                    -₺{(analysis.totalKomisyon + analysis.ekMaliyet).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
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
