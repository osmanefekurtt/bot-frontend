import { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Grid, 
  Button, 
  TextField, 
  Typography, 
  useTheme, 
  Paper,
  Alert,
  Collapse,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

export default function UnblockAccounts() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logData, setLogData] = useState([]);
  const logRef = useRef(null);
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const statusIntervalRef = useRef(null);

  // Toplu hesap için yeni state'ler
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkAccounts, setBulkAccounts] = useState([]);
  const [bulkAccountText, setBulkAccountText] = useState('');

  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    show: false
  });

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logData]);

  const showNotification = (message, type = 'info') => {
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
    
    if (sendMessage) {
      // Sürekli durum kontrolü için interval ekledim
      statusIntervalRef.current = setInterval(() => {
        sendMessage({ action: 'unblock_status' });
      }, 1000); // Her saniye bir durum kontrolü
    }

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [sendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message) => {
        if (message.action === 'unblock_status' && !message.isError) {
          const statusData = message.result;
          
          // Her status isteğinde logları sıfırla ve gelen logları ekle
          setLogData(statusData.logs?.filter(log => log.message).map(log => ({
            message: log.message,
            color: log.color || 'white',
            timestamp: log.timestamp || new Date().toLocaleTimeString()
          })) || []);
          
          if (statusData.isActive !== undefined) {
            setIsProcessing(statusData.isActive);
            
            if (statusData.email && !email) {
              setEmail(statusData.email);
            }
            
            if (statusData.password && !password) {
              setPassword(statusData.password);
            }
          }

          if (statusData.status === 'completed') {
            setIsProcessing(false);
            showNotification('Bloke kaldırma işlemi tamamlandı', 'success');
          } else if (statusData.status === 'error') {
            setIsProcessing(false);
            showNotification(statusData.message || 'Bir hata oluştu', 'error');
          }
        }
        
        if (message.action === 'unblock_start') {
          if (message.isError) {
            showNotification(message.error.message, 'error');
            setIsProcessing(false);
          } else {
            showNotification('Bloke kaldırma işlemi başlatıldı', 'success');
            setIsProcessing(true);
          }
        }
        
        if (message.action === 'unblock_stop') {
          setIsProcessing(false);
          if (!message.isError) {
            showNotification('Bloke kaldırma işlemi durduruldu', 'info');
          } else {
            showNotification('İşlem durdurulamadı: ' + message.error.message, 'error');
          }
        }
      });
    }
  }, [messages, email, password, sendMessage]);

  const startUnblockProcess = () => {
    if (!email || !password) {
      showNotification('E-posta ve parola alanları zorunludur', 'error');
      return;
    }

    if (sendMessage) {
      sendMessage({
        action: 'unblock_start',
        data: {
          email: email,
          password: password
        }
      });
    }
  };

  const stopUnblockProcess = () => {
    if (window.confirm('Bloke kaldırma işlemini durdurmak istediğinize emin misiniz?')) {
      if (sendMessage) {
        sendMessage({ action: 'unblock_stop' });
      }
    }
  };

  // Toplu hesap işlemleri
  const handleOpenBulkDialog = () => {
    setBulkDialogOpen(true);
  };

  const handleCloseBulkDialog = () => {
    setBulkDialogOpen(false);
  };

  const parseBulkAccounts = () => {
    const lines = bulkAccountText.split('\n').filter(line => line.trim() !== '');
    
    const parsedAccounts = lines.map(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        return {
          email: parts[0].trim(),
          password: parts[1].trim()
        };
      }
      return null;
    }).filter(account => account !== null);
    
    setBulkAccounts(parsedAccounts);
    showNotification(`${parsedAccounts.length} hesap başarıyla yüklendi`, 'success');
  };

  const selectAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    handleCloseBulkDialog();
    showNotification('Hesap bilgileri yüklendi', 'success');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        height: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f4f4f4',
        color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333',
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        Hesap Bloke Kaldırma
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          borderRadius: theme.shape.borderRadius,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4.5}>
            <TextField
              fullWidth
              label="E-posta Adresi"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isProcessing}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#777' : '#999',
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4.5}>
            <TextField
              fullWidth
              label="Parola"
              type="text"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isProcessing}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? '#777' : '#999',
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={6} sm={1.5}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={handleOpenBulkDialog}
              startIcon={<FormatListBulletedIcon />}
              disabled={isProcessing}
              sx={{ height: '56px' }}
            >
              Hesaplar
            </Button>
          </Grid>
          <Grid item xs={6} sm={1.5}>
            {!isProcessing ? (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={startUnblockProcess}
                startIcon={<PlayArrowIcon />}
                disabled={!email || !password}
                sx={{ height: '56px' }}
              >
                Başlat
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="error"
                onClick={stopUnblockProcess}
                startIcon={<StopIcon />}
                sx={{ height: '56px' }}
              >
                Durdur
              </Button>
            )}
          </Grid>
        </Grid>

        {isProcessing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <CircularProgress size={24} />
            <Typography>İşlem devam ediyor...</Typography>
          </Box>
        )}
      </Paper>

      <Box
        ref={logRef}
        sx={{
          width: '100%',
          height: 'calc(100vh - 250px)',
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#000',
          borderRadius: theme.shape.borderRadius,
          display: 'flex',
          flexDirection: 'column',
          color: theme.palette.mode === 'dark' ? '#80ff80' : '#0f0',
          fontFamily: 'monospace',
          fontSize: '10px',
          p: 2,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? '#333' : '#ccc',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          }
        }}
      >
        <div style={{ marginBottom: '8px' }}>Bloke Kaldırma Log Çıktıları</div>
        <Box sx={{ flex: 1 }}>
          {logData.length > 0 ?
            logData.map((log, index) => (
              <div
                key={index}
                style={{
                  color: log.color || 'white',
                  padding: '2px 0',
                }}
              >
                [{log.timestamp}] {log.message}
              </div>
            )) : 
            <Typography sx={{ color: 'grey.500', fontSize: '10px', mt: 1 }}>
              Henüz log bilgisi bulunmuyor. Bloke kaldırma işlemi başlatıldığında burada detayları görebilirsiniz.
            </Typography>
          }
        </Box>
      </Box>

      {/* Toplu Hesap Dialog */}
      <Dialog 
        open={bulkDialogOpen} 
        onClose={handleCloseBulkDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Toplu Hesap Listesi</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Hesapları email:password formatında, her satıra bir hesap gelecek şekilde girin
            </Typography>
            <TextareaAutosize
              minRows={8}
              style={{ 
                width: '100%', 
                padding: '8px',
                borderColor: theme.palette.mode === 'dark' ? '#555' : '#ccc', 
                borderRadius: '4px',
                backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
                color: theme.palette.mode === 'dark' ? '#fff' : '#000'
              }}
              value={bulkAccountText}
              onChange={(e) => setBulkAccountText(e.target.value)}
            />
            <Button 
              variant="contained" 
              size="small" 
              onClick={parseBulkAccounts}
              sx={{ mt: 1 }}
            >
              Hesapları Yükle
            </Button>
          </Box>

          {bulkAccounts.length > 0 && (
            <TableContainer sx={{ maxHeight: '300px' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Parola</TableCell>
                    <TableCell align="right">İşlem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkAccounts.map((account, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.password}</TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => selectAccount(account)}
                        >
                          Seç
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDialog} color="primary">
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      <Collapse in={notification.show}>
        <Alert 
          severity={notification.type || 'info'}
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