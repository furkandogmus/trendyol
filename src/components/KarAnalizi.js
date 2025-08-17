import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const KarAnalizi = ({ urunler, siparisler }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedStockCode, setSelectedStockCode] = useState('');
  const [dolarKuru, setDolarKuru] = useState(30.0);

  // localStorage'dan dolar kurunu yükle ve değişiklikleri dinle
  useEffect(() => {
    const loadDolarKuru = () => {
      const savedDolarKuru = localStorage.getItem('dolarKuru');
      if (savedDolarKuru) {
        setDolarKuru(parseFloat(savedDolarKuru));
      }
    };

    // İlk yükleme
    loadDolarKuru();

    // localStorage değişikliklerini dinle
    const handleStorageChange = (e) => {
      if (e.key === 'dolarKuru') {
        setDolarKuru(parseFloat(e.newValue) || 30.0);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Aynı tab içindeki değişiklikleri dinlemek için interval kullan
    const interval = setInterval(loadDolarKuru, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Kargo baremi hesaplama fonksiyonu
  const calculateCargoFee = (faturalanacakTutar) => {
    const tutar = parseFloat(faturalanacakTutar || 0);
    if (tutar < 149.99) return 32.49;
    if (tutar < 299.99) return 62.00;
    return 75.00;
  };



  // Sipariş numarası bazında gruplandırılmış veriler
  const groupedOrders = useMemo(() => {
    if (!siparisler || !urunler || siparisler.length === 0 || urunler.length === 0) return [];

    // Önce sipariş numarasına göre grupla
    const orderGroups = {};
    
    siparisler.forEach(siparis => {
      const orderNumber = siparis['Sipariş Numarası'] || siparis['Paket No'] || 'UNKNOWN';
      if (!orderGroups[orderNumber]) {
        orderGroups[orderNumber] = [];
      }
      orderGroups[orderNumber].push(siparis);
    });

    // Her sipariş grubu için hesaplamaları yap
    return Object.entries(orderGroups).map(([orderNumber, orderItems]) => {
      // Toplam faturalanacak tutar (sipariş bazında)
      const totalFaturalanacak = orderItems.reduce((sum, item) => 
        sum + parseFloat(item['Faturalanacak Tutar'] || 0), 0);
      
      // Kargo ücreti (sipariş başına bir kez)
      const kargoUcreti = calculateCargoFee(totalFaturalanacak);
      
      // Hizmet bedeli (sipariş başına sabit)
      const hizmetBedeli = 8.38;
      
      // Sarf bedeli hesaplama (sipariş seviyesinde - herhangi bir üründe magicbox/cam varsa 10₺, yoksa 7.5₺)
      const hasMagicboxOrCam = orderItems.some(item => {
        const stockCode = String(item['Stok Kodu'] || '').toLowerCase();
        return stockCode.includes('magicbox') || stockCode.includes('cam');
      });
      const siparisKatSarf = hasMagicboxOrCam ? 10.0 : 7.5;
      
      // Her ürün için detayları hesapla
      const enrichedItems = orderItems.map(siparis => {
        const urun = urunler.find(u => u['Tedarikçi Stok Kodu'] === siparis['Stok Kodu']);
        
        const faturalanacakTutar = parseFloat(siparis['Faturalanacak Tutar'] || 0);
        const komisyonOrani = parseFloat(siparis['Komisyon Oranı'] || urun?.['Komisyon Oranı'] || 0);
        const komisyonTutari = faturalanacakTutar * (komisyonOrani / 100);
        
        // Maliyet hesaplama (Dolar fiyatı × dolar kuru × adet)
        const dolarFiyati = parseFloat(urun?.['Dolar Fiyatı'] || 0);
        const adet = parseInt(siparis['Adet'] || 1);
        const maliyet = dolarFiyati * dolarKuru * adet;
        
        // Sarf bedeli (sipariş seviyesinde belirlenen değer)
        const sarfBedeliBirim = siparisKatSarf;
        const sarfBedeli = 0; // Sipariş seviyesinde hesaplanacak, ürün seviyesinde 0
        
        return {
          ...siparis,
          urun,
          adet,
          komisyonTutari,
          maliyet,
          sarfBedeliBirim,
          sarfBedeli,
          hasUrunMatch: !!urun
        };
      });

      // Sipariş toplam maliyetleri ve adet
      const totalMaliyet = enrichedItems.reduce((sum, item) => sum + item.maliyet, 0);
      const totalKomisyon = enrichedItems.reduce((sum, item) => sum + item.komisyonTutari, 0);
      const totalSarf = siparisKatSarf; // Sipariş başına tek sarf bedeli
      const totalAdet = enrichedItems.reduce((sum, item) => sum + item.adet, 0);
      
      // Stopaj hesaplama (faturalandırılacak tutar / 1.2 * 1/100)
      const stopajTutari = (totalFaturalanacak / 1.2) * 0.01;
      
      // Net kar hesaplama (stopaj dahil)
      const totalCosts = totalMaliyet + totalKomisyon + kargoUcreti + hizmetBedeli + totalSarf + stopajTutari;
      const netKar = totalFaturalanacak - totalCosts;
      const karMarji = totalFaturalanacak > 0 ? (netKar / totalFaturalanacak) * 100 : 0;
      
      return {
        orderNumber,
        items: enrichedItems,
        totalFaturalanacak,
        totalMaliyet,
        totalKomisyon,
        kargoUcreti,
        hizmetBedeli,
        totalSarf,
        stopajTutari,
        totalAdet,
        totalCosts,
        netKar,
        karMarji,
        itemCount: orderItems.length,
        hasAllUrunMatch: enrichedItems.every(item => item.hasUrunMatch)
      };
    });
  }, [siparisler, urunler, dolarKuru]);

  // Düz liste için enriched siparişler (eski yapıyla uyumluluk için)
  const enrichedSiparisler = useMemo(() => {
    return groupedOrders.flatMap(order => 
      order.items.map(item => ({
        ...item,
        // Sipariş seviyesi maliyetleri ürün sayısına böl
        orderKargoUcreti: order.kargoUcreti / order.itemCount,
        orderHizmetBedeli: order.hizmetBedeli / order.itemCount,
        orderNetKar: order.netKar / order.itemCount,
        orderKarMarji: order.karMarji,
        // Sipariş bilgileri
        orderNumber: order.orderNumber,
        orderTotalFaturalanacak: order.totalFaturalanacak
      }))
    );
  }, [groupedOrders]);



  // Stok kodu seçenekleri
  const stockCodeOptions = useMemo(() => {
    const codes = [...new Set(enrichedSiparisler.map(item => item['Stok Kodu']).filter(Boolean))];
    return codes.sort();
  }, [enrichedSiparisler]);

  // Sipariş bazlı filtrelenmiş veriler
  const filteredOrders = useMemo(() => {
    let filtered = groupedOrders;

    if (selectedFilter === 'profitable') {
      filtered = filtered.filter(order => order.netKar > 0);
    } else if (selectedFilter === 'loss') {
      filtered = filtered.filter(order => order.netKar < 0);
    } else if (selectedFilter === 'matched') {
      filtered = filtered.filter(order => order.hasAllUrunMatch);
    } else if (selectedFilter === 'unmatched') {
      filtered = filtered.filter(order => !order.hasAllUrunMatch);
    }

    if (selectedStockCode) {
      filtered = filtered.filter(order => 
        order.items.some(item => item['Stok Kodu'] === selectedStockCode)
      );
    }

    return filtered;
  }, [groupedOrders, selectedFilter, selectedStockCode]);

  // Genel istatistikler (sipariş bazında)
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalFaturalanacak, 0);
    const totalCost = filteredOrders.reduce((sum, order) => sum + order.totalMaliyet, 0);
    const totalCargoFee = filteredOrders.reduce((sum, order) => sum + order.kargoUcreti, 0);
    const totalCommission = filteredOrders.reduce((sum, order) => sum + order.totalKomisyon, 0);
    const totalServiceFee = filteredOrders.reduce((sum, order) => sum + order.hizmetBedeli, 0);
    const totalSarfFee = filteredOrders.reduce((sum, order) => sum + order.totalSarf, 0);
    const totalStopaj = filteredOrders.reduce((sum, order) => sum + order.stopajTutari, 0);
    const totalProfit = filteredOrders.reduce((sum, order) => sum + order.netKar, 0);
    const totalQuantity = filteredOrders.reduce((sum, order) => sum + order.totalAdet, 0);
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    const profitableOrders = filteredOrders.filter(order => order.netKar > 0).length;
    const matchedOrders = filteredOrders.filter(order => order.hasAllUrunMatch).length;

    return {
      totalRevenue,
      totalCost,
      totalCargoFee,
      totalCommission,
      totalServiceFee,
      totalSarfFee,
      totalStopaj,
      totalProfit,
      totalQuantity,
      averageOrderValue,
      profitableOrders,
      matchedOrders,
      totalOrders: filteredOrders.length,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  }, [filteredOrders]);

  // Kargo dağılımı için veri (sipariş bazında)
  const cargoDistribution = useMemo(() => {
    const distribution = { low: 0, medium: 0, high: 0 };
    filteredOrders.forEach(order => {
      const tutar = order.totalFaturalanacak;
      if (tutar < 149.99) distribution.low++;
      else if (tutar < 299.99) distribution.medium++;
      else distribution.high++;
    });

    return [
      { name: '0-149.99₺ (32.49₺ kargo)', value: distribution.low, color: '#ff7300' },
      { name: '150-299.99₺ (62₺ kargo)', value: distribution.medium, color: '#00C49F' },
      { name: '300₺+ (75₺ kargo)', value: distribution.high, color: '#0088FE' }
    ];
  }, [filteredOrders]);

  // En karlı ürünler (stok kodu bazında)
  const topProfitableProducts = useMemo(() => {
    const productStats = {};
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const stockCode = item['Stok Kodu'];
        if (!stockCode || !item.hasUrunMatch) return;

        if (!productStats[stockCode]) {
          productStats[stockCode] = {
            stockCode,
            productName: item['Ürün Adı'] || 'Bilinmeyen',
            totalProfit: 0,
            totalRevenue: 0,
            orderCount: 0,
            averageProfit: 0
          };
        }

        // Ürünün siparişteki oransal karı (toplam kar / ürün sayısı)
        const itemProfit = order.netKar * (parseFloat(item['Faturalanacak Tutar'] || 0) / order.totalFaturalanacak);
        
        productStats[stockCode].totalProfit += itemProfit;
        productStats[stockCode].totalRevenue += parseFloat(item['Faturalanacak Tutar'] || 0);
        productStats[stockCode].orderCount++;
      });
    });

    return Object.values(productStats)
      .map(product => ({
        ...product,
        averageProfit: product.orderCount > 0 ? product.totalProfit / product.orderCount : 0
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);
  }, [filteredOrders]);

  const exportToCSV = () => {
    // Sipariş bazlı CSV
    const orderCsvData = filteredOrders.map(order => ({
      'Sipariş No': order.orderNumber,
      'Toplam Gelir': order.totalFaturalanacak.toFixed(2),
      'Toplam Maliyet': order.totalMaliyet.toFixed(2),
      'Kargo Ücreti': order.kargoUcreti.toFixed(2),
      'Hizmet Bedeli': order.hizmetBedeli.toFixed(2),
      'Sarf Bedeli Toplam': order.totalSarf.toFixed(2),
      'Stopaj': order.stopajTutari.toFixed(2),
      'Komisyon': order.totalKomisyon.toFixed(2),
      'Net Kar': order.netKar.toFixed(2),
      'Kar Marjı (%)': order.karMarji.toFixed(2),
      'Toplam Adet': order.totalAdet,
      'Ürün Türü Sayısı': order.itemCount,
      'Tüm Ürünler Eşleşti': order.hasAllUrunMatch ? 'Evet' : 'Hayır'
    }));

    // Ürün bazlı CSV
    const productCsvData = [];
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        productCsvData.push({
          'Sipariş No': order.orderNumber,
          'Stok Kodu': item['Stok Kodu'] || 'N/A',
          'Ürün Adı': item['Ürün Adı'] || 'N/A',
          'Adet': item.adet,
          'Birim Gelir': parseFloat(item['Faturalanacak Tutar'] || 0).toFixed(2),
          'Birim Maliyet': (item.maliyet / item.adet).toFixed(2),
          'Sipariş Sarf Bedeli': item.sarfBedeliBirim.toFixed(2),
          'Magicbox/Cam Sipariş': item.sarfBedeliBirim === 10 ? 'Evet' : 'Hayır',
          'Komisyon': item.komisyonTutari.toFixed(2),
          'Ürün Eşleşti': item.hasUrunMatch ? 'Evet' : 'Hayır'
        });
      });
    });

    // Sipariş bazlı CSV oluştur
    const orderCsvContent = [
      Object.keys(orderCsvData[0] || {}).join(','),
      ...orderCsvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Ürün bazlı CSV oluştur
    const productCsvContent = [
      Object.keys(productCsvData[0] || {}).join(','),
      ...productCsvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Sipariş bazlı CSV indir
    const orderBlob = new Blob([orderCsvContent], { type: 'text/csv;charset=utf-8;' });
    const orderLink = document.createElement('a');
    const orderUrl = URL.createObjectURL(orderBlob);
    orderLink.setAttribute('href', orderUrl);
    orderLink.setAttribute('download', `kar_analizi_siparis_bazli_${new Date().toISOString().split('T')[0]}.csv`);
    orderLink.style.visibility = 'hidden';
    document.body.appendChild(orderLink);
    orderLink.click();
    document.body.removeChild(orderLink);

    // Kısa bir gecikme ile ürün bazlı CSV indir
    setTimeout(() => {
      const productBlob = new Blob([productCsvContent], { type: 'text/csv;charset=utf-8;' });
      const productLink = document.createElement('a');
      const productUrl = URL.createObjectURL(productBlob);
      productLink.setAttribute('href', productUrl);
      productLink.setAttribute('download', `kar_analizi_urun_bazli_${new Date().toISOString().split('T')[0]}.csv`);
      productLink.style.visibility = 'hidden';
      document.body.appendChild(productLink);
      productLink.click();
      document.body.removeChild(productLink);
    }, 500);
  };

  if (!enrichedSiparisler || enrichedSiparisler.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AssessmentIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5">Kar Analizi</Typography>
        </Box>
        <Alert severity="info">
          Kar analizi için hem ürün hem de sipariş verisi gereklidir. Lütfen önce her iki tabloyu da doldurun.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AssessmentIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5">Kar Analizi</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportToCSV}
          sx={{ ml: 'auto' }}
        >
          CSV İndir (Sipariş + Ürün)
        </Button>
      </Box>

      {/* Filtreler */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filtre</InputLabel>
              <Select
                value={selectedFilter}
                label="Filtre"
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <MenuItem value="all">Tüm Siparişler</MenuItem>
                <MenuItem value="profitable">Karlı Siparişler</MenuItem>
                <MenuItem value="loss">Zararlı Siparişler</MenuItem>
                <MenuItem value="matched">Ürün Eşleşen</MenuItem>
                <MenuItem value="unmatched">Ürün Eşleşmeyen</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Stok Kodu</InputLabel>
              <Select
                value={selectedStockCode}
                label="Stok Kodu"
                onChange={(e) => setSelectedStockCode(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {stockCodeOptions.map(code => (
                  <MenuItem key={code} value={code}>{code}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Özet Kartları */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <MoneyIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" color="success.main">
                ₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Gelir
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: stats.totalProfit >= 0 ? 'success.main' : 'error.main', mb: 1 }} />
              <Typography variant="h6" color={stats.totalProfit >= 0 ? 'success.main' : 'error.main'}>
                ₺{stats.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Net Kar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <InventoryIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" color="primary.main">
                {stats.totalQuantity.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Adet
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ShippingIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" color="warning.main">
                ₺{stats.totalCargoFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kargo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AssessmentIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" color="info.main">
                ₺{stats.totalServiceFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hizmet Bedeli
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <MoneyIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" color="secondary.main">
                ₺{stats.totalSarfFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sarf Bedeli
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              <Typography variant="h6" color="error.main">
                ₺{stats.totalStopaj.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stopaj
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={1.5}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" color="primary.main">
                {stats.matchedOrders}/{stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sipariş Eşleşme
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafik ve Tablolar */}
      <Grid container spacing={3}>
        {/* Kargo Dağılımı */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Kargo Ücreti Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cargoDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${value} sipariş`}
                >
                  {cargoDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* En Karlı Ürünler */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              En Karlı Ürünler (Stok Kodu Bazında)
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Stok Kodu</TableCell>
                    <TableCell align="right">Toplam Kar</TableCell>
                    <TableCell align="right">Sipariş</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProfitableProducts.map((product, index) => (
                    <TableRow key={product.stockCode}>
                      <TableCell>
                        <Tooltip title={product.productName}>
                          <Chip
                            label={product.stockCode}
                            size="small"
                            color={index < 3 ? 'success' : 'default'}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={product.totalProfit >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          ₺{product.totalProfit.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{product.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detaylı Sipariş Analizi Tablosu */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Detaylı Sipariş Kar Analizi
        </Typography>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Sipariş No</TableCell>
                <TableCell align="right">Gelir</TableCell>
                <TableCell align="right">Maliyet</TableCell>
                <TableCell align="right">Kargo</TableCell>
                <TableCell align="right">Hizmet</TableCell>
                <TableCell align="right">Sarf</TableCell>
                <TableCell align="right">Stopaj</TableCell>
                <TableCell align="right">Komisyon</TableCell>
                <TableCell align="right">Net Kar</TableCell>
                <TableCell align="right">Kar Marjı</TableCell>
                <TableCell align="center">Toplam Adet</TableCell>
                <TableCell align="center">Ürün Türü</TableCell>
                <TableCell align="center">Durum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.slice(0, 50).map((order, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Chip
                      label={order.orderNumber}
                      size="small"
                      color={order.hasAllUrunMatch ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    ₺{order.totalFaturalanacak.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ₺{order.totalMaliyet.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ₺{order.kargoUcreti.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ₺{order.hizmetBedeli.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ₺{order.totalSarf.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ₺{order.stopajTutari.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    ₺{order.totalKomisyon.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={order.netKar >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      ₺{order.netKar.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={order.karMarji >= 0 ? 'success.main' : 'error.main'}
                    >
                      %{order.karMarji.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={order.totalAdet}
                      size="small"
                      color="warning"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${order.itemCount} tür`}
                      size="small"
                      color="info"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {order.hasAllUrunMatch ? (
                      <Chip label="Tam Eşleşme" color="success" size="small" />
                    ) : (
                      <Chip label="Eksik Eşleşme" color="error" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredOrders.length > 50 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            İlk 50 sipariş gösteriliyor. Toplam {filteredOrders.length} sipariş var.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default KarAnalizi;
