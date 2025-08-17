import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Upload as UploadIcon,
  Analytics as AnalyticsIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import SiparisTablosu from './components/SiparisTablosu';
import KarZararAnalizi from './components/KarZararAnalizi';
import Dashboard from './components/Dashboard';
import ExcelUploader from './components/ExcelUploader';

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
  const [siparisler, setSiparisler] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleExcelUpload = (data) => {
    setSiparisler(data);
    setSnackbar({
      open: true,
      message: `${data.length} sipariş başarıyla yüklendi!`,
      severity: 'success'
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard siparisler={siparisler} />;
      case 'siparisler':
        return <SiparisTablosu siparisler={siparisler} />;
      case 'analiz':
        return <KarZararAnalizi siparisler={siparisler} />;
      case 'upload':
        return <ExcelUploader onUpload={handleExcelUpload} />;
      default:
        return <Dashboard siparisler={siparisler} />;
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
              <Typography variant="h4" component="h1" gutterBottom color="primary">
                📊 Sipariş Takip & Kar-Zarar Analizi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Excel verilerinizi yükleyin, siparişlerinizi takip edin ve kar-zarar hesaplamaları yapın
              </Typography>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="xl">
          {/* Navigation Tabs */}
          <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
              <Button
                variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
                startIcon={<AnalyticsIcon />}
                onClick={() => setActiveTab('dashboard')}
                sx={{ borderRadius: 2 }}
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'siparisler' ? 'contained' : 'outlined'}
                startIcon={<ShoppingCartIcon />}
                onClick={() => setActiveTab('siparisler')}
                sx={{ borderRadius: 2 }}
              >
                Siparişler
              </Button>
              <Button
                variant={activeTab === 'analiz' ? 'contained' : 'outlined'}
                startIcon={<TrendingUpIcon />}
                onClick={() => setActiveTab('analiz')}
                sx={{ borderRadius: 2 }}
              >
                Kar-Zarar Analizi
              </Button>
              <Button
                variant={activeTab === 'upload' ? 'contained' : 'outlined'}
                startIcon={<UploadIcon />}
                onClick={() => setActiveTab('upload')}
                sx={{ borderRadius: 2 }}
              >
                Excel Yükle
              </Button>
            </Box>
          </Paper>

          {/* Main Content */}
          <Box sx={{ mb: 4 }}>
            {renderContent()}
          </Box>
        </Container>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
