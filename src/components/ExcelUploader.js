import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { Upload as UploadIcon, InsertDriveFile as ExcelIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

const ExcelUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
        setError('');
        setPreview(null);
      } else {
        setError('Lütfen geçerli bir Excel dosyası (.xlsx veya .xls) seçin.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const data = await readExcelFile(file);
      onUpload(data);
      setPreview({
        rowCount: data.length,
        columns: Object.keys(data[0] || {}),
        sampleData: data.slice(0, 3)
      });
    } catch (err) {
      setError('Dosya okunurken bir hata oluştu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // İlk satırı başlık olarak kullan
          const headers = jsonData[0];
          const rows = jsonData.slice(1);
          
          const processedData = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              if (header) {
                obj[header] = row[index] || '';
              }
            });
            return obj;
          }).filter(row => Object.values(row).some(value => value !== ''));
          
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsBinaryString(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const event = { target: { files: [droppedFile] } };
      handleFileChange(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📁 Excel Dosyası Yükle
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed #ccc',
              borderColor: file ? 'primary.main' : '#ccc',
              backgroundColor: file ? 'primary.50' : 'background.paper',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <ExcelIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Excel Dosyasını Seçin veya Sürükleyin
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              .xlsx veya .xls formatında sipariş verilerinizi yükleyin
            </Typography>
            
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="excel-file-input"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="excel-file-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                size="large"
                sx={{ borderRadius: 2 }}
              >
                Dosya Seç
              </Button>
            </label>
            
            {file && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={file.name}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}
          </Paper>
          
          {file && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                size="large"
                sx={{ borderRadius: 2 }}
              >
                {loading ? 'Yükleniyor...' : 'Dosyayı İşle'}
              </Button>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {preview && (
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Dosya Önizleme
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${preview.rowCount} Satır`}
                    color="success"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${preview.columns.length} Sütun`}
                    color="info"
                  />
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Sütunlar:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {preview.columns.slice(0, 10).map((col, index) => (
                    <Chip
                      key={index}
                      label={col}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {preview.columns.length > 10 && (
                    <Chip
                      label={`+${preview.columns.length - 10} daha`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  İlk 3 Satır:
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {preview.sampleData.map((row, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Satır {index + 1}:
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {Object.values(row).slice(0, 3).join(' | ')}...
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExcelUploader;
