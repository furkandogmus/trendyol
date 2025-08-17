import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Avatar,
  Paper,
  Fade
} from '@mui/material';
import {
  ShoppingCart as HepsiburadaIcon,
  Storefront as TrendyolIcon
} from '@mui/icons-material';

const PlatformSelector = ({ onPlatformSelect }) => {
  const platforms = [
    {
      id: 'hepsiburada',
      name: 'Hepsiburada',
      description: 'Hepsiburada siparişleri ve ürünleri için işlemler',
      color: '#ff6000',
      icon: <HepsiburadaIcon sx={{ fontSize: 48 }} />,
      backgroundColor: '#fff5f0'
    },
    {
      id: 'trendyol',
      name: 'Trendyol',
      description: 'Trendyol siparişleri ve ürünleri için işlemler',
      color: '#f27a1a',
      icon: <TrendyolIcon sx={{ fontSize: 48 }} />,
      backgroundColor: '#fff8f0'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Fade in timeout={800}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              mb: 4
            }}
          >
            <Box textAlign="center">
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                📊 Sipariş Takip Sistemi
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Hangi platform için işlem yapmak istiyorsunuz?
              </Typography>
            </Box>
          </Paper>
        </Fade>

        <Grid container spacing={4} justifyContent="center">
          {platforms.map((platform, index) => (
            <Grid item xs={12} sm={6} md={5} key={platform.id}>
              <Fade in timeout={1000 + index * 200}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                    backgroundColor: platform.backgroundColor,
                    border: `2px solid ${platform.color}20`
                  }}
                >
                  <CardActionArea
                    onClick={() => onPlatformSelect(platform.id)}
                    sx={{ 
                      height: '100%',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                      <Avatar
                        sx={{
                          bgcolor: platform.color,
                          width: 80,
                          height: 80,
                          mx: 'auto',
                          mb: 3,
                          boxShadow: 3
                        }}
                      >
                        {platform.icon}
                      </Avatar>
                      
                      <Typography 
                        variant="h4" 
                        component="h2" 
                        gutterBottom
                        sx={{ 
                          color: platform.color,
                          fontWeight: 'bold',
                          mb: 2
                        }}
                      >
                        {platform.name}
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}
                      >
                        {platform.description}
                      </Typography>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: platform.color, 
                            fontWeight: 500,
                            fontSize: '0.9rem'
                          }}
                        >
                          Tıklayın ve başlayın →
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        <Fade in timeout={1500}>
          <Box textAlign="center" sx={{ mt: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Her platform için ayrı veriler saklanır ve yönetilir
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default PlatformSelector;