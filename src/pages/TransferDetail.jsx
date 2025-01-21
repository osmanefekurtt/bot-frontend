import { useState, useEffect, useRef } from 'react';
import { 
  Box,
  Paper,
  useTheme,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Button,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';

export default function TransferDetail() {
  const theme = useTheme();
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const [transferData, setTransferData] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [mblLog, setMblLog] = useState([]);
  const [webLog, setWebLog] = useState([]);
  const [isTransferActive, setIsTransferActive] = useState(false);

  // Log referansları
  const mblLogRef = useRef(null);
  const webLogRef = useRef(null);

  // Auto scroll state'leri
  const [mblAutoScroll, setMblAutoScroll] = useState(true);
  const [webAutoScroll, setWebAutoScroll] = useState(true);

  // Bildirim state'i
  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    show: false
  });

  // Bildirim fonksiyonu
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

  // Mobil log için auto scroll effect
  useEffect(() => {
    if (mblAutoScroll && mblLogRef.current) {
      mblLogRef.current.scrollTop = mblLogRef.current.scrollHeight;
    }
  }, [mblLog, mblAutoScroll]);

  // Web log için auto scroll effect
  useEffect(() => {
    if (webAutoScroll && webLogRef.current) {
      webLogRef.current.scrollTop = webLogRef.current.scrollHeight;
    }
  }, [webLog, webAutoScroll]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sendMessage) {
        sendMessage({ action: 'get_transfer_data' });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.action === 'get_transfer_data' && !latestMessage.isError) {
        setTransferData(latestMessage.result.transfers);
        
        if (selectedAccount) {
          const selectedTransfer = latestMessage.result.transfers.find(
            (transfer) => transfer.trg_account.username === selectedAccount
          );
          if (selectedTransfer) {
            setMblLog(selectedTransfer.mbl_log);
            setWebLog(selectedTransfer.web_log);
            setIsTransferActive(selectedTransfer.is_active);
          }
        }
      }

      // Transfer işlemleri için bildirim
      if (latestMessage.action === 'mbl_transfer' || latestMessage.action === 'web_transfer') {
        if (latestMessage.isError) {
          showNotification(latestMessage.message || 'Transfer işlemi başarısız', 'error');
        } else {
          showNotification('Transfer işlemi başarıyla gerçekleştirildi', 'success');
        }
      }
    }
  }, [messages, selectedAccount]);

  const handleTransfer = () => {
    if (sendMessage && selectedAccount) {
      sendMessage({
        action: 'mbl_transfer',
        sourceEmail: selectedAccount,
        sourcePassword: '',
        targetEmail: selectedAccount,
        targetPassword: ''
      });
      showNotification('Transfer işlemi başlatılıyor...', 'info');
    }
  };

  const handleAccountSelect = (e) => {
    setSelectedAccount(e.target.value);
    const selectedTransfer = transferData.find((transfer) => transfer.trg_account.username === e.target.value);
    if (selectedTransfer) {
      setMblLog(selectedTransfer.mbl_log);
      setWebLog(selectedTransfer.web_log);
      setIsTransferActive(selectedTransfer.is_active);
    } else {
      setMblLog([]);
      setWebLog([]);
      setIsTransferActive(false);
    }
  };

  const handleClearTransfers = () => {
    if (window.confirm('Transfer geçmişini silmek istediğinize emin misiniz?')) {
      if (sendMessage) {
        sendMessage({ action: 'delete_transfer_data' });
        setTransferData([]);
        setSelectedAccount('');
        setMblLog([]);
        setWebLog([]);
        setIsTransferActive(false);
        showNotification('Transfer geçmişi silindi', 'success');
      }
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
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          width: '80%'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl sx={{ width: '95%' }} size="small">
            <InputLabel id="account-select-label" sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
              Hesap
            </InputLabel>
            <Select
              labelId="account-select-label"
              id="account-select"
              value={selectedAccount}
              label="Hesap"
              onChange={handleAccountSelect}
              sx={{ 
                height: 40,
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#555',
              }}
            >
              <MenuItem value="">Hesap Seçiniz</MenuItem>
              {transferData.map((account, index) => (
                <MenuItem key={index} value={account.trg_account.username}>
                  {account.trg_account.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            color="error"
            onClick={handleClearTransfers}
            sx={{
              minWidth: 'auto',
              padding: '8px',
              marginX: 2
            }}
          >
            <DeleteIcon sx={{ fontSize: 20 }} />
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">Mobil Çıktılar</Typography>
              <IconButton 
                onClick={() => setMblAutoScroll(!mblAutoScroll)}
                sx={{
                  color: !mblAutoScroll ? 'success.main' : 'warning.main',
                }}
              >
                {!mblAutoScroll ? <LockOpenIcon sx={{ fontSize: 15 }} /> : <LockIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box 
              ref={mblLogRef}
              sx={{
                height: '250px',
                overflowY: 'auto',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderRadius: theme.shape.borderRadius,
                p: 1
              }}
            >
              {mblLog.length > 0 ? (
                mblLog.map((log, index) => (
                  <div key={index} style={{ color: log.color }}>
                    {log.message}
                  </div>
                ))
              ) : (
                <div>Henüz log bulunmuyor.</div>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">Web Çıktılar</Typography>
              <IconButton 
                onClick={() => setWebAutoScroll(!webAutoScroll)}
                sx={{
                  color: !webAutoScroll ? 'success.main' : 'warning.main',
                }}
              >
                {!webAutoScroll ? <LockOpenIcon sx={{ fontSize: 15 }} /> : <LockIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box 
              ref={webLogRef}
              sx={{
                height: '250px',
                overflowY: 'auto',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderRadius: theme.shape.borderRadius,
                p: 1
              }}
            >
              {webLog.length > 0 ? (
                webLog.map((log, index) => (
                  <div key={index} style={{ color: log.color }}>
                    {log.message}
                  </div>
                ))
              ) : (
                <div>Henüz log bulunmuyor.</div>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          Transfer Durumu: {isTransferActive ? 'Aktif' : 'Aktif Değil'}
        </Box>

        {/* Bildirim Kutusu */}
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
            onClose={() => setNotification({ show: false, message: '', type: 'info' })}
          >
            {notification.message}
          </Alert>
        </Collapse>
      </Paper>
    </Box>
  );
}