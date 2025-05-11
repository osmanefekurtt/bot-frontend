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
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Yeni import
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';

export default function TransferDetail() {
  const theme = useTheme();
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  
  const [mobileTransferData, setMobileTransferData] = useState([]);
  const [webTransferData, setWebTransferData] = useState([]);
  const [selectedMobileAccount, setSelectedMobileAccount] = useState('');
  const [selectedWebAccount, setSelectedWebAccount] = useState('');
  
  const [mblLog, setMblLog] = useState([]);
  const [webLog, setWebLog] = useState([]);
  const [isTransferActive, setIsTransferActive] = useState(false);

  const mblLogRef = useRef(null);
  const webLogRef = useRef(null);

  const [mblAutoScroll, setMblAutoScroll] = useState(true);
  const [webAutoScroll, setWebAutoScroll] = useState(true);

  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    show: false
  });

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

  // Fast Pay verisini kopyalama fonksiyonu
  const copyFastPayData = (data) => {
    navigator.clipboard.writeText(data)
      .then(() => {
        showNotification('Fast Pay verisi başarıyla kopyalandı', 'success');
      })
      .catch(() => {
        showNotification('Kopyalama işlemi başarısız oldu', 'error');
      });
  };

  useEffect(() => {
    if (mblAutoScroll && mblLogRef.current) {
      mblLogRef.current.scrollTop = mblLogRef.current.scrollHeight;
    }
  }, [mblLog, mblAutoScroll]);

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
        setMobileTransferData(latestMessage.result.transfers || []);
        setWebTransferData(latestMessage.result.web_transfer || []);
        
        if (selectedMobileAccount) {
          const selectedTransfer = latestMessage.result.transfers.find(
            (transfer) => transfer.trg_account.username === selectedMobileAccount
          );
          if (selectedTransfer) {
            setMblLog(selectedTransfer.mbl_log);
            setIsTransferActive(selectedTransfer.is_active);
          }
        }

        if (selectedWebAccount) {
          const selectedWebTransfer = latestMessage.result.web_transfer.find(
            (transfer) => transfer.trg_account.username === selectedWebAccount
          );
          if (selectedWebTransfer) {
            setWebLog(selectedWebTransfer.web_log);
          }
        }
      }

      if (latestMessage.action === 'mbl_transfer' || latestMessage.action === 'web_transfer') {
        if (latestMessage.isError) {
          showNotification(latestMessage.message || 'Transfer işlemi başarısız', 'error');
        } else {
          showNotification('Transfer işlemi başarıyla gerçekleştirildi', 'success');
        }
      }

      // Handle delete responses
      if (latestMessage.action === 'delete_transfer_data' || latestMessage.action === 'delete_transfer_data_web') {
        if (latestMessage.isError) {
          showNotification('Transfer geçmişi silinirken hata oluştu', 'error');
        } else {
          showNotification('Transfer geçmişi başarıyla silindi', 'success');
        }
      }
    }
  }, [messages, selectedMobileAccount, selectedWebAccount]);

  const handleMobileAccountSelect = (e) => {
    setSelectedMobileAccount(e.target.value);
    const selectedTransfer = mobileTransferData.find(
      (transfer) => transfer.trg_account.username === e.target.value
    );
    if (selectedTransfer) {
      setMblLog(selectedTransfer.mbl_log);
      setIsTransferActive(selectedTransfer.is_active);
    } else {
      setMblLog([]);
      setIsTransferActive(false);
    }
  };

  const handleWebAccountSelect = (e) => {
    setSelectedWebAccount(e.target.value);
    const selectedTransfer = webTransferData.find(
      (transfer) => transfer.trg_account.username === e.target.value
    );
    if (selectedTransfer) {
      setWebLog(selectedTransfer.web_log);
    } else {
      setWebLog([]);
    }
  };

  const handleClearMobileTransfers = () => {
    if (window.confirm('Mobil transfer geçmişini silmek istediğinize emin misiniz?')) {
      if (sendMessage) {
        sendMessage({ action: 'delete_transfer_data' });
        setMobileTransferData([]);
        setSelectedMobileAccount('');
        setMblLog([]);
        setIsTransferActive(false);
        showNotification('Mobil transfer geçmişi silindi', 'success');
      }
    }
  };

  const handleClearWebTransfers = () => {
    if (window.confirm('Web transfer geçmişini silmek istediğinize emin misiniz?')) {
      if (sendMessage) {
        sendMessage({ action: 'delete_transfer_data_web' });
        setWebTransferData([]);
        setSelectedWebAccount('');
        setWebLog([]);
        showNotification('Web transfer geçmişi silindi', 'success');
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
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="mobile-account-select-label" sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
                  Mobil Hesap
                </InputLabel>
                <Select
                  labelId="mobile-account-select-label"
                  id="mobile-account-select"
                  value={selectedMobileAccount}
                  label="Mobil Hesap"
                  onChange={handleMobileAccountSelect}
                  sx={{ 
                    height: 40,
                    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#555',
                  }}
                >
                  <MenuItem value="">Hesap Seçiniz</MenuItem>
                  {mobileTransferData.map((account, index) => (
                    <MenuItem key={index} value={account.trg_account.username}>
                      {account.trg_account.username} {account.is_active && '🔄'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                color="error"
                onClick={handleClearMobileTransfers}
                sx={{
                  minWidth: 'auto',
                  padding: '8px',
                  marginLeft: 1
                }}
              >
                <DeleteIcon sx={{ fontSize: 20 }} />
              </Button>
              <IconButton 
                onClick={() => setMblAutoScroll(!mblAutoScroll)}
                sx={{
                  color: !mblAutoScroll ? 'success.main' : 'warning.main',
                }}
              >
                {!mblAutoScroll ? <LockOpenIcon sx={{ fontSize: 15 }} /> : <LockIcon sx={{ fontSize: 15 }} />}
              </IconButton>
              {/* Mobil için fast_pay_data kopyalama butonu */}
              {selectedMobileAccount && mobileTransferData.find(t => t.trg_account.username === selectedMobileAccount)?.fast_pay_data && (
                <IconButton 
                  onClick={() => copyFastPayData(mobileTransferData.find(t => t.trg_account.username === selectedMobileAccount).fast_pay_data)}
                  sx={{
                    color: 'info.main',
                  }}
                  title="Fast Pay verisini kopyala"
                >
                  <ContentCopyIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )}
            </Grid>
            <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl fullWidth size="small">
                <InputLabel id="web-account-select-label" sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
                  Web Hesap
                </InputLabel>
                <Select
                  labelId="web-account-select-label"
                  id="web-account-select"
                  value={selectedWebAccount}
                  label="Web Hesap"
                  onChange={handleWebAccountSelect}
                  sx={{ 
                    height: 40,
                    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#555',
                  }}
                >
                  <MenuItem value="">Hesap Seçiniz</MenuItem>
                  {webTransferData.map((account, index) => (
                    <MenuItem key={index} value={account.trg_account.username}>
                      {account.trg_account.username} {account.is_active && '🔄'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                color="error"
                onClick={handleClearWebTransfers}
                sx={{
                  minWidth: 'auto',
                  padding: '8px',
                  marginLeft: 1
                }}
              >
                <DeleteIcon sx={{ fontSize: 20 }} />
              </Button>
              <IconButton 
                onClick={() => setWebAutoScroll(!webAutoScroll)}
                sx={{
                  color: !webAutoScroll ? 'success.main' : 'warning.main',
                }}
              >
                {!webAutoScroll ? <LockOpenIcon sx={{ fontSize: 15 }} /> : <LockIcon sx={{ fontSize: 15 }} />}
              </IconButton>
              {/* Web için fast_pay_data kopyalama butonu */}
              {selectedWebAccount && webTransferData.find(t => t.trg_account.username === selectedWebAccount)?.fast_pay_data && (
                <IconButton 
                  onClick={() => copyFastPayData(webTransferData.find(t => t.trg_account.username === selectedWebAccount).fast_pay_data)}
                  sx={{
                    color: 'info.main',
                  }}
                  title="Fast Pay verisini kopyala"
                >
                  <ContentCopyIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box 
              ref={mblLogRef}
              sx={{
                height: '250px',
                overflowY: 'auto',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderRadius: "4px",
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
            <Box 
              ref={webLogRef}
              sx={{
                height: '250px',
                overflowY: 'auto',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderRadius: "4px",
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
      </Paper>
    </Box>
  );
}