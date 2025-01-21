import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Typography,
  Button,
  IconButton,
  useTheme,
  Alert,
  Collapse
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';

export default function ProxyChecker() {
  const theme = useTheme();
  const [workingProxies, setWorkingProxies] = useState('');
  const [failedProxies, setFailedProxies] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    show: false
  });

  const showNotification = (message, type = 'error') => {
    setNotification({
      message,
      type,
      show: true
    });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (sendMessage) {
        sendMessage({ action: 'get_check_proxy' });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sendMessage]);

  const workingCount = workingProxies ? workingProxies.split('\n').filter(line => line.trim()).length : 0;
  const failedCount = failedProxies ? failedProxies.split('\n').filter(line => line.trim()).length : 0;


  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage.action === 'get_check_proxy') {
        if (!latestMessage.isError && latestMessage.result) {
          setWorkingProxies(latestMessage.result.proxies.join('\n'));
          setFailedProxies(latestMessage.result.failed_proxies.join('\n'));
          setIsActive(latestMessage.result.is_active);
          // Buton mantığını düzelttik - is_active false ise buton enabled
          setButtonEnabled(!latestMessage.result.is_active);
        }
      } else if (latestMessage.action === 'check_proxy') {
        if (!latestMessage.isError) {
          showNotification('Proxy kontrolü başlatıldı', 'info');
        } else {
          showNotification(latestMessage.error?.message || 'Proxy kontrolü başlatılırken hata oluştu', 'error');
        }
      }
    }
  }, [messages]);

  const handleCheck = () => {
    try {
      if (sendMessage) {
        sendMessage({ action: 'check_proxy' });
      }
    } catch (error) {
      showNotification('Proxy kontrol hatası: ' + error.message, 'error');
    }
  };

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(`${type} kopyalandı`, 'success');
    } catch (err) {
      showNotification('Kopyalama hatası: ' + err.message, 'error');
    }
  };

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
          flexDirection: 'column',
          gap: 2,
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          width: '90%',
          height: '60vh'
        }}
      >
        {/* Control Button */}
        <Box>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleCheck}
            disabled={isActive}
            sx={{ mb: 2 }}
          >
            {isActive ? 'Kontrol Ediliyor...' : 'Kontrol Et'}
          </Button>
        </Box>

        {/* Results Area */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Working Proxies */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1
            }}>
              <Typography variant="subtitle1">
                Çalışan Proxyler
              </Typography>
              <IconButton 
                onClick={() => handleCopy(workingProxies, 'Çalışan proxyler')}
                size="small"
                disabled={!workingProxies}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              multiline
              fullWidth
              rows={10}
              value={workingProxies}
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

          {/* Failed Proxies */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1
            }}>
              <Typography variant="subtitle1">
                Sorunlu Proxyler
              </Typography>
              <IconButton 
                onClick={() => handleCopy(failedProxies, 'Sorunlu proxyler')}
                size="small"
                disabled={!failedProxies}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              multiline
              fullWidth
              rows={10}
              value={failedProxies}
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
        </Box>
      </Paper>

      {/* Notifications */}
      <Collapse in={notification.show}>
        <Alert 
          severity={notification.type}
          sx={{ 
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            minWidth: '300px',
            maxWidth: '400px',
            boxShadow: theme.shadows[3],
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
            color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
          }}
        >
          {notification.message}
        </Alert>
      </Collapse>
    </Box>
  );
}