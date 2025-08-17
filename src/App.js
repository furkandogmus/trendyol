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
  Snackbar,
  IconButton
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// Trendyol Components
import UrunTablosu from './components/UrunTablosu';
import SiparisTablosu from './components/SiparisTablosu';
import KarAnalizi from './components/KarAnalizi';
import Dashboard from './components/Dashboard';

// Hepsiburada Components
import HepsiburadaDashboard from './components/HepsiburadaDashboard';
import HepsiburadaUrunTablosu from './components/HepsiburadaUrunTablosu';
import HepsiburadaSiparisTablosu from './components/HepsiburadaSiparisTablosu';
import HepsiburadaKarAnalizi from './components/HepsiburadaKarAnalizi';

// Platform Components
import PlatformSelector from './components/PlatformSelector';
import { PlatformProvider, usePlatform } from './contexts/PlatformContext';



// Platform temasını dinamik olarak ayarla
const getPlatformTheme = (platform) => {
  const baseTheme = {
    palette: {
      mode: 'light',
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
  };

  if (platform === 'hepsiburada') {
    return createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        primary: {
          main: '#ff6000',
          light: '#ff8f50',
          dark: '#cc4d00',
        },
        secondary: {
          main: '#1976d2',
        },
      },
    });
  } else if (platform === 'trendyol') {
    return createTheme({
      ...baseTheme,
      palette: {
        ...baseTheme.palette,
        primary: {
          main: '#f27a1a',
        },
        secondary: {
          main: '#dc004e',
        },
      },
    });
  }

  return createTheme(baseTheme);
};

// Ana Platform Bileşeni
const PlatformApp = () => {
  const {
    currentPlatform,
    setCurrentPlatform,
    urunler,
    siparisler,
    handleUrunUpload,
    handleSiparisUpload,
    handleUrunUpdate,
    handleSiparisUpdate,
    handleSiparisAdd
  } = usePlatform();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const onUrunUploadWithSnackbar = (data) => {
    handleUrunUpload(data);
    showSnackbar(`${data.length} ürün başarıyla yüklendi!`);
  };

  const onSiparisUploadWithSnackbar = (data) => {
    handleSiparisUpload(data);
    showSnackbar(`${data.length} sipariş başarıyla yüklendi!`);
  };

  const onUrunUpdateWithSnackbar = (originalUrun, updatedUrun) => {
    handleUrunUpdate(originalUrun, updatedUrun);
    showSnackbar('Ürün başarıyla güncellendi!');
  };

  const onSiparisUpdateWithSnackbar = (originalSiparis, updatedSiparis) => {
    handleSiparisUpdate(originalSiparis, updatedSiparis);
    showSnackbar('Sipariş başarıyla güncellendi!');
  };

  const onSiparisAddWithSnackbar = (newSiparis) => {
    handleSiparisAdd(newSiparis);
    showSnackbar('Yeni sipariş başarıyla eklendi!');
  };

  const renderContent = () => {
    if (currentPlatform === 'hepsiburada') {
      switch (activeTab) {
        case 'dashboard':
          return <HepsiburadaDashboard urunler={urunler} siparisler={siparisler} />;
        case 'urunler':
          return <HepsiburadaUrunTablosu 
            urunler={urunler} 
            onUrunUpdate={onUrunUpdateWithSnackbar}
            onUrunUpload={onUrunUploadWithSnackbar}
          />;
        case 'siparisler':
          return <HepsiburadaSiparisTablosu 
            siparisler={siparisler} 
            onSiparisUpdate={onSiparisUpdateWithSnackbar}
            onSiparisAdd={onSiparisAddWithSnackbar}
            onSiparisUpload={onSiparisUploadWithSnackbar}
          />;
        case 'kar-analizi':
          return <HepsiburadaKarAnalizi 
            urunler={urunler} 
            siparisler={siparisler}
            urunMaliyetleri={
              urunler.reduce((acc, urun) => {
                const stokKodu = urun['Satıcı Stok Kodu'];
                const dolarFiyat = parseFloat(urun['Dolar Fiyatı'] || 0);
                const dolarKuru = parseFloat(localStorage.getItem('hb_dolar_kuru') || '42.0');
                const tlMaliyet = dolarFiyat * dolarKuru;
                if (stokKodu) {
                  acc[stokKodu] = tlMaliyet;
                }
                return acc;
              }, {})
            }
          />;
        default:
          return <HepsiburadaDashboard urunler={urunler} siparisler={siparisler} />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard urunler={urunler} />;
        case 'urunler':
          return <UrunTablosu 
            urunler={urunler} 
            onUrunUpdate={onUrunUpdateWithSnackbar}
            onUrunUpload={onUrunUploadWithSnackbar}
          />;
        case 'siparisler':
          return <SiparisTablosu 
            siparisler={siparisler} 
            onSiparisUpdate={onSiparisUpdateWithSnackbar}
            onSiparisAdd={onSiparisAddWithSnackbar}
            onSiparisUpload={onSiparisUploadWithSnackbar}
          />;
        case 'kar-analizi':
          return <KarAnalizi urunler={urunler} siparisler={siparisler} />;
        default:
          return <Dashboard urunler={urunler} />;
      }
    }
  };

  const getPlatformName = () => {
    return currentPlatform === 'hepsiburada' ? 'Hepsiburada' : 'Trendyol';
  };

  const getPlatformIcon = () => {
    return currentPlatform === 'hepsiburada' ? '🛒' : '🛍️';
  };

  if (!currentPlatform) {
    return <PlatformSelector onPlatformSelect={setCurrentPlatform} />;
  }

  return (
    <ThemeProvider theme={getPlatformTheme(currentPlatform)}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Container maxWidth="xl">
            <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{getPlatformIcon()}</span>
                  {getPlatformName()} - Sipariş Takip Sistemi
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Excel verilerinizi yükleyin, ürünlerinizi düzenleyin, siparişlerinizi takip edin
                </Typography>
              </Box>
              <IconButton 
                onClick={() => setCurrentPlatform(null)}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
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
};

function App() {
  return (
    <PlatformProvider>
      <PlatformApp />
    </PlatformProvider>
  );
}

export default App;
