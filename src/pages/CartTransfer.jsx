import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  useTheme, 
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';

export default function CartTransfer() {
  const theme = useTheme();
  const { sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const [transferStarted, setTransferStarted] = useState(false);

  // Form states
  const [sourceEmail, setSourceEmail] = useState('');
  const [sourcePassword, setSourcePassword] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetPassword, setTargetPassword] = useState('');

  // Handle web transfer
  const handleWebTransfer = () => {
    if (sendMessage) {
      sendMessage({
        action: 'web_transfer',
        sourceEmail,
        sourcePassword,
        targetEmail,
        targetPassword
      });
      setTransferStarted(true);
    }
  };

  // Handle mobile transfer
  const handleMobileTransfer = () => {
    if (sendMessage) {
      sendMessage({
        action: 'mbl_transfer',
        sourceEmail,
        sourcePassword,
        targetEmail,
        targetPassword
      });
      setTransferStarted(true);
    }
  };

  const isFormValid = sourceEmail && sourcePassword && targetEmail && targetPassword;

  return (
    <Box sx={{ 
      p: 3, 
      height: '100%',
      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f4f4f4',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 2, 
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff'
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
              Sepet Transfer
            </Typography>
          </Grid>
          
          {/* Source Account */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
              Kaynak Hesap
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Email"
              value={sourceEmail}
              onChange={(e) => setSourceEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Şifre"
              type="text"
              value={sourcePassword}
              onChange={(e) => setSourcePassword(e.target.value)}
            />
          </Grid>

          {/* Target Account */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>
              Hedef Hesap
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Şifre"
              type="text"
              value={targetPassword}
              onChange={(e) => setTargetPassword(e.target.value)}
            />
          </Grid>

          {/* Transfer Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button 
              variant="contained" 
              onClick={handleWebTransfer}
              disabled={!isFormValid}
              sx={{ flex: 1, maxWidth: 200 }}
            >
              Web Transfer
            </Button>
            <Button 
              variant="contained" 
              onClick={handleMobileTransfer}
              disabled={!isFormValid}
              sx={{ flex: 1, maxWidth: 200 }}
            >
              Mobil Transfer
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transfer Başarı Bildirimi */}
      <Snackbar
        open={transferStarted}
        autoHideDuration={3000}
        onClose={() => setTransferStarted(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Transfer işlemi başarıyla başlatıldı.
        </Alert>
      </Snackbar>
    </Box>
  );
}