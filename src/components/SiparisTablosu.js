import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const SiparisTablosu = ({ siparisler }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stockCodeSearch, setStockCodeSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedKargo, setSelectedKargo] = useState('');

  // Filtreleme seçenekleri - moved before early return
  const statusOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const statuses = [...new Set(siparisler.map(s => s['Sipariş Statüsü'] || s['Siparis Statusu'] || 'Bilinmeyen'))];
    return statuses.filter(Boolean);
  }, [siparisler]);

  const cityOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const cities = [...new Set(siparisler.map(s => s['İl'] || s['Il'] || 'Bilinmeyen'))];
    return cities.filter(Boolean);
  }, [siparisler]);

  const kargoOptions = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    const kargos = [...new Set(siparisler.map(s => s['Kargo Firması'] || s['Kargo Firmasi'] || 'Bilinmeyen'))];
    return kargos.filter(Boolean);
  }, [siparisler]);

  // Filtrelenmiş veri - moved before early return
  const filteredSiparisler = useMemo(() => {
    if (!siparisler || siparisler.length === 0) return [];
    
    return siparisler.filter(siparis => {
      const matchesSearch = searchTerm === '' || 
        Object.values(siparis).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStockCode = stockCodeSearch === '' || 
        String(siparis['Stok Kodu'] || '').toLowerCase().includes(stockCodeSearch.toLowerCase());
      
      const matchesStatus = selectedStatus === '' || 
        (siparis['Sipariş Statüsü'] || siparis['Siparis Statusu']) === selectedStatus;
      
      const matchesCity = selectedCity === '' || 
        (siparis['İl'] || siparis['Il']) === selectedCity;
      
      const matchesKargo = selectedKargo === '' || 
        (siparis['Kargo Firması'] || siparis['Kargo Firmasi']) === selectedKargo;

      return matchesSearch && matchesStockCode && matchesStatus && matchesCity && matchesKargo;
    });
  }, [siparisler, searchTerm, stockCodeSearch, selectedStatus, selectedCity, selectedKargo]);

  if (!siparisler || siparisler.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          📋 Sipariş tablosunu görmek için önce Excel dosyası yükleyin.
        </Alert>
      </Box>
    );
  }

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
      field: 'Ürün Adı',
      headerName: 'Ürün + Stok Kodu',
      width: 250,
      renderCell: (params) => {
        const urunAdi = params.value || 'N/A';
        const stokKodu = params.row['Stok Kodu'] || 'N/A';
        const displayText = `${urunAdi} (${stokKodu})`;
        
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
      field: 'Stok Kodu',
      headerName: 'Stok Kodu',
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
      field: 'İl',
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
      field: 'Sipariş Statüsü',
      headerName: 'Durum',
      width: 150,
      renderCell: (params) => {
        const status = params.value || 'Bilinmeyen';
        let color = 'default';
        
        if (status.includes('Teslim') || status.includes('Tamamlandı')) color = 'success';
        else if (status.includes('Hazırlanıyor') || status.includes('Kargoda')) color = 'warning';
        else if (status.includes('İptal') || status.includes('Red')) color = 'error';
        
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
      headerName: 'Adet',
      width: 80,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || 0}
        </Typography>
      )
    },
    {
      field: 'Birim Fiyatı',
      headerName: 'Birim Fiyat',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="success.main" fontWeight="bold">
          ₺{parseFloat(params.value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      field: 'Satış Tutarı',
      headerName: 'Toplam Tutar',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" color="primary.main" fontWeight="bold">
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
      field: 'Sipariş Tarihi',
      headerName: 'Tarih',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? new Date(params.value).toLocaleDateString('tr-TR') : 'N/A'}
        </Typography>
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
      Object.keys(filteredSiparisler[0] || {}).join(','),
      // Veri satırları
      ...filteredSiparisler.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `siparisler_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📋 Sipariş Tablosu
      </Typography>

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
              <InputLabel>Şehir</InputLabel>
              <Select
                value={selectedCity}
                label="Şehir"
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
            <FormControl fullWidth size="small">
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
                Toplam Satış
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="warning.main">
                {filteredSiparisler.reduce((sum, s) => sum + parseInt(s['Adet'] || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Adet
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="info.main">
                {filteredSiparisler.length > 0 ? 
                  (filteredSiparisler.reduce((sum, s) => sum + parseFloat(s['Satış Tutarı'] || 0), 0) / filteredSiparisler.length).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : 0
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ortalama Tutar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="secondary.main">
                {filteredSiparisler.filter(s => s['Stok Kodu'] && s['Stok Kodu'].trim() !== '').length}
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
                {filteredSiparisler.filter(s => !s['Stok Kodu'] || s['Stok Kodu'].trim() === '').length}
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
          rows={filteredSiparisler.map((siparis, index) => ({ ...siparis, id: index }))}
          columns={columns}
          pageSize={25}
          rowsPerPageOptions={[25, 50, 100]}
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
    </Box>
  );
};

export default SiparisTablosu;
