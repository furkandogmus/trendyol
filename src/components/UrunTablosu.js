import React, { useState, useMemo, useEffect } from 'react';
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
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import ExcelUploader from './ExcelUploader';

const UrunTablosu = ({ urunler, onUrunUpdate, onUrunUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockCodeSearch, setStockCodeSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedKargo, setSelectedKargo] = useState('');
  const [dolarKuru, setDolarKuru] = useState(30.0); // Varsayılan dolar kuru
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUrun, setEditingUrun] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // localStorage'dan dolar kurunu yükle
  useEffect(() => {
    const savedDolarKuru = localStorage.getItem('dolarKuru');
    if (savedDolarKuru) {
      setDolarKuru(parseFloat(savedDolarKuru));
    }
  }, []);

  // Dolar kurunu localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('dolarKuru', dolarKuru.toString());
  }, [dolarKuru]);

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
    if (onUrunUpload) {
      onUrunUpload(data);
    }
    handleCloseUploadDialog();
  };

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

  // Filtreleme seçenekleri
  const statusOptions = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    const statuses = [...new Set(urunler.map(u => u['Durum'] || 'Bilinmeyen'))];
    return statuses.filter(Boolean);
  }, [urunler]);

  const categoryOptions = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    const categories = [...new Set(urunler.map(u => u['Kategori İsmi'] || 'Bilinmeyen'))];
    return categories.filter(Boolean);
  }, [urunler]);

  const brandOptions = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    const brands = [...new Set(urunler.map(u => u['Marka'] || 'Bilinmeyen'))];
    return brands.filter(Boolean);
  }, [urunler]);

  // Filtrelenmiş veri
  const filteredUrunler = useMemo(() => {
    if (!urunler || urunler.length === 0) return [];
    
    return urunler.filter(urun => {
      const matchesSearch = searchTerm === '' || 
        Object.values(urun).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStockCode = stockCodeSearch === '' || 
        String(urun['Tedarikçi Stok Kodu'] || '').toLowerCase().includes(stockCodeSearch.toLowerCase());
      
      const matchesStatus = selectedStatus === '' || 
        (urun['Durum']) === selectedStatus;
      
      const matchesCategory = selectedCity === '' || 
        (urun['Kategori İsmi']) === selectedCity;
      
      const matchesBrand = selectedKargo === '' || 
        (urun['Marka']) === selectedKargo;

      return matchesSearch && matchesStockCode && matchesStatus && matchesCategory && matchesBrand;
    });
  }, [urunler, searchTerm, stockCodeSearch, selectedStatus, selectedCity, selectedKargo]);



  // DataGrid sütunları
  const columns = [
    {
      field: 'Partner ID',
      headerName: 'Partner ID',
      width: 120,
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
      headerName: 'Ürün Adı',
      width: 250,
      renderCell: (params) => {
        const urunAdi = params.value || 'N/A';
        const displayText = `${urunAdi}`;
        
        return (
          <Tooltip title={displayText}>
            <Typography variant="body2" noWrap>
              {displayText}
            </Typography>
          </Tooltip>
        );
      }
    },
    {
      field: 'Tedarikçi Stok Kodu',
      headerName: 'Stok Kodu',
      width: 150,
      renderCell: (params) => {
        const stokKodu = params.value || 'N/A';
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={stokKodu}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        );
      }
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
      field: 'Kategori İsmi',
      headerName: 'Kategori',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          color="warning"
          variant="outlined"
        />
      )
    },
    {
      field: 'Durum',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => {
        const status = params.value || 'Bilinmeyen';
        let color = 'default';
        
        if (status.includes('Aktif') || status.includes('Aktif')) color = 'success';
        else if (status.includes('Pasif') || status.includes('Pasif')) color = 'error';
        else if (status.includes('Beklemede')) color = 'warning';
        
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
      field: 'Ürün Stok Adedi',
      headerName: 'Stok Adedi',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 0}
        </Typography>
      )
    },
    {
      field: 'Dolar Fiyatı',
      headerName: 'Dolar Fiyatı ($)',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
          <Typography variant="body2" color="success.main" fontWeight="bold">
            ${parseFloat(params.value || 0).toFixed(2)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'TL Fiyatı',
      headerName: 'TL Fiyatı (₺)',
      width: 130,
      type: 'number',
      renderCell: (params) => {
        const dolarFiyat = parseFloat(params.row['Dolar Fiyatı'] || 0);
        const tlFiyat = dolarFiyat * dolarKuru;
        
        return (
          <Typography variant="body2" color="primary.main" fontWeight="bold">
            ₺{tlFiyat.toFixed(2)}
          </Typography>
        );
      }
    },
    {
      field: 'Piyasa Satış Fiyatı (KDV Dahil)',
      headerName: 'Piyasa Fiyatı (₺)',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="warning.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: "Trendyol'da Satılacak Fiyat (KDV Dahil)",
      headerName: 'Trendyol Fiyatı (₺)',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="info.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'BuyBox Fiyatı',
      headerName: 'BuyBox Fiyatı (₺)',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="secondary.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
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
        <Tooltip title="Ürünü düzenle">
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
    setStockCodeSearch('');
    setSelectedStatus('');
    setSelectedCity('');
    setSelectedKargo('');
  };

  const exportToCSV = () => {
    const csvContent = [
      // Başlık satırı
      Object.keys(filteredUrunler[0] || {}).join(','),
      // Veri satırları
      ...filteredUrunler.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `urunler_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ShoppingCartIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5">
          Ürün Tablosu
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleOpenUploadDialog}
          sx={{ ml: 'auto' }}
        >
          Excel Yükle
        </Button>
      </Box>

      {(!urunler || urunler.length === 0) ? (
        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <ShoppingCartIcon />
          Ürün tablosunu görmek için önce Excel dosyası yükleyin.
        </Alert>
      ) : (
        <>
          {/* Dolar Kuru Bilgisi */}
          <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MoneyIcon sx={{ fontSize: 24 }} />
              <Typography variant="h6">
                Güncel Dolar Kuru: ${dolarKuru.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                (Bu kuru Dashboard'dan düzenleyebilirsiniz)
              </Typography>
            </Box>
          </Paper>

          {/* Filtreler */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              placeholder="Arama yapın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              placeholder="Stok Kodu ara..."
              value={stockCodeSearch}
              onChange={(e) => setStockCodeSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
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
            <FormControl fullWidth size="small">
              <InputLabel>Kategori</InputLabel>
              <Select
                value={selectedCity}
                label="Kategori"
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Marka</InputLabel>
              <Select
                value={selectedKargo}
                label="Marka"
                onChange={(e) => setSelectedKargo(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {brandOptions.map((brand) => (
                  <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
              >
                Filtreleri Temizle
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                size="small"
              >
                CSV İndir
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
                {filteredUrunler.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filtrelenmiş Ürün
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="success.main">
                ₺{filteredUrunler.reduce((sum, u) => sum + parseFloat(u['Piyasa Satış Fiyatı (KDV Dahil)'] || 0), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Piyasa Fiyatı (₺)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="info.main">
                ${filteredUrunler.reduce((sum, u) => sum + parseFloat(u['Dolar Fiyatı'] || 0), 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Dolar Fiyatı ($)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="warning.main">
                {filteredUrunler.reduce((sum, u) => sum + parseInt(u['Ürün Stok Adedi'] || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Stok Adedi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="info.main">
                {filteredUrunler.length > 0 ? 
                  (filteredUrunler.reduce((sum, u) => sum + parseFloat(u['Piyasa Satış Fiyatı (KDV Dahil)'] || 0), 0) / filteredUrunler.length).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : 0
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ortalama Piyasa Fiyatı (₺)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="secondary.main">
                {filteredUrunler.filter(u => u['Tedarikçi Stok Kodu'] && u['Tedarikçi Stok Kodu'].trim() !== '').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stok Kodu Olan
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="error.main">
                {filteredUrunler.filter(u => !u['Tedarikçi Stok Kodu'] || u['Tedarikçi Stok Kodu'].trim() === '').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stok Kodu Eksik
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DataGrid */}
      <Paper elevation={3} sx={{ height: 600 }}>
        <DataGrid
          rows={filteredUrunler.map((urun, index) => ({ ...urun, id: index }))}
          columns={columns}
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

      {/* Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
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
                label="Tedarikçi Stok Kodu"
                value={editForm['Tedarikçi Stok Kodu'] || ''}
                onChange={(e) => handleFormChange('Tedarikçi Stok Kodu', e.target.value)}
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
                label="Kategori İsmi"
                value={editForm['Kategori İsmi'] || ''}
                onChange={(e) => handleFormChange('Kategori İsmi', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Durum"
                value={editForm['Durum'] || ''}
                onChange={(e) => handleFormChange('Durum', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ürün Stok Adedi"
                type="number"
                value={editForm['Ürün Stok Adedi'] || ''}
                onChange={(e) => handleFormChange('Ürün Stok Adedi', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dolar Fiyatı ($)"
                type="number"
                value={editForm['Dolar Fiyatı'] || ''}
                onChange={(e) => handleFormChange('Dolar Fiyatı', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Piyasa Satış Fiyatı (KDV Dahil) (₺)"
                type="number"
                value={editForm['Piyasa Satış Fiyatı (KDV Dahil)'] || ''}
                onChange={(e) => handleFormChange('Piyasa Satış Fiyatı (KDV Dahil)', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trendyol'da Satılacak Fiyat (KDV Dahil) (₺)"
                type="number"
                value={editForm["Trendyol'da Satılacak Fiyat (KDV Dahil)"] || ''}
                onChange={(e) => handleFormChange("Trendyol'da Satılacak Fiyat (KDV Dahil)", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="BuyBox Fiyatı (₺)"
                type="number"
                value={editForm['BuyBox Fiyatı'] || ''}
                onChange={(e) => handleFormChange('BuyBox Fiyatı', e.target.value)}
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

        </>
      )}

      {/* Excel Yükleme Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
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

export default UrunTablosu;
