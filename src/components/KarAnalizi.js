import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Button
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
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
import * as XLSX from 'xlsx';

const KarAnalizi = ({ urunler, siparisler }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedStockCode, setSelectedStockCode] = useState('');
  const [dolarKuru, setDolarKuru] = useState(42.0);
  
  // localStorage'dan direkt veri okuma
  const [localUrunler, setLocalUrunler] = useState([]);
  const [localSiparisler, setLocalSiparisler] = useState([]);

  // localStorage'dan urunler ve siparisler verilerini yükle
  useEffect(() => {
    const loadDataFromStorage = () => {
      try {
        const savedUrunler = localStorage.getItem('urunler');
        const savedSiparisler = localStorage.getItem('siparisler');
        
        if (savedUrunler) {
          const parsedUrunler = JSON.parse(savedUrunler);
          setLocalUrunler(Array.isArray(parsedUrunler) ? parsedUrunler : []);
        }
        
        if (savedSiparisler) {
          const parsedSiparisler = JSON.parse(savedSiparisler);
          setLocalSiparisler(Array.isArray(parsedSiparisler) ? parsedSiparisler : []);
        }
      } catch (error) {
        console.error('localStorage verisi okunurken hata:', error);
        setLocalUrunler([]);
        setLocalSiparisler([]);
      }
    };

    // İlk yükleme
    loadDataFromStorage();

    // localStorage değişikliklerini dinle (diğer sekmelerde değişiklik olursa)
    const handleStorageChange = (e) => {
      if (e.key === 'urunler' || e.key === 'siparisler') {
        loadDataFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Aynı tab içindeki değişiklikleri dinlemek için interval
    const interval = setInterval(loadDataFromStorage, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
        setDolarKuru(parseFloat(e.newValue) || 42.0);
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

  // Effective veri - localStorage öncelikli, props fallback
  const effectiveUrunler = useMemo(() => {
    return localUrunler.length > 0 ? localUrunler : (urunler || []);
  }, [localUrunler, urunler]);

  const effectiveSiparisler = useMemo(() => {
    return localSiparisler.length > 0 ? localSiparisler : (siparisler || []);
  }, [localSiparisler, siparisler]);

  // Kargo baremi hesaplama fonksiyonu
  const calculateCargoFee = (faturalanacakTutar) => {
    const tutar = parseFloat(faturalanacakTutar || 0);
    if (tutar < 149.99) return 32.49;
    if (tutar < 299.99) return 62.00;
    return 75.00;
  };



  // Sipariş numarası bazında gruplandırılmış veriler
  const groupedOrders = useMemo(() => {
    if (!effectiveSiparisler || !effectiveUrunler || effectiveSiparisler.length === 0 || effectiveUrunler.length === 0) return [];

    // Önce sipariş numarasına göre grupla
    const orderGroups = {};
    
    effectiveSiparisler.forEach(siparis => {
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
        const urun = effectiveUrunler.find(u => u['Tedarikçi Stok Kodu'] === siparis['Stok Kodu']);
        
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
  }, [effectiveSiparisler, effectiveUrunler, dolarKuru]);

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
      .sort((a, b) => {
        // Özel sıralama: Filtreye göre uygun sıralama
        if (a.totalProfit >= 0 && b.totalProfit >= 0) {
          return b.totalProfit - a.totalProfit; // Karlı ürünler: büyükten küçüğe
        }
        if (a.totalProfit < 0 && b.totalProfit < 0) {
          return a.totalProfit - b.totalProfit; // Zararlı ürünler: en çok zarar üstte
        }
        return b.totalProfit - a.totalProfit; // Karışık: kar üstte
      })
      .slice(0, 10);
  }, [filteredOrders]);

  const exportToExcel = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      alert('Dışa aktarılacak veri bulunamadı!');
      return;
    }



    // Sipariş bazlı veri
    const orderData = filteredOrders.map(order => ({
      'Sipariş No': order.orderNumber,
      'Toplam Gelir (₺)': order.totalFaturalanacak.toFixed(2),
      'Toplam Maliyet (₺)': order.totalMaliyet.toFixed(2),
      'Kargo Ücreti (₺)': order.kargoUcreti.toFixed(2),
      'Hizmet Bedeli (₺)': order.hizmetBedeli.toFixed(2),
      'Sarf Bedeli (₺)': order.totalSarf.toFixed(2),
      'Stopaj (₺)': order.stopajTutari.toFixed(2),
      'Komisyon (₺)': order.totalKomisyon.toFixed(2),
      'Net Kar (₺)': order.netKar.toFixed(2),
      'Kar Marjı (%)': order.karMarji.toFixed(2),
      'Toplam Adet': order.totalAdet,
      'Ürün Türü Sayısı': order.itemCount,
      'Tüm Ürünler Eşleşti': order.hasAllUrunMatch ? 'Evet' : 'Hayır',
      'Güncel Dolar Kuru': dolarKuru.toFixed(2),
      'Analiz Tarihi': new Date().toLocaleString('tr-TR')
    }));

    // Ürün bazlı veri
    const productData = [];
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        productData.push({
          'Sipariş No': order.orderNumber,
          'Stok Kodu': item['Stok Kodu'] || 'N/A',
          'Ürün Adı': item['Ürün Adı'] || 'N/A',
          'Adet': item.adet,
          'Birim Gelir (₺)': parseFloat(item['Faturalanacak Tutar'] || 0).toFixed(2),
          'Birim Maliyet (₺)': (item.maliyet / item.adet).toFixed(2),
          'Sipariş Sarf Bedeli (₺)': item.sarfBedeliBirim.toFixed(2),
          'Magicbox/Cam Sipariş': item.sarfBedeliBirim === 10 ? 'Evet' : 'Hayır',
          'Komisyon (₺)': item.komisyonTutari.toFixed(2),
          'Ürün Eşleşti': item.hasUrunMatch ? 'Evet' : 'Hayır',
          'Dolar Fiyatı': item.urun ? parseFloat(item.urun['Dolar Fiyatı'] || 0).toFixed(2) : 'N/A',
          'Analiz Tarihi': new Date().toLocaleString('tr-TR')
        });
      });
    });

    // Özet veri
    const summaryData = [{
      'Metrik': 'Toplam Gelir',
      'Değer (₺)': stats.totalRevenue.toFixed(2),
      'Açıklama': 'Tüm siparişlerin toplam faturalanacak tutarı'
    }, {
      'Metrik': 'Toplam Maliyet',
      'Değer (₺)': stats.totalCost.toFixed(2),
      'Açıklama': 'Ürün maliyeti + komisyon + kargo + hizmet + sarf + stopaj'
    }, {
      'Metrik': 'Net Kar',
      'Değer (₺)': stats.totalProfit.toFixed(2),
      'Açıklama': 'Toplam gelir - toplam maliyet'
    }, {
      'Metrik': 'Kar Marjı',
      'Değer (₺)': stats.profitMargin.toFixed(2) + '%',
      'Açıklama': 'Net kar / toplam gelir * 100'
    }, {
      'Metrik': 'Toplam Sipariş',
      'Değer (₺)': stats.totalOrders.toString(),
      'Açıklama': 'Analiz edilen toplam sipariş sayısı'
    }, {
      'Metrik': 'Karlı Sipariş',
      'Değer (₺)': stats.profitableOrders.toString(),
      'Açıklama': 'Pozitif kar marjına sahip siparişler'
    }];

    // Excel workbook oluştur
    const wb = XLSX.utils.book_new();

    // Sipariş sayfası
    const orderWs = XLSX.utils.json_to_sheet(orderData);
    orderWs['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, orderWs, 'Sipariş Analizi');

    // Ürün sayfası
    const productWs = XLSX.utils.json_to_sheet(productData);
    productWs['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 8 }, { wch: 12 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, productWs, 'Ürün Detayları');

    // Özet sayfası
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 50 }
    ];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Özet');

    // Dosyayı indir
    const fileName = `kar_analizi_detayli_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
          onClick={exportToExcel}
          sx={{ ml: 'auto' }}
        >
          Excel İndir (Detaylı Analiz)
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

      {/* Toplam Maliyet Özeti */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          Toplam Maliyet Analizi
        </Typography>
        
        <Grid container spacing={2}>

            {/* Toplam Adet */}
            <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <InventoryIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" color="primary.main">
                {stats.totalQuantity.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Adet
              </Typography>
            </Box>
          </Grid>

          {/* Gelir */}
          <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" color="success.main">
                ₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Gelir
              </Typography>
            </Box>
          </Grid>

            {/* Net Kar */}
            <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              bgcolor: stats.totalProfit >= 0 ? 'success.100' : 'error.100', 
              borderRadius: 1,
              border: 2,
              borderColor: stats.totalProfit >= 0 ? 'success.main' : 'error.main'
            }}>
              {stats.totalProfit >= 0 ? 
                <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} /> :
                <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              }
              <Typography variant="h6" color={stats.totalProfit >= 0 ? 'success.main' : 'error.main'}>
                ₺{Math.abs(stats.totalProfit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Net {stats.totalProfit >= 0 ? 'Kar' : 'Zarar'}
              </Typography>
            </Box>
          </Grid>

          {/* Ürün Maliyeti */}
          <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
              <InventoryIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" color="warning.main">
                ₺{stats.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ürün Maliyeti
              </Typography>
            </Box>
          </Grid>

          {/* Komisyon */}
          <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
              <MoneyIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" color="info.main">
                ₺{stats.totalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Komisyon
              </Typography>
            </Box>
          </Grid>

          {/* Kargo */}
          <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.50', borderRadius: 1 }}>
              <ShippingIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h6" color="secondary.main">
                ₺{stats.totalCargoFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kargo
              </Typography>
            </Box>
          </Grid>

          {/* Diğer Giderler */}
          <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <AssessmentIcon sx={{ fontSize: 32, color: 'grey.700', mb: 1 }} />
              <Typography variant="h6" color="grey.700">
                ₺{(stats.totalServiceFee + stats.totalSarfFee + stats.totalStopaj).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Diğer Giderler
              </Typography>
            </Box>
          </Grid>

          {/* Sipariş Eşleşme */}
          <Grid item xs={6} sm={4} md={1.5}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
              <AssessmentIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" color="info.main">
                {stats.matchedOrders}/{stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sipariş Eşleşme
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Alt Satır - Detaylı Gider Dağılımı */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Diğer Giderler:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                <strong>Hizmet Bedeli:</strong> ₺{stats.totalServiceFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                <strong>Sarf Bedeli:</strong> ₺{stats.totalSarfFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                <strong>Stopaj:</strong> ₺{stats.totalStopaj.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2">
                <strong>Kar Marjı:</strong> %{stats.profitMargin.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      

      {/* Grafik ve Tablolar */}
      <Grid container spacing={3}>
        {/* Kargo Dağılımı */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Kargo Ücreti Dağılımı
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={cargoDistribution}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  label={false}
                  labelLine={false}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {cargoDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value, name, props) => [
                    `${value} sipariş (${((value / cargoDistribution.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`,
                    'Adet'
                  ]}
                  labelFormatter={(label) => `Kargo Ücreti: ${label}`}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ccc', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={40}
                  iconType="circle"
                  wrapperStyle={{ 
                    fontSize: '12px', 
                    paddingTop: '15px',
                    fontWeight: '500'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* En Karlı Ürünler */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedFilter === 'loss' ? 'En Zararlı Ürünler' : 
               selectedFilter === 'profitable' ? 'En Karlı Ürünler' :
               'En Karlı/Zararlı Ürünler'} (Stok Kodu Bazında)
            </Typography>
            <div style={{ height: 350, width: '100%' }}>
              <DataGrid
                rows={topProfitableProducts.map((product, index) => ({
                  id: product.stockCode,
                  stokKodu: product.stockCode,
                  urunAdi: product.productName,
                  toplamKar: product.totalProfit,
                  siparisAdedi: product.orderCount,
                  siraNo: index + 1
                }))}
                columns={[
                  {
                    field: 'siraNo',
                    headerName: '#',
                    width: 60,
                    renderCell: (params) => (
                      <Chip
                        label={params.value}
                        size="small"
                        color={params.value <= 3 ? 'success' : 'default'}
                      />
                    )
                  },
                  {
                    field: 'stokKodu',
                    headerName: 'Stok Kodu',
                    width: 180,
                    renderCell: (params) => (
                      <Tooltip title={params.row.urunAdi}>
                        <Chip
                          label={params.value}
                          size="small"
                          color={params.row.siraNo <= 3 ? 'success' : 'default'}
                        />
                      </Tooltip>
                    )
                  },
                  {
                    field: 'toplamKar',
                    headerName: 'Toplam Kar',
                    width: 140,
                    type: 'number',
                    sortComparator: (v1, v2) => {
                      // Aynı sıralama mantığı: en karlıdan en zararlıya
                      if (v1 >= 0 && v2 >= 0) return v2 - v1; // Karlı ürünler büyükten küçüğe
                      if (v1 < 0 && v2 < 0) return v1 - v2;   // Zararlı ürünler en çok zarar üstte
                      return v2 - v1; // Karışık durumda normal descending
                    },
                    renderCell: (params) => (
                      <Typography
                        variant="body2"
                        color={params.value >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        ₺{params.value.toFixed(2)}
                      </Typography>
                    )
                  },
                  {
                    field: 'siparisAdedi',
                    headerName: 'Sipariş Adedi',
                    width: 120,
                    type: 'number'
                  }
                ]}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 },
                  },
                  sorting: {
                    sortModel: [{ field: 'toplamKar', sort: 'desc' }],
                  },
                }}
                pageSizeOptions={[10, 25]}
                disableSelectionOnClick
                hideFooter={topProfitableProducts.length <= 10}
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                  },
                }}
              />
            </div>
          </Paper>
        </Grid>
      </Grid>

      {/* Detaylı Sipariş Analizi Tablosu */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Detaylı Sipariş Kar Analizi
        </Typography>
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredOrders.map((order, index) => ({
              id: `${order.orderNumber}_${index}`,
              siparisNo: order.orderNumber,
              gelir: order.totalFaturalanacak,
              maliyet: order.totalMaliyet,
              kargo: order.kargoUcreti,
              hizmet: order.hizmetBedeli,
              sarf: order.totalSarf,
              stopaj: order.stopajTutari,
              komisyon: order.totalKomisyon,
              netKar: order.netKar,
              karMarji: order.karMarji,
              toplamAdet: order.totalAdet,
              urunTuru: order.itemCount,
              durum: order.hasAllUrunMatch,
              ...order
            }))}
            columns={[
              {
                field: 'siparisNo',
                headerName: 'Sipariş No',
                width: 150,
                renderCell: (params) => (
                  <Chip
                    label={params.value}
                    size="small"
                    color={params.row.durum ? 'primary' : 'default'}
                  />
                )
              },
              {
                field: 'gelir',
                headerName: 'Gelir',
                width: 120,
                type: 'number',
                renderCell: (params) => `₺${params.value.toFixed(2)}`
              },
              {
                field: 'maliyet',
                headerName: 'Maliyet',
                width: 120,
                type: 'number',
                renderCell: (params) => `₺${params.value.toFixed(2)}`
              },
              {
                field: 'kargo',
                headerName: 'Kargo',
                width: 100,
                type: 'number',
                renderCell: (params) => `₺${params.value.toFixed(2)}`
              },
              {
                field: 'hizmet',
                headerName: 'Hizmet',
                width: 100,
                type: 'number',
                renderCell: (params) => `₺${params.value.toFixed(2)}`
              },
              {
                field: 'sarf',
                headerName: 'Sarf',
                width: 100,
                type: 'number',
                renderCell: (params) => `₺${params.value.toFixed(2)}`
              },
              {
                field: 'stopaj',
                headerName: 'Stopaj',
                width: 100,
                type: 'number',
                renderCell: (params) => `₺${params.value.toFixed(2)}`
              },
              {
                field: 'komisyon',
                headerName: 'Komisyon',
                width: 120,
                type: 'number',
                renderCell: (params) => `₺${params.value.toFixed(2)}`
              },
              {
                field: 'netKar',
                headerName: 'Net Kar',
                width: 120,
                type: 'number',
                renderCell: (params) => (
                  <Typography
                    variant="body2"
                    color={params.value >= 0 ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    ₺{params.value.toFixed(2)}
                  </Typography>
                )
              },
              {
                field: 'karMarji',
                headerName: 'Kar Marjı',
                width: 120,
                type: 'number',
                renderCell: (params) => (
                  <Typography
                    variant="body2"
                    color={params.value >= 0 ? 'success.main' : 'error.main'}
                  >
                    %{params.value.toFixed(1)}
                  </Typography>
                )
              },
              {
                field: 'toplamAdet',
                headerName: 'Toplam Adet',
                width: 120,
                type: 'number',
                renderCell: (params) => (
                  <Chip
                    label={params.value}
                    size="small"
                    color="warning"
                    variant="filled"
                  />
                )
              },
              {
                field: 'urunTuru',
                headerName: 'Ürün Türü',
                width: 120,
                renderCell: (params) => (
                  <Chip
                    label={`${params.value} tür`}
                    size="small"
                    color="info"
                  />
                )
              },
              {
                field: 'durum',
                headerName: 'Durum',
                width: 140,
                renderCell: (params) => (
                  params.value ? (
                    <Chip label="Tam Eşleşme" color="success" size="small" />
                  ) : (
                    <Chip label="Eksik Eşleşme" color="error" size="small" />
                  )
                )
              }
            ]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
              sorting: {
                sortModel: [{ field: 'netKar', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            disableSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e0e0e0',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
              },
            }}
          />
        </div>
      </Paper>
    </Box>
  );
};

export default KarAnalizi;
