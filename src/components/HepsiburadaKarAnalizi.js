import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Grid,
  Paper,
  Chip,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

// Detaylı Kar Hesaplama Algoritması
const hesaplaKargoBedeli = (siparistutar) => {
  if (siparistutar < 150) return 38.4;
  if (siparistutar < 300) return 62.4;
  return 74.4;
};

const hesaplaSarf = (siparis) => {
  // Trendyol mantığı: Ürün adında "cam" veya "magicbox" varsa 10₺, yoksa 7.5₺
  const urunAdi = (siparis['Ürün Adı'] || '').toLowerCase();
  
  if (urunAdi.includes('cam') || urunAdi.includes('magicbox')) {
    return 10.0;
  } else {
    return 7.5;
  }
};

const hesaplaStopaj = (siparisTutar, musteriTipi) => {
  // Tüm siparişler için %1 stopaj (faturalandırılacak tutar / 1.2 * 1/100)
  return (siparisTutar / 1.2) * 0.01;
};

const hesaplaSiparisKari = (siparis, urunMaliyeti = 0) => {
  const siparisTutar = parseFloat(siparis['Faturalandırılacak Satış Fiyatı'] || 0);
  const adet = parseInt(siparis['Adet'] || 1);
  const komisyon = parseFloat(siparis['Komisyon Tutarı (KDV Dahil)'] || 0);
  const musteriTipi = siparis['Müşteri Tipi'] || 'Bireysel';
  
  // Gelir
  const gelir = siparisTutar;
  
  // Maliyetler
  const toplamUrunMaliyeti = urunMaliyeti * adet;
  const kargoBedeli = hesaplaKargoBedeli(siparisTutar);
  const sarf = hesaplaSarf(siparis);
  const stopaj = hesaplaStopaj(siparisTutar, musteriTipi);
  
  const toplamMaliyet = toplamUrunMaliyeti + komisyon + kargoBedeli + sarf + stopaj;
  const netKar = gelir - toplamMaliyet;
  const karMarji = gelir > 0 ? (netKar / gelir) * 100 : 0;
  
  return {
    gelir,
    toplamUrunMaliyeti,
    komisyon,
    kargoBedeli,
    sarf,
    stopaj,
    toplamMaliyet,
    netKar,
    karMarji,
    adet
  };
};

const HepsiburadaKarAnalizi = ({ urunler, siparisler, urunMaliyetleri = {} }) => {
  // Detaylı kar hesaplama
  const karAnalizSonuclari = useMemo(() => {
    if (!siparisler || siparisler.length === 0) {
      return {
        toplamGelir: 0,
        toplamUrunMaliyeti: 0,
        toplamKomisyon: 0,
        toplamKargo: 0,
        toplamSarf: 0,
        toplamStopaj: 0,
        toplamMaliyet: 0,
        netKar: 0,
        karMarji: 0,
        karlıSiparisler: 0,
        zararlıSiparisler: 0,
        ortalamaSiparisTutar: 0,
        siparisDetaylari: []
      };
    }

    let toplamGelir = 0;
    let toplamUrunMaliyeti = 0;
    let toplamKomisyon = 0;
    let toplamKargo = 0;
    let toplamSarf = 0;
    let toplamStopaj = 0;
    let karlıSiparisler = 0;
    let zararlıSiparisler = 0;
    const siparisDetaylari = [];

    siparisler.forEach((siparis, index) => {
      const stokKodu = siparis['Satıcı Stok Kodu'] || '';
      const urunMaliyeti = urunMaliyetleri[stokKodu] || 0;
      
      const hesaplama = hesaplaSiparisKari(siparis, urunMaliyeti);
      
      toplamGelir += hesaplama.gelir;
      toplamUrunMaliyeti += hesaplama.toplamUrunMaliyeti;
      toplamKomisyon += hesaplama.komisyon;
      toplamKargo += hesaplama.kargoBedeli;
      toplamSarf += hesaplama.sarf;
      toplamStopaj += hesaplama.stopaj;

      if (hesaplama.netKar > 0) {
        karlıSiparisler++;
      } else {
        zararlıSiparisler++;
      }

      siparisDetaylari.push({
        ...siparis,
        ...hesaplama,
        index
      });
    });

    const toplamMaliyet = toplamUrunMaliyeti + toplamKomisyon + toplamKargo + toplamSarf + toplamStopaj;
    const netKar = toplamGelir - toplamMaliyet;
    const karMarji = toplamGelir > 0 ? (netKar / toplamGelir) * 100 : 0;
    const ortalamaSiparisTutar = siparisler.length > 0 ? toplamGelir / siparisler.length : 0;

    return {
      toplamGelir,
      toplamUrunMaliyeti,
      toplamKomisyon,
      toplamKargo,
      toplamSarf,
      toplamStopaj,
      toplamMaliyet,
      netKar,
      karMarji,
      karlıSiparisler,
      zararlıSiparisler,
      ortalamaSiparisTutar,
      siparisDetaylari
    };
  }, [siparisler, urunMaliyetleri]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        💰 Hepsiburada Kar Analizi
      </Typography>

      {siparisler.length === 0 ? (
        <Alert severity="info">
          📊 Kar analizini görüntülemek için sipariş verilerinizi yükleyin.
        </Alert>
      ) : (
        <>
          {/* Özet Kartları */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={2.4}>
              <Card elevation={3} sx={{ bgcolor: 'success.50', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <MoneyIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    ₺{karAnalizSonuclari.toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Gelir
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <Card elevation={3} sx={{ bgcolor: 'warning.50', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <LocalShippingIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6" color="warning.main" fontWeight="bold">
                    ₺{karAnalizSonuclari.toplamKargo.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Kargo Bedeli
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <Card elevation={3} sx={{ bgcolor: 'error.50', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <MoneyIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    ₺{karAnalizSonuclari.toplamKomisyon.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    HB Komisyonu
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <Card elevation={3} sx={{ bgcolor: 'info.50', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <MoneyIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h6" color="info.main" fontWeight="bold">
                    ₺{karAnalizSonuclari.toplamSarf.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sarf (Cam: 10₺, Diğer: 7.5₺)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={2.4}>
              <Card elevation={3} sx={{ bgcolor: karAnalizSonuclari.netKar >= 0 ? 'success.50' : 'error.50', height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  {karAnalizSonuclari.netKar >= 0 ? (
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                  )}
                  <Typography 
                    variant="h6" 
                    color={karAnalizSonuclari.netKar >= 0 ? 'success.main' : 'error.main'} 
                    fontWeight="bold"
                  >
                    ₺{karAnalizSonuclari.netKar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Net Kar (%{karAnalizSonuclari.karMarji.toFixed(1)})
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detaylı Maliyet Dökümü */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              📋 Detaylı Maliyet Dökümü
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main" gutterBottom>
                      💰 Gelirler
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Toplam Satış</Typography>
                      <Typography fontWeight="bold">
                        ₺{karAnalizSonuclari.toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" color="error.main" gutterBottom>
                      💸 Giderler
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Ürün Maliyeti</Typography>
                      <Typography>₺{karAnalizSonuclari.toplamUrunMaliyeti.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>HB Komisyonu</Typography>
                      <Typography>₺{karAnalizSonuclari.toplamKomisyon.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Kargo Bedeli</Typography>
                      <Typography>₺{karAnalizSonuclari.toplamKargo.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Sarf (Cam/MagicBox: 10₺, Diğer: 7.5₺)</Typography>
                      <Typography>₺{karAnalizSonuclari.toplamSarf.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Stopaj (Tutar/1.2×0.01)</Typography>
                      <Typography>₺{karAnalizSonuclari.toplamStopaj.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Typography>
                    </Box>
                    <hr />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography fontWeight="bold">Toplam Gider</Typography>
                      <Typography fontWeight="bold" color="error.main">
                        ₺{karAnalizSonuclari.toplamMaliyet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Algoritma Açıklamaları */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: 'info.50' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="info.main" gutterBottom>
                  🚚 Kargo Bedeli Hesaplama
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  <li>Sipariş tutarı {"<"} 150₺ = 38,4₺</li>
                  <li>Sipariş tutarı {"<"} 300₺ = 62,4₺</li>
                  <li>Sipariş tutarı {">"} 300₺ = 74,4₺</li>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: 'warning.50' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="warning.main" gutterBottom>
                  📦 Sarf Hesaplama (Trendyol Mantığı)
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  <li>Ürün adında "cam" veya "magicbox" var → 10₺</li>
                  <li>Diğer ürünler → 7.5₺</li>
                  <li>Sipariş bazlı hesaplama</li>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Sipariş Durumu */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">
                    ✅ Karlı Siparişler
                  </Typography>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {karAnalizSonuclari.karlıSiparisler}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    sipariş
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error.main">
                    ❌ Zararlı Siparişler
                  </Typography>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {karAnalizSonuclari.zararlıSiparisler}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    sipariş
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Sipariş Bazlı Net Kar Tablosu */}
          <Paper elevation={3} sx={{ mt: 4 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                📋 Sipariş Bazlı Net Kar Detayları
              </Typography>
            </Box>
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={karAnalizSonuclari.siparisDetaylari.map((siparis, index) => ({
                  ...siparis,
                  id: `kar_${index}_${siparis['Sipariş Numarası'] || index}`
                }))}
                columns={[
                  {
                    field: 'Sipariş Numarası',
                    headerName: 'Sipariş No',
                    width: 130,
                    renderCell: (params) => (
                      <Chip
                        label={params.value || 'N/A'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )
                  },
                  {
                    field: 'Ürün Adı',
                    headerName: 'Ürün',
                    width: 250,
                    renderCell: (params) => (
                      <Tooltip title={params.value || 'N/A'}>
                        <Typography variant="body2" noWrap>
                          {params.value || 'N/A'}
                        </Typography>
                      </Tooltip>
                    )
                  },
                  {
                    field: 'Alıcı',
                    headerName: 'Müşteri',
                    width: 140,
                    renderCell: (params) => (
                      <Tooltip title={params.value || 'N/A'}>
                        <Typography variant="body2" noWrap>
                          {params.value || 'N/A'}
                        </Typography>
                      </Tooltip>
                    )
                  },
                  {
                    field: 'adet',
                    headerName: 'Adet',
                    width: 70,
                    type: 'number',
                    renderCell: (params) => (
                      <Typography variant="body2" fontWeight="bold">
                        {params.value || 0}
                      </Typography>
                    )
                  },
                  {
                    field: 'gelir',
                    headerName: 'Gelir (₺)',
                    width: 110,
                    type: 'number',
                    renderCell: (params) => (
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </Typography>
                    )
                  },
                  {
                    field: 'toplamUrunMaliyeti',
                    headerName: 'Ürün Maliyeti (₺)',
                    width: 130,
                    type: 'number',
                    renderCell: (params) => (
                      <Typography variant="body2">
                        ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </Typography>
                    )
                  },
                  {
                    field: 'komisyon',
                    headerName: 'Komisyon (₺)',
                    width: 120,
                    type: 'number',
                    renderCell: (params) => (
                      <Typography variant="body2" color="error.main">
                        ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </Typography>
                    )
                  },
                  {
                    field: 'kargoBedeli',
                    headerName: 'Kargo (₺)',
                    width: 90,
                    type: 'number',
                    renderCell: (params) => (
                      <Typography variant="body2" color="warning.main">
                        ₺{parseFloat(params.value || 0).toFixed(1)}
                      </Typography>
                    )
                  },
                  {
                    field: 'sarf',
                    headerName: 'Sarf (₺)',
                    width: 80,
                    type: 'number',
                    renderCell: (params) => (
                      <Typography variant="body2" color="info.main">
                        ₺{parseFloat(params.value || 0).toFixed(1)}
                      </Typography>
                    )
                  },
                  {
                    field: 'stopaj',
                    headerName: 'Stopaj (₺)',
                    width: 90,
                    type: 'number',
                    renderCell: (params) => {
                      const value = parseFloat(params.value || 0);
                      return (
                        <Typography variant="body2" color="error.dark">
                          ₺{value.toFixed(2)}
                        </Typography>
                      );
                    }
                  },
                  {
                    field: 'netKar',
                    headerName: 'Net Kar (₺)',
                    width: 120,
                    type: 'number',
                    renderCell: (params) => {
                      const value = parseFloat(params.value || 0);
                      return (
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={value >= 0 ? 'success.main' : 'error.main'}
                        >
                          ₺{value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </Typography>
                      );
                    }
                  },
                  {
                    field: 'karMarji',
                    headerName: 'Kar Marjı (%)',
                    width: 110,
                    type: 'number',
                    renderCell: (params) => {
                      const value = parseFloat(params.value || 0);
                      return (
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={value >= 0 ? 'success.main' : 'error.main'}
                        >
                          %{value.toFixed(1)}
                        </Typography>
                      );
                    }
                  }
                ]}
                getRowId={(row) => row.id}
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
                    fontSize: '0.875rem',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                }}
              />
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default HepsiburadaKarAnalizi;
