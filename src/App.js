import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import UrunTablosu from './components/UrunTablosu';
import SiparisTablosu from './components/SiparisTablosu';
import KarAnalizi from './components/KarAnalizi';
import Dashboard from './components/Dashboard';


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [urunler, setUrunler] = useState(() => {
    const saved = localStorage.getItem('urunler');
    return saved ? JSON.parse(saved) : [];
  });
  const [siparisler, setSiparisler] = useState(() => {
    const saved = localStorage.getItem('siparisler');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });



  const handleUrunUpload = (data) => {
    setUrunler(data);
    setSnackbar({
      open: true,
      message: `${data.length} ürün başarıyla yüklendi!`,
      severity: 'success'
    });
  };

  const handleSiparisUpload = (data) => {
    setSiparisler(data);
    setSnackbar({
      open: true,
      message: `${data.length} sipariş başarıyla yüklendi!`,
      severity: 'success'
    });
  };

  const handleUrunUpdate = (originalUrun, updatedUrun) => {
    // Benzersiz alan kombinasyonu ile ürünü bul ve güncelle
    const updatedUrunler = urunler.map(urun => {
      // Tedarikçi Stok Kodu + Ürün Adı kombinasyonu unique olmalı
      if (urun['Tedarikçi Stok Kodu'] === originalUrun['Tedarikçi Stok Kodu'] && 
          urun['Ürün Adı'] === originalUrun['Ürün Adı']) {
        return { ...updatedUrun };
      }
      return urun;
    });
    
    setUrunler(updatedUrunler);
    setSnackbar({
      open: true,
      message: 'Ürün başarıyla güncellendi!',
      severity: 'success'
    });
  };

  const handleSiparisUpdate = (originalSiparis, updatedSiparis) => {
    console.log('App.js - handleSiparisUpdate çağrıldı');
    console.log('originalSiparis:', originalSiparis);
    console.log('updatedSiparis:', updatedSiparis);
    console.log('mevcut siparisler:', siparisler);
    
    // Benzersiz alan kombinasyonu ile siparişi bul ve güncelle
    const updatedSiparisler = siparisler.map(siparis => {
      // Paket No + Sipariş Numarası kombinasyonu unique olmalı
      const originalPaketNo = originalSiparis['Paket No'] || originalSiparis['Sipariş Numarası'] || '';
      const currentPaketNo = siparis['Paket No'] || siparis['Sipariş Numarası'] || '';
      const originalSiparisNo = originalSiparis['Sipariş Numarası'] || originalSiparis['Paket No'] || '';
      const currentSiparisNo = siparis['Sipariş Numarası'] || siparis['Paket No'] || '';
      
      if ((originalPaketNo && currentPaketNo === originalPaketNo) ||
          (originalSiparisNo && currentSiparisNo === originalSiparisNo)) {
        console.log('Eşleşen sipariş bulundu, güncelleniyor:', siparis);
        return { ...updatedSiparis };
      }
      return siparis;
    });
    
    console.log('Güncellenmiş siparişler:', updatedSiparisler);
    setSiparisler(updatedSiparisler);
    setSnackbar({
      open: true,
      message: 'Sipariş başarıyla güncellendi!',
      severity: 'success'
    });
  };

  const handleSiparisAdd = (newSiparis) => {
    setSiparisler(prev => [...prev, newSiparis]);
    setSnackbar({
      open: true,
      message: 'Yeni sipariş başarıyla eklendi!',
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard urunler={urunler} />;
      case 'urunler':
        return <UrunTablosu 
          urunler={urunler} 
          onUrunUpdate={handleUrunUpdate}
          onUrunUpload={handleUrunUpload}
        />;
      case 'siparisler':
        return <SiparisTablosu 
          siparisler={siparisler} 
          onSiparisUpdate={handleSiparisUpdate}
          onSiparisAdd={handleSiparisAdd}
          onSiparisUpload={handleSiparisUpload}
        />;
      case 'kar-analizi':
        return <KarAnalizi urunler={urunler} siparisler={siparisler} />;
      default:
        return <Dashboard urunler={urunler} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Container maxWidth="xl">
            <Box sx={{ py: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon sx={{ fontSize: 36 }} />
                Ürün & Sipariş Takip Sistemi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Excel verilerinizi yükleyin, ürünlerinizi düzenleyin, siparişlerinizi takip edin
              </Typography>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="xl">
          {/* Navigation Tabs */}
          <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1, p: 2, overflowX: 'auto' }}>
                <Button
                  variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
                  startIcon={<AnalyticsIcon />}
                  onClick={() => setActiveTab('dashboard')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'urunler' ? 'contained' : 'outlined'}
                  startIcon={<InventoryIcon />}
                  onClick={() => setActiveTab('urunler')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Ürün Tablosu
                </Button>
                <Button
                  variant={activeTab === 'siparisler' ? 'contained' : 'outlined'}
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => setActiveTab('siparisler')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Sipariş Tablosu
                </Button>
                <Button
                  variant={activeTab === 'kar-analizi' ? 'contained' : 'outlined'}
                  startIcon={<AssessmentIcon />}
                  onClick={() => setActiveTab('kar-analizi')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Kar Analizi
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Content */}
          {renderContent()}
        </Container>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
