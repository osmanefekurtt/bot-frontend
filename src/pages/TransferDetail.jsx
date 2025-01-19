import { useState, useEffect } from 'react';
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
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Mobil Çıktılar
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{
                height: '250px',
                overflowY: 'auto',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderRadius: theme.shape.borderRadius,
                p: 1
              }}>
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
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Web Çıktılar
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{
                height: '250px',
                overflowY: 'auto',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                borderRadius: theme.shape.borderRadius,
                p: 1
              }}>
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
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          Transfer Durumu: {isTransferActive ? 'Aktif' : 'Aktif Değil'}
        </Box>
      </Paper>
    </Box>
  );
}