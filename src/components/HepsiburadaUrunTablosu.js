import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Store as StoreIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import ExcelUploader from './ExcelUploader';
import * as XLSX from 'xlsx';

const HepsiburadaUrunTablosu = ({ urunler, onUrunUpdate, onUrunUpload }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockCodeSearch, setStockCodeSearch] = useState('');
  const [selectedMarka, setSelectedMarka] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedDurum, setSelectedDurum] = useState('');
  const [selectedBuyboxSira, setSelectedBuyboxSira] = useState('');
  const [dolarKuru, setDolarKuru] = useState(() => {
    const saved = localStorage.getItem('hb_dolar_kuru');
    return saved ? parseFloat(saved) : 42.0;
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUrun, setEditingUrun] = useState(null);
  const [editForm, setEditForm] = useState({});

  const expectedColumns = [
    'Satıcı Stok Kodu', 'SKU', 'Ürün Adı', 'Komisyon Oranı', 'Vade Süresi',
    'Fiyat', 'İndirimli Fiyat', 'Dolar Fiyatı', 'Stok', 'Maks. Satın Alma Adedi', 
    'Kargoya Veriliş Süresi', 'En Temel Kategori', 'Ana Kategori', 
    'Marka', 'Durum', 'Buybox Sırası', 'Barkod'
  ];

  // Dolar kuru localStorage'da güncel tut
  useEffect(() => {
    const interval = setInterval(() => {
      const currentKur = localStorage.getItem('hb_dolar_kuru');
      if (currentKur && parseFloat(currentKur) !== dolarKuru) {
        setDolarKuru(parseFloat(currentKur));
      }
    }, 1000);

    const handleStorageChange = (e) => {
      if (e.key === 'hb_dolar_kuru' && e.newValue) {
        setDolarKuru(parseFloat(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dolarKuru]);

  // Düzenleme dialog'unu aç
  const handleOpenEditDialog = (urun) => {
    setEditingUrun(urun);
    setEditForm({ ...urun });
    setEditDialogOpen(true);
  };

  // Düzenleme dialog'unu kapat
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingUrun(null);
    setEditForm({});
  };

  // Form değişikliklerini takip et
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Değişiklikleri kaydet
  const handleSaveChanges = () => {
    if (onUrunUpdate) {
      onUrunUpdate(editingUrun, editForm);
    }
    handleCloseEditDialog();
  };

  // Ürün silme
  const handleDeleteUrun = (urun) => {
    if (window.confirm(`"${urun['Ürün Adı'] || 'Bu ürün'}" ürününü silmek istediğinizden emin misiniz?`)) {
      const savedUrunler = localStorage.getItem('hb_urunler');
      if (savedUrunler) {
        const currentUrunler = JSON.parse(savedUrunler);
        const updatedUrunler = currentUrunler.filter(u => 
          u['Satıcı Stok Kodu'] !== urun['Satıcı Stok Kodu'] || 
          u['Ürün Adı'] !== urun['Ürün Adı']
        );
        localStorage.setItem('hb_urunler', JSON.stringify(updatedUrunler));
        window.location.reload();
      }
    }
  };

  const handleUploadSuccess = (data) => {
    onUrunUpload(data);
    setUploadDialogOpen(false);
  };

  // Filtreleme seçenekleri
  const markaOptions = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    const markalar = [...new Set(urunler.map(u => u['Marka'] || 'Bilinmeyen'))];
    return markalar.sort();
  }, [urunler]);

  const kategoriOptions = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    const kategoriler = [...new Set(urunler.map(u => u['En Temel Kategori'] || 'Bilinmeyen'))];
    return kategoriler.sort();
  }, [urunler]);

  const durumOptions = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    const durumlar = [...new Set(urunler.map(u => u['Durum'] || 'Bilinmeyen'))];
    return durumlar.sort();
  }, [urunler]);

  const buyboxSiraOptions = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    const siralar = [...new Set(urunler.map(u => u['Buybox Sırası'] || 0))];
    return siralar.sort((a, b) => a - b);
  }, [urunler]);

  // Filtrelenmiş ürünler
  const filteredUrunler = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    
    return urunler.filter(urun => {
      const matchesSearch = !searchTerm || 
        (urun['Ürün Adı'] || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStockCode = !stockCodeSearch || 
        (urun['Satıcı Stok Kodu'] || '').toLowerCase().includes(stockCodeSearch.toLowerCase());
      
      const matchesMarka = !selectedMarka || 
        (urun['Marka'] || 'Bilinmeyen') === selectedMarka;
      
      const matchesKategori = !selectedKategori || 
        (urun['En Temel Kategori'] || 'Bilinmeyen') === selectedKategori;
      
      const matchesDurum = !selectedDurum || 
        (urun['Durum'] || 'Bilinmeyen') === selectedDurum;
      
      const matchesBuyboxSira = !selectedBuyboxSira || 
        (urun['Buybox Sırası'] || 0).toString() === selectedBuyboxSira.toString();
      
      return matchesSearch && matchesStockCode && matchesMarka && matchesKategori && matchesDurum && matchesBuyboxSira;
    });
  }, [urunler, searchTerm, stockCodeSearch, selectedMarka, selectedKategori, selectedDurum, selectedBuyboxSira]);

  // DataGrid sütunları
  const columns = [
    {
      field: 'Buybox Sırası',
      headerName: 'Buybox',
      width: 100,
      type: 'number',
      renderCell: (params) => {
        const sira = parseInt(params.value || 0);
        const color = sira === 1 ? 'success' : sira <= 3 ? 'warning' : 'default';
        return (
          <Chip
            label={`#${sira}`}
            size="small"
            color={color}
            variant="filled"
          />
        );
      }
    },
    {
      field: 'Ürün Adı',
      headerName: 'Ürün Adı',
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
      field: 'Satıcı Stok Kodu',
      headerName: 'Stok Kodu',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          color="secondary"
          variant="outlined"
        />
      )
    },
    {
      field: 'Marka',
      headerName: 'Marka',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          color="info"
          variant="outlined"
        />
      )
    },
    {
      field: 'En Temel Kategori',
      headerName: 'Kategori',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          color="secondary"
          variant="outlined"
        />
      )
    },
    {
      field: 'Komisyon Oranı',
      headerName: 'Komisyon',
      width: 100,
      renderCell: (params) => {
        const komisyon = params.value || '0%';
        const value = parseFloat(komisyon.toString().replace('%', ''));
        const color = value >= 20 ? 'error' : value >= 15 ? 'warning' : 'success';
        return (
          <Chip
            label={komisyon}
            size="small"
            color={color}
            variant="filled"
          />
        );
      }
    },
    {
      field: 'Durum',
      headerName: 'Durum',
      width: 100,
      renderCell: (params) => {
        const durum = params.value || 'N/A';
        const color = durum === 'Satışta' ? 'success' : 'default';
        return (
          <Chip
            label={durum}
            size="small"
            color={color}
            variant={durum === 'Satışta' ? 'filled' : 'outlined'}
          />
        );
      }
    },
    {
      field: 'Fiyat',
      headerName: 'Fiyat (₺)',
      width: 120,
      type: 'number',
      renderCell: (params) => {
        const row = params.row;
        const normalFiyat = parseFloat(params.value || 0);
        const indirimliFiyat = row['İndirimli Fiyat'] ? parseFloat(row['İndirimli Fiyat'].toString().replace(',', '.')) : null;
        
        return (
          <Box>
            {indirimliFiyat ? (
              <>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  ₺{normalFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" color="error.main" fontWeight="bold">
                  ₺{indirimliFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="success.main" fontWeight="bold">
                ₺{normalFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'Dolar Fiyatı',
      headerName: 'Maliyet ($)',
      width: 110,
      type: 'number',
      renderCell: (params) => {
        const dolarFiyat = parseFloat(params.value || 0);
        const tlMaliyet = dolarFiyat * dolarKuru;
        return (
          <Box>
            <Typography variant="body2" color="info.main" fontWeight="bold">
              ${dolarFiyat.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ₺{tlMaliyet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'Stok',
      headerName: 'Stok',
      width: 100,
      type: 'number',
      renderCell: (params) => {
        const stok = parseInt(params.value || 0);
        const color = stok > 100 ? 'success' : stok > 10 ? 'warning' : 'error';
        return (
          <Chip
            label={stok.toLocaleString('tr-TR')}
            size="small"
            color={color}
            variant="filled"
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Ürünü düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEditDialog(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ürünü sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteUrun(params.row)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Export Excel
  const exportToExcel = () => {
    const savedUrunler = localStorage.getItem('hb_urunler');
    const currentUrunler = savedUrunler ? JSON.parse(savedUrunler) : urunler;
    
    const currentFilteredUrunler = currentUrunler.filter(urun => {
      const matchesSearch = !searchTerm || 
        (urun['Ürün Adı'] || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStockCode = !stockCodeSearch || 
        (urun['Satıcı Stok Kodu'] || '').toLowerCase().includes(stockCodeSearch.toLowerCase());
      
      const matchesMarka = !selectedMarka || 
        (urun['Marka'] || 'Bilinmeyen') === selectedMarka;
      
      const matchesKategori = !selectedKategori || 
        (urun['En Temel Kategori'] || 'Bilinmeyen') === selectedKategori;
      
      const matchesDurum = !selectedDurum || 
        (urun['Durum'] || 'Bilinmeyen') === selectedDurum;
      
      const matchesBuyboxSira = !selectedBuyboxSira || 
        (urun['Buybox Sırası'] || 0).toString() === selectedBuyboxSira.toString();
      
      return matchesSearch && matchesStockCode && matchesMarka && matchesKategori && matchesDurum && matchesBuyboxSira;
    });
    
    if (!currentFilteredUrunler || currentFilteredUrunler.length === 0) {
      alert('Dışa aktarılacak veri bulunamadı!');
      return;
    }

    const exportData = currentFilteredUrunler.map(urun => {
      const komisyon = urun['Komisyon Oranı'] || '0%';
      const komisyonSayi = parseFloat(komisyon.toString().replace('%', ''));
      const normalFiyat = parseFloat(urun['Fiyat'] || 0);
      const indirimliFiyat = urun['İndirimli Fiyat'] ? parseFloat(urun['İndirimli Fiyat'].toString().replace(',', '.')) : null;
      const aktifFiyat = indirimliFiyat || normalFiyat;
      
      return {
        'Satıcı Stok Kodu': urun['Satıcı Stok Kodu'] || '',
        'SKU': urun['SKU'] || '',
        'Ürün Adı': urun['Ürün Adı'] || '',
        'Marka': urun['Marka'] || '',
        'En Temel Kategori': urun['En Temel Kategori'] || '',
        'Ana Kategori': urun['Ana Kategori'] || '',
        'Buybox Sırası': parseInt(urun['Buybox Sırası'] || 0),
        'Durum': urun['Durum'] || '',
        'Fiyat': normalFiyat,
        'İndirimli Fiyat': indirimliFiyat || '',
        'Dolar Fiyatı': parseFloat(urun['Dolar Fiyatı'] || 0),
        'TL Maliyet': parseFloat(urun['Dolar Fiyatı'] || 0) * dolarKuru,
        'Aktif Fiyat': aktifFiyat,
        'Komisyon Oranı': komisyon,
        'Komisyon Tutarı': (aktifFiyat * komisyonSayi / 100).toFixed(2),
        'Vade Süresi': urun['Vade Süresi'] || '',
        'Stok': parseInt(urun['Stok'] || 0),
        'Maks. Satın Alma Adedi': parseInt(urun['Maks. Satın Alma Adedi'] || 0),
        'Kargoya Veriliş Süresi': urun['Kargoya Veriliş Süresi'] || '',
        'Barkod': urun['Barkod'] || '',
        'Son Güncelleme': new Date().toLocaleString('tr-TR')
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hepsiburada Ürünler');

    const fileName = `hepsiburada_urunler_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStockCodeSearch('');
    setSelectedMarka('');
    setSelectedKategori('');
    setSelectedDurum('');
    setSelectedBuyboxSira('');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        📋 Hepsiburada Ürün Kataloğu
      </Typography>

      {/* Upload/Export Section */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Excel Yükle
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={filteredUrunler.length === 0}
                onClick={exportToExcel}
              >
                Excel İndir ({filteredUrunler.length})
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" align="right">
              💱 Güncel Dolar Kuru: ₺{dolarKuru.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {urunler.length === 0 ? (
        <Alert severity="info">
          📤 Ürün kataloğunu görüntülemek için Excel dosyanızı yükleyin.
          <br />
          <strong>Beklenen format:</strong> {expectedColumns.slice(0, 5).join(', ')}...
        </Alert>
      ) : (
        <>
          {/* Filtreleme */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔍 Filtreleme
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Ürün Adı Ara"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <TextField
                  fullWidth
                  label="Stok Kodu Ara"
                  value={stockCodeSearch}
                  onChange={(e) => setStockCodeSearch(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Marka</InputLabel>
                  <Select
                    value={selectedMarka}
                    onChange={(e) => setSelectedMarka(e.target.value)}
                    label="Marka"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {markaOptions.map(marka => (
                      <MenuItem key={marka} value={marka}>{marka}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={selectedKategori}
                    onChange={(e) => setSelectedKategori(e.target.value)}
                    label="Kategori"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {kategoriOptions.map(kategori => (
                      <MenuItem key={kategori} value={kategori}>{kategori}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4} lg={1}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={selectedDurum}
                    onChange={(e) => setSelectedDurum(e.target.value)}
                    label="Durum"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {durumOptions.map(durum => (
                      <MenuItem key={durum} value={durum}>{durum}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Buybox Sırası</InputLabel>
                  <Select
                    value={selectedBuyboxSira}
                    onChange={(e) => setSelectedBuyboxSira(e.target.value)}
                    label="Buybox Sırası"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {buyboxSiraOptions.map(sira => (
                      <MenuItem key={sira} value={sira}>#{sira}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4} lg={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  sx={{ height: 56 }}
                >
                  Temizle
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Özet Kartları */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <InventoryIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" color="primary.main">
                    {filteredUrunler.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filtrelenmiş Ürün
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <MoneyIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" color="success.main">
                    ₺{filteredUrunler.reduce((sum, u) => sum + parseFloat(u['Fiyat'] || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Fiyat
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <StoreIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h6" color="info.main">
                    {filteredUrunler.reduce((sum, u) => sum + parseInt(u['Stok'] || 0), 0).toLocaleString('tr-TR')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Stok
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h5" color="secondary.main" fontWeight="bold">
                    {markaOptions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Farklı Marka
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Yeni Metrik Kartları */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    #{filteredUrunler.filter(u => parseInt(u['Buybox Sırası'] || 0) === 1).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Buybox 1. Sıra
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    %{((filteredUrunler.filter(u => parseInt(u['Buybox Sırası'] || 0) === 1).length / Math.max(filteredUrunler.length, 1)) * 100).toFixed(1)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    %{filteredUrunler.length > 0 ? ((filteredUrunler.reduce((sum, u) => {
                      const komisyon = u['Komisyon Oranı'] || '0%';
                      return sum + parseFloat(komisyon.toString().replace('%', ''));
                    }, 0) / filteredUrunler.length).toFixed(1)) : '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ortalama Komisyon
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {filteredUrunler.filter(u => u['İndirimli Fiyat']).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    İndirimli Ürün
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    Ortalama %{filteredUrunler.filter(u => u['İndirimli Fiyat']).length > 0 ? 
                      ((filteredUrunler.filter(u => u['İndirimli Fiyat']).reduce((sum, u) => {
                        const normal = parseFloat(u['Fiyat'] || 0);
                        const indirimli = parseFloat(u['İndirimli Fiyat'].toString().replace(',', '.'));
                        return sum + ((normal - indirimli) / normal * 100);
                      }, 0) / filteredUrunler.filter(u => u['İndirimli Fiyat']).length).toFixed(1)) : '0'} İndirim
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* DataGrid */}
          <Paper elevation={3} sx={{ height: 600 }}>
            <DataGrid
              rows={filteredUrunler.map((urun, index) => ({ 
                ...urun, 
                id: `${urun['Satıcı Stok Kodu'] || index}_${urun['SKU'] || index}` 
              }))}
              columns={columns}
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
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
          </Paper>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Ürün Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ürün Adı"
                value={editForm['Ürün Adı'] || ''}
                onChange={(e) => handleFormChange('Ürün Adı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Satıcı Stok Kodu"
                value={editForm['Satıcı Stok Kodu'] || ''}
                onChange={(e) => handleFormChange('Satıcı Stok Kodu', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marka"
                value={editForm['Marka'] || ''}
                onChange={(e) => handleFormChange('Marka', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fiyat"
                type="number"
                value={editForm['Fiyat'] || ''}
                onChange={(e) => handleFormChange('Fiyat', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dolar Fiyatı (Maliyet)"
                type="number"
                value={editForm['Dolar Fiyatı'] || ''}
                onChange={(e) => handleFormChange('Dolar Fiyatı', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stok"
                type="number"
                value={editForm['Stok'] || ''}
                onChange={(e) => handleFormChange('Stok', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ürün Açıklaması"
                multiline
                rows={3}
                value={editForm['Ürün Açıklaması'] || ''}
                onChange={(e) => handleFormChange('Ürün Açıklaması', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} startIcon={<CancelIcon />}>
            İptal
          </Button>
          <Button onClick={handleSaveChanges} variant="contained" startIcon={<SaveIcon />}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Hepsiburada Ürün Kataloğu Yükle</DialogTitle>
        <DialogContent>
          <ExcelUploader 
            platform="hepsiburada"
            onUploadSuccess={handleUploadSuccess}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HepsiburadaUrunTablosu;
