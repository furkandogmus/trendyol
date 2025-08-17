import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Paper,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as MoneyIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const HepsiburadaDashboard = ({ urunler, siparisler }) => {
  const [dolarKuru, setDolarKuru] = useState(() => {
    const saved = localStorage.getItem('hb_dolar_kuru');
    return saved ? parseFloat(saved) : 42.0;
  });

  // Dolar kurunu localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('hb_dolar_kuru', dolarKuru.toString());
  }, [dolarKuru]);

  // Renk paletleri
  const colors = {
    primary: ['#ff6000', '#ff8f50', '#cc4d00', '#994000', '#663300'],
    secondary: ['#1976d2', '#42a5f5', '#1565c0', '#0d47a1', '#283593'],
    success: ['#2e7d32', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7'],
    warning: ['#ed6c02', '#ff9800', '#ffb74d', '#ffcc02', '#fff176']
  };

  // Temel istatistikler
  const stats = useMemo(() => {
    if (!siparisler || siparisler.length === 0) {
      return {
        toplamSiparis: 0,
        toplamGelir: 0,
        toplamUrun: 0,
        ortalamaFiyat: 0,
        toplamAdet: 0,
        kargoFirmalari: 0
      };
    }

    const toplamGelir = siparisler.reduce((sum, siparis) => {
      return sum + parseFloat(siparis['Faturalandırılacak Satış Fiyatı'] || 0);
    }, 0);

    const toplamAdet = siparisler.reduce((sum, siparis) => {
      return sum + parseInt(siparis['Adet'] || 0);
    }, 0);

    const kargoFirmalari = new Set(siparisler.map(s => s['Kargo Firması'])).size;

    return {
      toplamSiparis: siparisler.length,
      toplamGelir,
      toplamUrun: urunler.length,
      ortalamaFiyat: toplamGelir / siparisler.length || 0,
      toplamAdet,
      kargoFirmalari
    };
  }, [siparisler, urunler]);

  // Kategori analizi
  const kategoriAnalizi = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return {};
    
    const kategoriMap = {};
    siparisler.forEach(siparis => {
      const kategori = siparis['Kategori'] || 'Diğer';
      kategoriMap[kategori] = (kategoriMap[kategori] || 0) + 1;
    });
    
    return kategoriMap;
  }, [siparisler]);

  // Kategori chart data - En çok 5 kategori göster, geri kalanını "Diğer"e ekle
  const kategoriChartData = useMemo(() => {
    const entries = Object.entries(kategoriAnalizi);
    
    // Büyükten küçüğe sırala
    entries.sort((a, b) => b[1] - a[1]);
    
    let chartData = [];
    let digerToplam = 0;
    
    entries.forEach(([kategori, count], index) => {
      if (index < 5) {
        // İlk 5 kategoriyi göster
        chartData.push({
          name: kategori,
          value: count,
          fill: colors.primary[index % colors.primary.length]
        });
      } else {
        // 5'ten sonrakileri "Diğer"e ekle
        digerToplam += count;
      }
    });
    
    // Eğer 5'ten fazla kategori varsa "Diğer" ekle
    if (digerToplam > 0) {
      chartData.push({
        name: 'Diğer',
        value: digerToplam,
        fill: '#95a5a6' // Gri renk
      });
    }
    
    return chartData;
  }, [kategoriAnalizi, colors.primary]);

  // Şehir isimlerini normalize etme fonksiyonu
  const normalizeCityName = (cityName) => {
    if (!cityName || typeof cityName !== 'string') return 'Bilinmeyen';
    
    // Türkçe karakterleri dikkate alarak capitalize et
    return cityName
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        
        // İlk harfi büyük yap, Türkçe karakterlere dikkat et
        const firstChar = word.charAt(0);
        const restOfWord = word.slice(1);
        
        // Türkçe karakter dönüşümleri
        const turkishUpperCase = {
          'ı': 'I',
          'i': 'İ',
          'ş': 'Ş',
          'ğ': 'Ğ',
          'ç': 'Ç',
          'ö': 'Ö',
          'ü': 'Ü'
        };
        
        const upperFirst = turkishUpperCase[firstChar] || firstChar.toUpperCase();
        return upperFirst + restOfWord;
      })
      .join(' ');
  };

  // Şehir analizi
  const sehirAnalizi = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return {};
    
    const sehirMap = {};
    siparisler.forEach(siparis => {
      const rawSehir = siparis['Şehir'] || 'Bilinmeyen';
      const normalizedSehir = normalizeCityName(rawSehir);
      sehirMap[normalizedSehir] = (sehirMap[normalizedSehir] || 0) + 1;
    });
    
    // En çok sipariş alan 10 şehir
    const sorted = Object.entries(sehirMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return Object.fromEntries(sorted);
  }, [siparisler]);

  // Şehir chart data
  const sehirChartData = useMemo(() => {
    const entries = Object.entries(sehirAnalizi);
    return entries.map(([sehir, count], index) => ({
      sehir,
      count,
      fill: colors.secondary[index % colors.secondary.length]
    }));
  }, [sehirAnalizi, colors.secondary]);

  // Kargo firması analizi
  const kargoAnalizi = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return {};
    
    const kargoMap = {};
    siparisler.forEach(siparis => {
      const kargo = siparis['Kargo Firması'] || 'Bilinmeyen';
      kargoMap[kargo] = (kargoMap[kargo] || 0) + 1;
    });
    
    return kargoMap;
  }, [siparisler]);

  // Kargo chart data
  const kargoChartData = useMemo(() => {
    const entries = Object.entries(kargoAnalizi);
    return entries.map(([kargo, count], index) => ({
      name: kargo,
      value: count,
      fill: colors.warning[index % colors.warning.length]
    }));
  }, [kargoAnalizi, colors.warning]);

  // Sipariş durumu analizi
  const durumAnalizi = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return {};
    
    const durumMap = {};
    siparisler.forEach(siparis => {
      const durum = siparis['Paket Durumu'] || 'Bilinmeyen';
      durumMap[durum] = (durumMap[durum] || 0) + 1;
    });
    
    return durumMap;
  }, [siparisler]);

  // Durum chart data
  const durumChartData = useMemo(() => {
    const entries = Object.entries(durumAnalizi);
    return entries.map(([durum, count], index) => ({
      name: durum,
      value: count,
      fill: colors.success[index % colors.success.length]
    }));
  }, [durumAnalizi, colors.success]);

  const handleDolarKuruChange = (event) => {
    const newValue = parseFloat(event.target.value) || 0;
    setDolarKuru(newValue);
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        📊 Hepsiburada Dashboard
      </Typography>

      {/* Dolar Kuru */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              💱 Dolar Kuru Yönetimi
            </Typography>
            <TextField
              label="Dolar Kuru (₺)"
              type="number"
              value={dolarKuru}
              onChange={handleDolarKuruChange}
              inputProps={{ 
                step: 0.01, 
                min: 1,
                style: { fontSize: '1.1rem', fontWeight: 'bold' }
              }}
              sx={{ width: 200 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert severity="info" sx={{ ml: { md: 2 } }}>
              Güncel dolar kuru tüm hesaplamalarda kullanılacaktır.
            </Alert>
          </Grid>
        </Grid>
      </Paper>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={3} sx={{ bgcolor: 'primary.50', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ShoppingCartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {stats.toplamSiparis.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Sipariş
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={3} sx={{ bgcolor: 'success.50', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" color="success.main" fontWeight="bold">
                ₺{stats.toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Gelir
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={3} sx={{ bgcolor: 'info.50', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <StoreIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" color="info.main" fontWeight="bold">
                {stats.toplamUrun.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Ürün
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={3} sx={{ bgcolor: 'warning.50', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                ₺{stats.ortalamaFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ortalama Fiyat
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={3} sx={{ bgcolor: 'secondary.50', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocalShippingIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h5" color="secondary.main" fontWeight="bold">
                {stats.toplamAdet.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Adet
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={3} sx={{ bgcolor: 'error.50', height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocationIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h5" color="error.main" fontWeight="bold">
                {stats.kargoFirmalari}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kargo Firması
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Grid container spacing={3}>
        {/* Kategori Dağılımı */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📂 Kategori Dağılımı
              </Typography>
              {kategoriChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={kategoriChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {kategoriChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const total = kategoriChartData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return [
                          `${value} sipariş (%${percentage})`, 
                          name
                        ];
                      }}
                      labelFormatter={() => ''}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => `${value} (${entry.payload.value})`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">Henüz kategori verisi bulunmuyor.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sipariş Durumu */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📦 Sipariş Durumu
              </Typography>
              {durumChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={durumChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {durumChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} sipariş`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">Henüz durum verisi bulunmuyor.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* En Çok Sipariş Alan Şehirler */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏙️ En Çok Sipariş Alan Şehirler
              </Typography>
              {sehirChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sehirChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="sehir" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} sipariş`, 'Sipariş Sayısı']} />
                    <Bar dataKey="count" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">Henüz şehir verisi bulunmuyor.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Kargo Firması Dağılımı */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚚 Kargo Firması Dağılımı
              </Typography>
              {kargoChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={kargoChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {kargoChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">Henüz kargo verisi bulunmuyor.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Veri durumu bilgisi */}
      {(siparisler.length === 0 && urunler.length === 0) && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          📊 Dashboard verilerini görmek için lütfen Ürün Kataloğu ve Sipariş Yönetimi sekmelerinden Excel/CSV dosyalarınızı yükleyin.
        </Alert>
      )}
    </Box>
  );
};

export default HepsiburadaDashboard;
