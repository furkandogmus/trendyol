import React, { useState, useMemo, useCallback } from 'react';
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
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import ExcelUploader from './ExcelUploader';
import * as XLSX from 'xlsx';

// Yardımcı fonksiyonlar
const cleanDataValue = (value, fieldType = 'text') => {
  if (!value) return value;
  
  const stringValue = value.toString().trim();
  
  switch (fieldType) {
    case 'scientific':
      // Bilimsel notasyonu düzelt
      if (stringValue.match(/^\d+([,.]?\d*)?E[+-]?\d+$/i)) {
        try {
          const cleanValue = stringValue.replace(',', '.');
          const num = parseFloat(cleanValue);
          if (!isNaN(num)) {
            // Büyük sayılar için string formatında tut
            if (num > Number.MAX_SAFE_INTEGER) {
              return num.toFixed(0);
            } else {
              return Math.round(num).toString();
            }
          }
          return stringValue;
        } catch {
          return stringValue;
        }
      }
      return stringValue;
      
    case 'price':
      // Fiyat formatını düzelt
      try {
        // Önce bilimsel notasyonu kontrol et
        if (stringValue.match(/^\d+([,.]?\d*)?E[+-]?\d+$/i)) {
          const cleanValue = stringValue.replace(',', '.');
          const num = parseFloat(cleanValue);
          return !isNaN(num) ? num : stringValue;
        } else {
          // Normal fiyat formatı
          const cleanValue = stringValue.replace(',', '.');
          const numValue = parseFloat(cleanValue);
          return !isNaN(numValue) ? numValue : stringValue;
        }
      } catch {
        return stringValue;
      }
      
    case 'address':
      // Adres alanlarını tek satır yap
      return stringValue.replace(/\s+/g, ' ').trim();
      
    case 'date':
      // Türkçe tarih formatını düzelt
      try {
        const datePart = stringValue.split(' ')[0];
        const [day, month, year] = datePart.split('.');
        if (day && month && year && year.length === 4) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return stringValue;
      } catch {
        return stringValue;
      }
      
    default:
      return stringValue;
  }
};

const getFieldType = (fieldName) => {
  if (fieldName === 'Sipariş Tarihi') return 'date';
  if (fieldName.includes('Fiyat') || fieldName.includes('Tutar') || fieldName.includes('Komisyon')) return 'price';
  if (fieldName.includes('Adres')) return 'address';
  if (fieldName === 'Barkod' || fieldName === 'Paket Numarası' || fieldName === 'Sipariş Numarası') return 'scientific';
  return 'text';
};

const HepsiburadaSiparisTablosu = ({ siparisler, onSiparisUpdate, onSiparisAdd, onSiparisUpload }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [siparisNoSearch, setSiparisNoSearch] = useState('');
  const [selectedSehir, setSelectedSehir] = useState('');
  const [selectedKargo, setSelectedKargo] = useState('');
  const [selectedDurum, setSelectedDurum] = useState('');
  const [selectedMusteriTipi, setSelectedMusteriTipi] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSiparis, setEditingSiparis] = useState(null);
  const [editForm, setEditForm] = useState({});

  const expectedColumns = [
    'Barkod', 'Kargo Firması', 'Sipariş Tarihi', 'Sipariş Numarası',
    'Alıcı', 'Şehir', 'Ürün Adı', 'Satıcı Stok Kodu', 'Adet', 'Kategori',
    'Faturalandırılacak Satış Fiyatı', 'Komisyon Tutarı (KDV Dahil)',
    'Paket Durumu', 'Müşteri Tipi'
  ];

  // Düzenleme dialog'unu aç
  const handleOpenEditDialog = (siparis) => {
    setEditingSiparis(siparis);
    setEditForm({ ...siparis });
    setEditDialogOpen(true);
  };

  // Düzenleme dialog'unu kapat
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingSiparis(null);
    setEditForm({});
  };

  // Ekleme dialog'unu aç
  const handleOpenAddDialog = () => {
    setEditForm({
      'Sipariş Numarası': '',
      'Paket Numarası': '',
      'Sipariş Tarihi': new Date().toISOString().split('T')[0],
      'Alıcı': '',
      'Şehir': '',
      'Ürün Adı': '',
      'Satıcı Stok Kodu': '',
      'Kategori': '',
      'Adet': 1,
      'Faturalandırılacak Satış Fiyatı': 0,
      'Komisyon Tutarı (KDV Dahil)': 0,
      'Kargo Firması': 'hepsiJET',
      'Paket Durumu': 'Hazırlanıyor',
      'Müşteri Tipi': 'Bireysel'
    });
    setAddDialogOpen(true);
  };

  // Ekleme dialog'unu kapat
  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setEditForm({});
  };

  // Form değişikliklerini takip et - useCallback ile optimize
  const handleFormChange = useCallback((field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Değişiklikleri kaydet
  const handleSaveChanges = () => {
    if (onSiparisUpdate) {
      onSiparisUpdate(editingSiparis, editForm);
    }
    handleCloseEditDialog();
  };

  // Yeni sipariş ekle
  const handleAddSiparis = () => {
    if (onSiparisAdd) {
      onSiparisAdd(editForm);
    }
    handleCloseAddDialog();
  };

  // Sipariş silme
  const handleDeleteSiparis = (siparis) => {
    const siparisNo = siparis['Sipariş Numarası'] || 'Bu sipariş';
    const kalemNo = siparis['Kalem Numarası'] || '';
    const urunAdi = siparis['Ürün Adı'] || '';
    
    if (window.confirm(`"${siparisNo}" numaralı siparişi${kalemNo ? ` (Kalem: ${kalemNo})` : ''}${urunAdi ? ` - ${urunAdi.substring(0, 30)}...` : ''} silmek istediğinizden emin misiniz?`)) {
      const savedSiparisler = localStorage.getItem('hb_siparisler');
      if (savedSiparisler) {
        const currentSiparisler = JSON.parse(savedSiparisler);
        const updatedSiparisler = currentSiparisler.filter(s => {
          // Daha kapsamlı eşleştirme - birden fazla alan kontrol et
          const sSiparisNo = (s['Sipariş Numarası'] || '').toString().trim();
          const sKalemNo = (s['Kalem Numarası'] || '').toString().trim();
          const sBarkod = (s['Barkod'] || '').toString().trim();
          const sUrun = (s['Ürün Adı'] || '').toString().trim();
          
          const targetSiparisNo = (siparis['Sipariş Numarası'] || '').toString().trim();
          const targetKalemNo = (siparis['Kalem Numarası'] || '').toString().trim();
          const targetBarkod = (siparis['Barkod'] || '').toString().trim();
          const targetUrun = (siparis['Ürün Adı'] || '').toString().trim();

          // Öncelik sırası: Barkod > Sipariş+Kalem > Sipariş+Ürün
          if (targetBarkod && sBarkod && targetBarkod === sBarkod) {
            return false; // Sil
          }
          
          if (targetSiparisNo && targetKalemNo && sSiparisNo === targetSiparisNo && sKalemNo === targetKalemNo) {
            return false; // Sil  
          }
          
          if (targetSiparisNo && targetUrun && sSiparisNo === targetSiparisNo && sUrun === targetUrun) {
            return false; // Sil
          }

          return true; // Silme
        });
        localStorage.setItem('hb_siparisler', JSON.stringify(updatedSiparisler));
        window.location.reload();
      }
    }
  };

  const handleUploadSuccess = (data) => {
    onSiparisUpload(data);
    setUploadDialogOpen(false);
  };

  // Filtreleme seçenekleri
  const sehirOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const sehirler = [...new Set(siparisler.map(s => s['Şehir'] || 'Bilinmeyen'))];
    return sehirler.sort();
  }, [siparisler]);

  const kargoOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const kargolar = [...new Set(siparisler.map(s => s['Kargo Firması'] || 'Bilinmeyen'))];
    return kargolar.sort();
  }, [siparisler]);

  const durumOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const durumlar = [...new Set(siparisler.map(s => s['Paket Durumu'] || 'Bilinmeyen'))];
    return durumlar.sort();
  }, [siparisler]);

  const musteriTipiOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const tipler = [...new Set(siparisler.map(s => s['Müşteri Tipi'] || 'Bireysel'))];
    return tipler.sort();
  }, [siparisler]);

  // Filtrelenmiş siparişler
  const filteredSiparisler = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    
    return siparisler.filter(siparis => {
      const matchesSearch = !searchTerm || 
        (siparis['Ürün Adı'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (siparis['Alıcı'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (siparis['Kategori'] || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSiparisNo = !siparisNoSearch || 
        (siparis['Sipariş Numarası'] || '').toLowerCase().includes(siparisNoSearch.toLowerCase());
      
      const matchesSehir = !selectedSehir || 
        (siparis['Şehir'] || 'Bilinmeyen') === selectedSehir;
      
      const matchesKargo = !selectedKargo || 
        (siparis['Kargo Firması'] || 'Bilinmeyen') === selectedKargo;
      
      const matchesDurum = !selectedDurum || 
        (siparis['Paket Durumu'] || 'Bilinmeyen') === selectedDurum;
      
      const matchesMusteriTipi = !selectedMusteriTipi || 
        (siparis['Müşteri Tipi'] || 'Bireysel') === selectedMusteriTipi;
      
      return matchesSearch && matchesSiparisNo && matchesSehir && matchesKargo && matchesDurum && matchesMusteriTipi;
    });
  }, [siparisler, searchTerm, siparisNoSearch, selectedSehir, selectedKargo, selectedDurum, selectedMusteriTipi]);

  // DataGrid sütunları
  const columns = [
    {
      field: 'Sipariş Numarası',
      headerName: 'Sipariş No',
      width: 140,
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
      field: 'Sipariş Tarihi',
      headerName: 'Sipariş Tarihi',
      width: 130,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2">N/A</Typography>;
        
        try {
          // Eğer zaten ISO formatında ise
          if (params.value.includes('-')) {
            return (
              <Typography variant="body2">
                {new Date(params.value).toLocaleDateString('tr-TR')}
              </Typography>
            );
          }
          // Türkçe format ise (4.08.2025)
          else if (params.value.includes('.')) {
            const datePart = params.value.split(' ')[0]; // "4.08.2025 02:14" -> "4.08.2025"
            const [day, month, year] = datePart.split('.');
            if (day && month && year) {
              const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              return (
                <Typography variant="body2">
                  {new Date(isoDate).toLocaleDateString('tr-TR')}
                </Typography>
              );
            }
          }
          
          return <Typography variant="body2">{params.value}</Typography>;
        } catch (error) {
          console.warn('Tarih parse hatası:', params.value, error);
          return <Typography variant="body2">{params.value}</Typography>;
        }
      }
    },
    {
      field: 'Alıcı',
      headerName: 'Müşteri',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || 'N/A'}>
          <Typography variant="body2" noWrap>
            {params.value || 'N/A'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'Şehir',
      headerName: 'Şehir',
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
      field: 'Ürün Adı',
      headerName: 'Ürün',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || 'N/A'}>
          <Typography variant="body2" noWrap>
            {params.value || 'N/A'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'Adet',
      headerName: 'Adet',
      width: 80,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {parseInt(params.value || 0)}
        </Typography>
      )
    },
    {
      field: 'Faturalandırılacak Satış Fiyatı',
      headerName: 'Satış Fiyatı (₺)',
      width: 140,
      type: 'number',
      renderCell: (params) => {
        const value = parseFloat(params.value || 0);
        // Çok büyük sayıları kısalt
        const formattedValue = value > 1000000 
          ? (value / 1000000).toFixed(1) + 'M'
          : value.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        
        return (
          <Typography variant="body2" color="success.main" fontWeight="bold">
            ₺{formattedValue}
          </Typography>
        );
      }
    },
    {
      field: 'Komisyon Tutarı (KDV Dahil)',
      headerName: 'Komisyon (₺)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="error.main">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'Kargo Firması',
      headerName: 'Kargo',
      width: 110,
      renderCell: (params) => {
        const kargo = params.value || 'N/A';
        const color = kargo === 'hepsiJET' ? 'warning' : kargo === 'Aras Kargo' ? 'info' : 'default';
        return (
          <Chip
            label={kargo}
            size="small"
            color={color}
            variant="filled"
          />
        );
      }
    },
    {
      field: 'Paket Durumu',
      headerName: 'Durum',
      width: 130,
      renderCell: (params) => {
        const durum = params.value || 'N/A';
        const color = durum === 'Teslim edildi' ? 'success' : 
                      durum === 'Kargoda' ? 'warning' : 
                      durum === 'Hazırlanıyor' ? 'info' : 'error';
        return (
          <Chip
            label={durum}
            size="small"
            color={color}
            variant="filled"
          />
        );
      }
    },
    {
      field: 'Müşteri Tipi',
      headerName: 'Müşteri Tipi',
      width: 120,
      renderCell: (params) => {
        const tip = params.value || 'Bireysel';
        return (
          <Chip
            label={tip}
            size="small"
            color={tip === 'Kurumsal' ? 'secondary' : 'default'}
            variant="outlined"
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
          <Tooltip title="Siparişi düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEditDialog(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Siparişi sil">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteSiparis(params.row)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Export CSV
  const exportToCSV = () => {
    const savedSiparisler = localStorage.getItem('hb_siparisler');
    const currentSiparisler = savedSiparisler ? JSON.parse(savedSiparisler) : siparisler;
    
    const currentFilteredSiparisler = currentSiparisler.filter(siparis => {
      const matchesSearch = !searchTerm || 
        (siparis['Ürün Adı'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (siparis['Alıcı'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (siparis['Kategori'] || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSiparisNo = !siparisNoSearch || 
        (siparis['Sipariş Numarası'] || '').toLowerCase().includes(siparisNoSearch.toLowerCase());
      
      const matchesSehir = !selectedSehir || 
        (siparis['Şehir'] || 'Bilinmeyen') === selectedSehir;
      
      const matchesKargo = !selectedKargo || 
        (siparis['Kargo Firması'] || 'Bilinmeyen') === selectedKargo;
      
      const matchesDurum = !selectedDurum || 
        (siparis['Paket Durumu'] || 'Bilinmeyen') === selectedDurum;
      
      const matchesMusteriTipi = !selectedMusteriTipi || 
        (siparis['Müşteri Tipi'] || 'Bireysel') === selectedMusteriTipi;
      
      return matchesSearch && matchesSiparisNo && matchesSehir && matchesKargo && matchesDurum && matchesMusteriTipi;
    });
    
    if (!currentFilteredSiparisler || currentFilteredSiparisler.length === 0) {
      alert('Dışa aktarılacak veri bulunamadı!');
      return;
    }

    const exportData = currentFilteredSiparisler.map(siparis => ({
      'Sipariş Numarası': siparis['Sipariş Numarası'] || '',
      'Paket Numarası': siparis['Paket Numarası'] || '',
      'Sipariş Tarihi': siparis['Sipariş Tarihi'] || '',
      'Alıcı': siparis['Alıcı'] || '',
      'Şehir': siparis['Şehir'] || '',
      'Ürün Adı': siparis['Ürün Adı'] || '',
      'Satıcı Stok Kodu': siparis['Satıcı Stok Kodu'] || '',
      'Kategori': siparis['Kategori'] || '',
      'Adet': parseInt(siparis['Adet'] || 0),
      'Faturalandırılacak Satış Fiyatı': parseFloat(siparis['Faturalandırılacak Satış Fiyatı'] || 0),
      'Komisyon Tutarı (KDV Dahil)': parseFloat(siparis['Komisyon Tutarı (KDV Dahil)'] || 0),
      'Kargo Firması': siparis['Kargo Firması'] || '',
      'Paket Durumu': siparis['Paket Durumu'] || '',
      'Müşteri Tipi': siparis['Müşteri Tipi'] || '',
      'Son Güncelleme': new Date().toLocaleString('tr-TR')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hepsiburada Siparişler');

    const fileName = `hepsiburada_siparisler_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSiparisNoSearch('');
    setSelectedSehir('');
    setSelectedKargo('');
    setSelectedDurum('');
    setSelectedMusteriTipi('');
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        📦 Hepsiburada Sipariş Yönetimi
      </Typography>

      {/* Upload/Export Section */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            CSV Yükle
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={filteredSiparisler.length === 0}
            onClick={exportToCSV}
          >
            Excel İndir ({filteredSiparisler.length})
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Manuel Sipariş Ekle
          </Button>
        </Box>
      </Paper>

      {siparisler.length === 0 ? (
        <Alert severity="info">
          📤 Sipariş verilerini görüntülemek için CSV dosyanızı yükleyin.
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
              <Grid item xs={12} md={2.5}>
                <TextField
                  fullWidth
                  label="Ürün / Müşteri Ara"
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
              <Grid item xs={12} md={2.5}>
                <TextField
                  fullWidth
                  label="Sipariş No"
                  value={siparisNoSearch}
                  onChange={(e) => setSiparisNoSearch(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={1.5}>
                <FormControl fullWidth>
                  <InputLabel>Şehir</InputLabel>
                  <Select
                    value={selectedSehir}
                    onChange={(e) => setSelectedSehir(e.target.value)}
                    label="Şehir"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {sehirOptions.map(sehir => (
                      <MenuItem key={sehir} value={sehir}>{sehir}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1.5}>
                <FormControl fullWidth>
                  <InputLabel>Kargo</InputLabel>
                  <Select
                    value={selectedKargo}
                    onChange={(e) => setSelectedKargo(e.target.value)}
                    label="Kargo"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {kargoOptions.map(kargo => (
                      <MenuItem key={kargo} value={kargo}>{kargo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1.5}>
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
              <Grid item xs={12} md={1.5}>
                <FormControl fullWidth>
                  <InputLabel>Müşteri Tipi</InputLabel>
                  <Select
                    value={selectedMusteriTipi}
                    onChange={(e) => setSelectedMusteriTipi(e.target.value)}
                    label="Müşteri Tipi"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {musteriTipiOptions.map(tip => (
                      <MenuItem key={tip} value={tip}>{tip}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1}>
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
                  <ShoppingCartIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" color="primary.main">
                    {filteredSiparisler.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filtrelenmiş Sipariş
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <MoneyIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" color="success.main">
                    ₺{filteredSiparisler.reduce((sum, s) => sum + parseFloat(s['Faturalandırılacak Satış Fiyatı'] || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Gelir
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <LocalShippingIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h6" color="info.main">
                    {filteredSiparisler.reduce((sum, s) => sum + parseInt(s['Adet'] || 0), 0).toLocaleString('tr-TR')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Adet
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <PersonIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h6" color="secondary.main">
                    {new Set(filteredSiparisler.map(s => s['Alıcı'])).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Farklı Müşteri
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* DataGrid */}
          <Paper elevation={3} sx={{ height: 600 }}>
            <DataGrid
              rows={filteredSiparisler.map((siparis, index) => {
                // Farklı kolon isimleri için fallback
                const siparisNo = siparis['Sipariş Numarası'] || siparis['Siparis Numarasi'] || '';
                const kalemNo = siparis['Kalem Numarası'] || siparis['Kalem Numarasi'] || index;
                
                // Veriyi temizle ve standartlaştır - yardımcı fonksiyonları kullan
                const cleanedSiparis = { ...siparis };
                Object.keys(cleanedSiparis).forEach(key => {
                  const fieldType = getFieldType(key);
                  cleanedSiparis[key] = cleanDataValue(cleanedSiparis[key], fieldType);
                });
                
                return { 
                  ...cleanedSiparis, 
                  id: `${siparisNo || index}_${kalemNo || index}_${index}` 
                };
              })}
              columns={columns}
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
              pageSizeOptions={[25, 50, 100]}
              disableSelectionOnClick
              autoHeight={false}
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8f9fa',
                },
                '& .MuiDataGrid-virtualScroller': {
                  height: '500px !important',
                }
              }}
            />
          </Paper>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Sipariş Düzenle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sipariş Numarası"
                value={editForm['Sipariş Numarası'] || ''}
                onChange={(e) => handleFormChange('Sipariş Numarası', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Paket Numarası"
                value={editForm['Paket Numarası'] || ''}
                onChange={(e) => handleFormChange('Paket Numarası', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alıcı"
                value={editForm['Alıcı'] || ''}
                onChange={(e) => handleFormChange('Alıcı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Şehir"
                value={editForm['Şehir'] || ''}
                onChange={(e) => handleFormChange('Şehir', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Adet"
                type="number"
                value={editForm['Adet'] || ''}
                onChange={(e) => handleFormChange('Adet', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Satış Fiyatı"
                type="number"
                value={editForm['Faturalandırılacak Satış Fiyatı'] || ''}
                onChange={(e) => handleFormChange('Faturalandırılacak Satış Fiyatı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Kargo Firması</InputLabel>
                <Select
                  value={editForm['Kargo Firması'] || 'hepsiJET'}
                  onChange={(e) => handleFormChange('Kargo Firması', e.target.value)}
                  label="Kargo Firması"
                >
                  <MenuItem value="hepsiJET">hepsiJET</MenuItem>
                  <MenuItem value="Aras Kargo">Aras Kargo</MenuItem>
                  <MenuItem value="MNG Kargo">MNG Kargo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Paket Durumu</InputLabel>
                <Select
                  value={editForm['Paket Durumu'] || 'Hazırlanıyor'}
                  onChange={(e) => handleFormChange('Paket Durumu', e.target.value)}
                  label="Paket Durumu"
                >
                  <MenuItem value="Hazırlanıyor">Hazırlanıyor</MenuItem>
                  <MenuItem value="Kargoda">Kargoda</MenuItem>
                  <MenuItem value="Teslim edildi">Teslim edildi</MenuItem>
                  <MenuItem value="Teslim edilemedi">Teslim edilemedi</MenuItem>
                  <MenuItem value="İade">İade</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ürün Adı"
                value={editForm['Ürün Adı'] || ''}
                onChange={(e) => handleFormChange('Ürün Adı', e.target.value)}
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Yeni Sipariş Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sipariş Numarası"
                value={editForm['Sipariş Numarası'] || ''}
                onChange={(e) => handleFormChange('Sipariş Numarası', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Paket Numarası"
                value={editForm['Paket Numarası'] || ''}
                onChange={(e) => handleFormChange('Paket Numarası', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alıcı"
                value={editForm['Alıcı'] || ''}
                onChange={(e) => handleFormChange('Alıcı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Şehir"
                value={editForm['Şehir'] || ''}
                onChange={(e) => handleFormChange('Şehir', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Adet"
                type="number"
                value={editForm['Adet'] || ''}
                onChange={(e) => handleFormChange('Adet', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Satış Fiyatı"
                type="number"
                value={editForm['Faturalandırılacak Satış Fiyatı'] || ''}
                onChange={(e) => handleFormChange('Faturalandırılacak Satış Fiyatı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Kargo Firması</InputLabel>
                <Select
                  value={editForm['Kargo Firması'] || 'hepsiJET'}
                  onChange={(e) => handleFormChange('Kargo Firması', e.target.value)}
                  label="Kargo Firması"
                >
                  <MenuItem value="hepsiJET">hepsiJET</MenuItem>
                  <MenuItem value="Aras Kargo">Aras Kargo</MenuItem>
                  <MenuItem value="MNG Kargo">MNG Kargo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Müşteri Tipi</InputLabel>
                <Select
                  value={editForm['Müşteri Tipi'] || 'Bireysel'}
                  onChange={(e) => handleFormChange('Müşteri Tipi', e.target.value)}
                  label="Müşteri Tipi"
                >
                  <MenuItem value="Bireysel">Bireysel</MenuItem>
                  <MenuItem value="Kurumsal">Kurumsal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ürün Adı"
                value={editForm['Ürün Adı'] || ''}
                onChange={(e) => handleFormChange('Ürün Adı', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} startIcon={<CancelIcon />}>
            İptal
          </Button>
          <Button onClick={handleAddSiparis} variant="contained" startIcon={<SaveIcon />}>
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Hepsiburada Sipariş Verileri Yükle (.csv)</DialogTitle>
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

export default HepsiburadaSiparisTablosu;
