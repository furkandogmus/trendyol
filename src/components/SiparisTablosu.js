import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  ShoppingCart as ShoppingCartIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import ExcelUploader from './ExcelUploader';
import * as XLSX from 'xlsx';

const SiparisTablosu = ({ siparisler, onSiparisUpdate, onSiparisAdd, onSiparisUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedUrun, setSelectedUrun] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedKargo, setSelectedKargo] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingSiparis, setEditingSiparis] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState({
    'Sipariş Numarası': '',
    'Barkod': '',
    'Paket No': '',
    'Alıcı': '',
    'Ürün Adı': '',
    'Adet': '',
    'Birim Fiyatı': '',
    'Satış Tutarı': '',
    'Sipariş Tarihi': new Date().toISOString().split('T')[0],
    'Sipariş Statüsü': 'Beklemede',
    'İl': '',
    'İlçe': '',
    'Kargo Firması': '',
    'Marka': '',
    'Stok Kodu': ''
  });

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
    setAddForm({
      'Sipariş Numarası': '',
      'Barkod': '',
      'Paket No': '',
      'Alıcı': '',
      'Ürün Adı': '',
      'Adet': '',
      'Birim Fiyatı': '',
      'Satış Tutarı': '',
      'Sipariş Tarihi': new Date().toISOString().split('T')[0],
      'Sipariş Statüsü': 'Beklemede',
      'İl': '',
      'İlçe': '',
      'Kargo Firması': '',
      'Marka': '',
      'Stok Kodu': ''
    });
    setAddDialogOpen(true);
  };

  // Ekleme dialog'unu kapat
  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setAddForm({
      'Sipariş Numarası': '',
      'Barkod': '',
      'Paket No': '',
      'Alıcı': '',
      'Ürün Adı': '',
      'Adet': '',
      'Birim Fiyatı': '',
      'Satış Tutarı': '',
      'Sipariş Tarihi': new Date().toISOString().split('T')[0],
      'Sipariş Statüsü': 'Beklemede',
      'İl': '',
      'İlçe': '',
      'Kargo Firması': '',
      'Marka': '',
      'Stok Kodu': ''
    });
  };

  // Form değişikliklerini takip et
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Ekleme form değişikliklerini takip et
  const handleAddFormChange = (field, value) => {
    setAddForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Adet ve birim fiyat değiştiğinde satış tutarını hesapla
    if (field === 'Adet' || field === 'Birim Fiyatı') {
      const adet = field === 'Adet' ? value : addForm['Adet'];
      const birimFiyat = field === 'Birim Fiyatı' ? value : addForm['Birim Fiyatı'];
      
      if (adet && birimFiyat) {
        const toplam = parseFloat(adet) * parseFloat(birimFiyat);
        setAddForm(prev => ({
          ...prev,
          'Satış Tutarı': toplam.toFixed(2)
        }));
      }
    }
  };

  // Değişiklikleri kaydet
  const handleSaveChanges = () => {
    if (onSiparisUpdate) {
      onSiparisUpdate(editingSiparis, editForm);
    }
    handleCloseEditDialog();
  };

  // Yeni sipariş ekle
  const handleAddSiparis = () => {
    if (!addForm['Sipariş Numarası'] || !addForm['Alıcı'] || !addForm['Ürün Adı']) {
      alert('Lütfen gerekli alanları doldurun!');
      return;
    }

    if (onSiparisAdd) {
      onSiparisAdd({ ...addForm, id: Date.now() });
    }
    handleCloseAddDialog();
  };

  // Excel yükleme dialog'unu aç
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  // Excel yükleme dialog'unu kapat
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };

  // Excel yükleme işlemi
  const handleExcelUpload = (data) => {
    if (onSiparisUpload) {
      onSiparisUpload(data);
    }
    handleCloseUploadDialog();
  };

  // Filtreleme seçenekleri
  const statusOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return ['Beklemede', 'Hazırlanıyor', 'Kargoda', 'Teslim Edildi', 'İptal Edildi'];
    const statuses = [...new Set(siparisler.map(s => s['Sipariş Statüsü'] || 'Beklemede'))];
    return statuses.filter(Boolean);
  }, [siparisler]);

  const customerOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const customers = [...new Set(siparisler.map(s => s['Alıcı'] || 'Bilinmeyen'))];
    return customers.filter(Boolean);
  }, [siparisler]);

  const urunOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const urunler = [...new Set(siparisler.map(s => s['Ürün Adı'] || 'Bilinmeyen'))];
    return urunler.filter(Boolean);
  }, [siparisler]);

  const cityOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const cities = [...new Set(siparisler.map(s => s['İl'] || 'Bilinmeyen'))];
    return cities.filter(Boolean);
  }, [siparisler]);

  const kargoOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const kargolar = [...new Set(siparisler.map(s => s['Kargo Firması'] || 'Bilinmeyen'))];
    return kargolar.filter(Boolean);
  }, [siparisler]);

  // Filtrelenmiş veri
  const filteredSiparisler = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    
    return siparisler.filter(siparis => {
      const matchesSearch = searchTerm === '' || 
        Object.values(siparis).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = selectedStatus === '' || 
        (siparis['Sipariş Statüsü']) === selectedStatus;
      
      const matchesCustomer = selectedCustomer === '' || 
        (siparis['Alıcı']) === selectedCustomer;
      
      const matchesUrun = selectedUrun === '' || 
        (siparis['Ürün Adı']) === selectedUrun;

      const matchesCity = selectedCity === '' || 
        (siparis['İl']) === selectedCity;

      const matchesKargo = selectedKargo === '' || 
        (siparis['Kargo Firması']) === selectedKargo;

      return matchesSearch && matchesStatus && matchesCustomer && matchesUrun && matchesCity && matchesKargo;
    });
  }, [siparisler, searchTerm, selectedStatus, selectedCustomer, selectedUrun, selectedCity, selectedKargo]);



  // DataGrid sütunları
  const columns = [
    {
      field: 'Sipariş Numarası',
      headerName: 'Sipariş No',
      width: 150,
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
      field: 'Barkod',
      headerName: 'Barkod',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'Paket No',
      headerName: 'Paket No',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'Sipariş Tarihi',
      headerName: 'Sipariş Tarihi',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'Alıcı',
      headerName: 'Alıcı',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'İl',
      headerName: 'İl',
      width: 100,
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
      field: 'İlçe',
      headerName: 'İlçe',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'Ürün Adı',
      headerName: 'Ürün',
      width: 250,
      renderCell: (params) => {
        const urunAdi = params.value || 'N/A';
        
        return (
          <Tooltip title={urunAdi}>
            <Typography variant="body2" noWrap>
              {urunAdi}
            </Typography>
          </Tooltip>
        );
      }
    },
    {
      field: 'Sipariş Statüsü',
      headerName: 'Durum',
      width: 150,
      renderCell: (params) => {
        const status = params.value || 'Bilinmeyen';
        let color = 'default';
        
        if (status.includes('Teslim Edildi') || status.includes('Tamamlandı')) color = 'success';
        else if (status.includes('İptal') || status.includes('İade')) color = 'error';
        else if (status.includes('Beklemede') || status.includes('Hazırlanıyor')) color = 'warning';
        else if (status.includes('Kargoda') || status.includes('Yolda')) color = 'info';
        
        return (
          <Chip
            label={status}
            size="small"
            color={color}
            variant="filled"
          />
        );
      }
    },
    {
      field: 'Adet',
      headerName: 'Miktar',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 0}
        </Typography>
      )
    },
    {
      field: 'Birim Fiyatı',
      headerName: 'Birim Fiyat (₺)',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="primary.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'Satış Tutarı',
      headerName: 'Satış Tutarı (₺)',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="success.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'İndirim Tutarı',
      headerName: 'İndirim (₺)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="error.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'Faturalanacak Tutar',
      headerName: 'Faturalanacak (₺)',
      width: 160,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="warning.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'Kargo Firması',
      headerName: 'Kargo',
      width: 120,
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
      field: 'Kargo Kodu',
      headerName: 'Kargo Kodu',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'Teslim Tarihi',
      headerName: 'Teslim Tarihi',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 'N/A'}
        </Typography>
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
      field: 'Stok Kodu',
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
      field: 'Komisyon Oranı',
      headerName: 'Komisyon (%)',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          %{parseFloat(params.value || 0).toFixed(2)}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Siparişi düzenle">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenEditDialog(params.row)}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedCustomer('');
    setSelectedUrun('');
    setSelectedCity('');
    setSelectedKargo('');
  };

  const exportToExcel = () => {
    if (!filteredSiparisler || filteredSiparisler.length === 0) {
      alert('Dışa aktarılacak veri bulunamadı!');
      return;
    }

    // Sipariş verilerini Excel için hazırla
    const exportData = filteredSiparisler.map(siparis => {
      const satısTutari = parseFloat(siparis['Satış Tutarı'] || 0);
      const indirimTutari = parseFloat(siparis['İndirim Tutarı'] || 0);
      const faturalanacakTutar = parseFloat(siparis['Faturalanacak Tutar'] || 0);
      const komisyonOrani = parseFloat(siparis['Komisyon Oranı'] || 0);
      const komisyonTutari = faturalanacakTutar * (komisyonOrani / 100);
      
      return {
        'Barkod': siparis['Barkod'] || '',
        'Paket No': siparis['Paket No'] || '',
        'Sipariş Tarihi': siparis['Sipariş Tarihi'] || '',
        'Alıcı': siparis['Alıcı'] || '',
        'İl': siparis['İl'] || '',
        'İlçe': siparis['İlçe'] || '',
        'Ürün Adı': siparis['Ürün Adı'] || '',
        'Sipariş Statüsü': siparis['Sipariş Statüsü'] || '',
        'Adet': siparis['Adet'] || '',
        'Birim Fiyatı (₺)': parseFloat(siparis['Birim Fiyatı'] || 0).toFixed(2),
        'Satış Tutarı (₺)': satısTutari.toFixed(2),
        'İndirim Tutarı (₺)': indirimTutari.toFixed(2),
        'Faturalanacak Tutar (₺)': faturalanacakTutar.toFixed(2),
        'Komisyon Oranı (%)': komisyonOrani.toFixed(2),
        'Komisyon Tutarı (₺)': komisyonTutari.toFixed(2),
        'Kargo Firması': siparis['Kargo Firması'] || '',
        'Kargo Kodu': siparis['Kargo Kodu'] || '',
        'Teslim Tarihi': siparis['Teslim Tarihi'] || '',
        'Marka': siparis['Marka'] || '',
        'Stok Kodu': siparis['Stok Kodu'] || '',
        'Son Güncelleme': new Date().toLocaleString('tr-TR')
      };
    });

    // Excel workbook oluştur
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siparişler');

    // Sütun genişliklerini ayarla
    const colWidths = [
      { wch: 15 }, // Barkod
      { wch: 15 }, // Paket No
      { wch: 12 }, // Sipariş Tarihi
      { wch: 20 }, // Alıcı
      { wch: 12 }, // İl
      { wch: 15 }, // İlçe
      { wch: 30 }, // Ürün Adı
      { wch: 15 }, // Sipariş Statüsü
      { wch: 8 },  // Adet
      { wch: 15 }, // Birim Fiyatı
      { wch: 15 }, // Satış Tutarı
      { wch: 15 }, // İndirim Tutarı
      { wch: 18 }, // Faturalanacak Tutar
      { wch: 15 }, // Komisyon Oranı
      { wch: 16 }, // Komisyon Tutarı
      { wch: 15 }, // Kargo Firması
      { wch: 15 }, // Kargo Kodu
      { wch: 12 }, // Teslim Tarihi
      { wch: 15 }, // Marka
      { wch: 20 }, // Stok Kodu
      { wch: 20 }  // Son Güncelleme
    ];
    ws['!cols'] = colWidths;

    // Dosyayı indir
    const fileName = `siparisler_guncellenmiş_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ShoppingCartIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5">
          Sipariş Tablosu
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{ ml: 'auto' }}
        >
          Yeni Sipariş Ekle
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleOpenUploadDialog}
          sx={{ ml: 1 }}
        >
          Excel Yükle
        </Button>
      </Box>

      {(!siparisler || siparisler.length === 0) ? (
        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <ShoppingCartIcon />
          Sipariş tablosunu görmek için önce sipariş verisi ekleyin veya Excel dosyası yükleyin.
        </Alert>
      ) : (
        <>
          {/* Filtreler */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Genel Arama"
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
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={selectedStatus}
                label="Durum"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Alıcı</InputLabel>
              <Select
                value={selectedCustomer}
                label="Alıcı"
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {customerOptions.map((customer) => (
                  <MenuItem key={customer} value={customer}>{customer}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Ürün</InputLabel>
              <Select
                value={selectedUrun}
                label="Ürün"
                onChange={(e) => setSelectedUrun(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {urunOptions.map((urun) => (
                  <MenuItem key={urun} value={urun}>{urun}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>İl</InputLabel>
              <Select
                value={selectedCity}
                label="İl"
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {cityOptions.map((city) => (
                  <MenuItem key={city} value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Kargo</InputLabel>
              <Select
                value={selectedKargo}
                label="Kargo"
                onChange={(e) => setSelectedKargo(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {kargoOptions.map((kargo) => (
                  <MenuItem key={kargo} value={kargo}>{kargo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                fullWidth
              >
                Filtreleri Temizle
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportToExcel}
                fullWidth
              >
                Excel İndir
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Özet Kartları */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="primary">
                {filteredSiparisler.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filtrelenmiş Sipariş
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="success.main">
                ₺{filteredSiparisler.reduce((sum, s) => sum + parseFloat(s['Satış Tutarı'] || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Satış Tutarı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="info.main">
                {filteredSiparisler.reduce((sum, s) => sum + parseInt(s['Adet'] || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Ürün Adedi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="warning.main">
                ₺{filteredSiparisler.reduce((sum, s) => sum + parseFloat(s['İndirim Tutarı'] || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam İndirim
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="secondary.main">
                ₺{filteredSiparisler.reduce((sum, s) => sum + parseFloat(s['Faturalanacak Tutar'] || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Faturalanacak
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="error.main">
                {filteredSiparisler.filter(s => s['Sipariş Statüsü'] === 'Beklemede' || s['Sipariş Statüsü'] === 'Hazırlanıyor').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bekleyen Sipariş
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DataGrid */}
      <Paper elevation={3} sx={{ height: 600 }}>
        <DataGrid
          rows={filteredSiparisler.map((siparis, index) => ({ 
            ...siparis, 
            id: `${siparis['Paket No'] || siparis['Sipariş Numarası'] || index}_${index}` 
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
              borderBottom: '2px solid #e0e0e0',
            },
          }}
        />
      </Paper>

      {/* Düzenleme Dialog */}
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
                label="Barkod"
                value={editForm['Barkod'] || ''}
                onChange={(e) => handleFormChange('Barkod', e.target.value)}
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
                label="Ürün Adı"
                value={editForm['Ürün Adı'] || ''}
                onChange={(e) => handleFormChange('Ürün Adı', e.target.value)}
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
                label="Birim Fiyatı (₺)"
                type="number"
                value={editForm['Birim Fiyatı'] || ''}
                onChange={(e) => handleFormChange('Birim Fiyatı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Satış Tutarı (₺)"
                type="number"
                value={editForm['Satış Tutarı'] || ''}
                onChange={(e) => handleFormChange('Satış Tutarı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İndirim Tutarı (₺)"
                type="number"
                value={editForm['İndirim Tutarı'] || ''}
                onChange={(e) => handleFormChange('İndirim Tutarı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sipariş Tarihi"
                type="date"
                value={editForm['Sipariş Tarihi'] || ''}
                onChange={(e) => handleFormChange('Sipariş Tarihi', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sipariş Statüsü</InputLabel>
                <Select
                  value={editForm['Sipariş Statüsü'] || ''}
                  label="Sipariş Statüsü"
                  onChange={(e) => handleFormChange('Sipariş Statüsü', e.target.value)}
                >
                  <MenuItem value="Beklemede">Beklemede</MenuItem>
                  <MenuItem value="Hazırlanıyor">Hazırlanıyor</MenuItem>
                  <MenuItem value="Kargoda">Kargoda</MenuItem>
                  <MenuItem value="Teslim Edildi">Teslim Edildi</MenuItem>
                  <MenuItem value="İptal Edildi">İptal Edildi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kargo Firması"
                value={editForm['Kargo Firması'] || ''}
                onChange={(e) => handleFormChange('Kargo Firması', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kargo Kodu"
                value={editForm['Kargo Kodu'] || ''}
                onChange={(e) => handleFormChange('Kargo Kodu', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İl"
                value={editForm['İl'] || ''}
                onChange={(e) => handleFormChange('İl', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İlçe"
                value={editForm['İlçe'] || ''}
                onChange={(e) => handleFormChange('İlçe', e.target.value)}
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
                label="Stok Kodu"
                value={editForm['Stok Kodu'] || ''}
                onChange={(e) => handleFormChange('Stok Kodu', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Komisyon Oranı (%)"
                type="number"
                value={editForm['Komisyon Oranı'] || ''}
                onChange={(e) => handleFormChange('Komisyon Oranı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teslim Tarihi"
                type="date"
                value={editForm['Teslim Tarihi'] || ''}
                onChange={(e) => handleFormChange('Teslim Tarihi', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="primary">
            <CancelIcon /> İptal
          </Button>
          <Button onClick={handleSaveChanges} color="primary" variant="contained">
            <SaveIcon /> Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ekleme Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Yeni Sipariş Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sipariş Numarası *"
                value={addForm['Sipariş Numarası'] || ''}
                onChange={(e) => handleAddFormChange('Sipariş Numarası', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Barkod"
                value={addForm['Barkod'] || ''}
                onChange={(e) => handleAddFormChange('Barkod', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Paket No"
                value={addForm['Paket No'] || ''}
                onChange={(e) => handleAddFormChange('Paket No', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alıcı *"
                value={addForm['Alıcı'] || ''}
                onChange={(e) => handleAddFormChange('Alıcı', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ürün Adı *"
                value={addForm['Ürün Adı'] || ''}
                onChange={(e) => handleAddFormChange('Ürün Adı', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Adet *"
                type="number"
                value={addForm['Adet'] || ''}
                onChange={(e) => handleAddFormChange('Adet', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Birim Fiyatı (₺) *"
                type="number"
                value={addForm['Birim Fiyatı'] || ''}
                onChange={(e) => handleAddFormChange('Birim Fiyatı', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Satış Tutarı (₺)"
                type="number"
                value={addForm['Satış Tutarı'] || ''}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: 'grey.100' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sipariş Tarihi"
                type="date"
                value={addForm['Sipariş Tarihi'] || ''}
                onChange={(e) => handleAddFormChange('Sipariş Tarihi', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sipariş Statüsü</InputLabel>
                <Select
                  value={addForm['Sipariş Statüsü'] || ''}
                  label="Sipariş Statüsü"
                  onChange={(e) => handleAddFormChange('Sipariş Statüsü', e.target.value)}
                >
                  <MenuItem value="Beklemede">Beklemede</MenuItem>
                  <MenuItem value="Hazırlanıyor">Hazırlanıyor</MenuItem>
                  <MenuItem value="Kargoda">Kargoda</MenuItem>
                  <MenuItem value="Teslim Edildi">Teslim Edildi</MenuItem>
                  <MenuItem value="İptal Edildi">İptal Edildi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İl"
                value={addForm['İl'] || ''}
                onChange={(e) => handleAddFormChange('İl', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İlçe"
                value={addForm['İlçe'] || ''}
                onChange={(e) => handleAddFormChange('İlçe', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kargo Firması"
                value={addForm['Kargo Firması'] || ''}
                onChange={(e) => handleAddFormChange('Kargo Firması', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marka"
                value={addForm['Marka'] || ''}
                onChange={(e) => handleAddFormChange('Marka', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stok Kodu"
                value={addForm['Stok Kodu'] || ''}
                onChange={(e) => handleAddFormChange('Stok Kodu', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="primary">
            <CancelIcon /> İptal
          </Button>
          <Button onClick={handleAddSiparis} color="primary" variant="contained">
            <AddIcon /> Ekle
          </Button>
        </DialogActions>
      </Dialog>

        </>
      )}

      {/* Excel Yükleme Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="md" fullWidth>
        <DialogTitle>Excel Dosyası Yükle</DialogTitle>
        <DialogContent>
          <ExcelUploader onUploadSuccess={handleExcelUpload} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} color="primary">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiparisTablosu;
