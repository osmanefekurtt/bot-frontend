import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Typography,
  useTheme,
  IconButton,
  Snackbar
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function SetProxy() {
  const theme = useTheme();
  const [rawProxy, setRawProxy] = useState('');
  const [formattedProxy, setFormattedProxy] = useState('');
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  const convertProxy = (rawText) => {
    // Boş satırları filtrele ve her satırı işle
    const formatted = rawText
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const parts = line.trim().split(':');
        if (parts.length === 4) {
          const [host, port, username, password] = parts;
          return `http://${username}:${password}@${host}:${port}`;
        }
        return ''; // Geçersiz format
      })
      .filter(line => line !== '') // Geçersiz formatları filtrele
      .join('\n');

    setFormattedProxy(formatted);
  };

  const handleCopy = async () => {
    if (formattedProxy) {
      try {
        await navigator.clipboard.writeText(formattedProxy);
        setShowCopyNotification(true);
      } catch (err) {
        console.error('Kopyalama başarısız:', err);
      }
    }
  };

  // Raw proxy değiştiğinde dönüştürme işlemini yap
  useEffect(() => {
    convertProxy(rawProxy);
  }, [rawProxy]);

  return (
    <Box sx={{ 
      p: 3, 
      height: '100%',
      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f4f4f4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          display: 'flex',
          gap: 2,
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          width: '90%'
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Ham Proxy
          </Typography>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={rawProxy}
            onChange={(e) => setRawProxy(e.target.value)}
            placeholder="Her satıra bir proxy gelecek şekilde yazın&#10;Format: host:port:username:password"
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '14px',
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 1
          }}>
            <Typography variant="subtitle1">
              Dönüştürülmüş Proxy
            </Typography>
            <IconButton 
              onClick={handleCopy}
              size="small"
              sx={{ 
                opacity: formattedProxy ? 1 : 0.5,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                }
              }}
              disabled={!formattedProxy}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={formattedProxy}
            InputProps={{
              readOnly: true,
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '14px',
                backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
              },
            }}
          />
        </Box>
      </Paper>

      <Snackbar
        open={showCopyNotification}
        autoHideDuration={2000}
        onClose={() => setShowCopyNotification(false)}
        message="Proxy'ler kopyalandı"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}