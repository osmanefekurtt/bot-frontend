import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  useTheme,
  Typography,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';
import DeleteIcon from '@mui/icons-material/Delete';

// Countdown Timer Bileşeni
const CountdownTimer = ({ expiryTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiryDate = new Date(expiryTime).getTime();
      const difference = expiryDate - now;

      if (difference <= 0) {
        return 'Süre doldu';
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${minutes}dk ${seconds}sn`;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  return <span>{timeLeft}</span>;
};

export default function AccountDetail({ email }) {
  const theme = useTheme();
  const [accountData, setAccountData] = useState(null);
  const [basketData, setBasketData] = useState([]);
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const [copiedText, setCopiedText] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '', show: false });

  // Handle delete ticket
  const handleDeleteTicket = (rowId, platform) => {
    if (sendMessage) {
      sendMessage({
        action: 'delete_ticket',
        email: email,
        rowId: rowId,
        platform
      });
    }
  };

  // Email değiştiğinde verileri sıfırla
  useEffect(() => {
    setBasketData([]); // Sepet verilerini temizle
    setAccountData(null); // Hesap verilerini temizle
    setNotification({ message: '', type: '', show: false }); // Bildirimleri temizle
  }, [email]);

  useEffect(() => {
    const fetchAccountData = () => {
      if (sendMessage) {
        sendMessage({ 
          action: 'account_detail',
          email: email 
        });
      }
    };

    fetchAccountData();
    const interval = setInterval(fetchAccountData, 10000);
    return () => clearInterval(interval);
  }, [email, sendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      // Eğer gelen mesaj mevcut email için değilse işleme
      if (latestMessage.email && latestMessage.email !== email) {
        return;
      }

      if (latestMessage.action === 'account_detail' && !latestMessage.isError) {
        setAccountData(latestMessage?.result?.account);
      }

      if (latestMessage.action === 'mbl_get_basket' || latestMessage.action === 'web_get_basket') {
        if (latestMessage.isError) {
          // Hata durumunda kırmızı uyarı göster
          setNotification({
            message: latestMessage.error.message || 'Bir hata oluştu',
            type: 'error',
            show: true
          });
        } else {
          setBasketData(latestMessage.result.tickets || []);
          console.log(latestMessage.result.tickets);
          
          if (!latestMessage.result || latestMessage.result.length === 0) {
            setNotification({
              message: 'Sepet boş',
              type: 'info',
              show: true
            });
          }
        }
        
        // Her durumda 3 saniye sonra bildirimi kaldır
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
      }

      // Delete ticket response handler
      if (latestMessage.action === 'delete_ticket') {
        if (latestMessage.isError) {
          setNotification({
            message: latestMessage.message || 'Bilet silme işlemi başarısız',
            type: 'error',
            show: true
          });
        } else {
          setNotification({
            message: 'Bilet başarıyla silindi',
            type: 'success',
            show: true
          });

          setBasketData(basketData.filter((ticket) => ticket.rowId !== latestMessage.rowId));
        }
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
      }
    }
  }, [messages, email]);

  const fetchBasket = (platform) => {
    if (sendMessage) {
      sendMessage({
        action: platform === 'Web' ? 'web_get_basket' : 'mbl_get_basket',
        email: email
      });
    }
  };

  const copyToClipboard = (text) => {
    if (!text || text === 'N/A') return;
    
    try {
        // Geçici bir textarea elementi oluştur
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Textarea'yı görünmez yap
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Metni seç ve kopyala
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        
        // Geçici elementi temizle
        document.body.removeChild(textArea);
        
        // Başarı mesajını göster
        setCopiedText(`${text} kopyalandı!`);
        setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
        console.error('Kopyalama hatası:', err);
        alert('Kopyalama başarısız oldu: ' + err.message);
    }
  };

  return (
    <Box p={3}>
      {/* Üst Bilgi Kartı */}
      <Box
        sx={{
          width: '100%',
          height: '120px',
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#000',
          borderRadius: theme.shape.borderRadius,
          display: 'flex',
          justifyContent: 'space-between',
          color: 'white',
          p: 2,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 'auto', marginBottom: 'auto' }}>
          <Typography sx={{ cursor: 'pointer' }} onClick={() => copyToClipboard(accountData?.username)}>
            Email: {accountData?.username || 'N/A'}
          </Typography>
          <Typography sx={{ cursor: 'pointer' }} onClick={() => copyToClipboard(accountData?.password)}>
            Şifre: {accountData?.password || 'N/A'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 'auto', marginBottom: 'auto' }}>
          <div>
            Mobil: <Typography component="span">
              {accountData?.mbl?.token ? '✅' : '❌'}
            </Typography>
          </div>
          <div>
            Web: <Typography component="span">
              {accountData?.web?.token ? '✅' : '❌'}
            </Typography>
          </div>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 'auto', marginBottom: 'auto' }}>
          <div>Email: {accountData?.username || 'N/A'}</div>
          <div>Şifre: {accountData?.password || 'N/A'}</div>
        </Box>
      </Box>

      {/* Notification */}
      <Collapse in={notification.show}>
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity={notification.type}
            sx={{ 
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
              color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
            }}
          >
            {notification.message}
          </Alert>
        </Box>
      </Collapse>

      {/* Kontrol Paneli */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          onClick={() => fetchBasket("Mobile")}
          disabled={!accountData?.mbl?.token}
          sx={{ height: 30 }}
        >
          MOBİL SEPET BİLGİSİNİ ÇEK
        </Button>
        <Button
          variant="contained"
          onClick={() => fetchBasket("Web")}
          disabled={!accountData?.web?.token}
          sx={{ height: 30 }}
        >
          WEB SEPET BİLGİSİNİ ÇEK
        </Button>
        <Typography variant="body2" color="error">
          Uyarı: Her tıklamada passo'ya istek atılır.
        </Typography>
      </Box>

      {/* Sepet Tablosu */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Platform</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Tribün</TableCell>
              <TableCell>Blok</TableCell>
              <TableCell>Sıra</TableCell>
              <TableCell>Koltuk</TableCell>
              <TableCell>Fiyat</TableCell>
              <TableCell>Süre</TableCell>
              <TableCell>İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {basketData.map((ticket, index) => (
              <TableRow key={index}>
                <TableCell>{ticket.platform}</TableCell>
                <TableCell>{ticket.seatCategory_Name}</TableCell>
                <TableCell>{ticket.tribune_Name}</TableCell>
                <TableCell>{ticket.block_Name}</TableCell>
                <TableCell>{ticket.refSeatInfo_RowName}</TableCell>
                <TableCell>{ticket.refSeatInfo_SeatName}</TableCell>
                <TableCell>{ticket.formattedTicketPrice}</TableCell>
                <TableCell>
                  <CountdownTimer expiryTime={ticket.expiry_time} />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleDeleteTicket(ticket.rowId, ticket.platform)}
                    size="small"
                    sx={{ 
                      color: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.04)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Kopyalama Bildirimi */}
      {copiedText && (
        <Box sx={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'green',
          color: 'white',
          padding: '5px 15px',
          borderRadius: '5px',
          fontSize: '0.9rem',
          zIndex: 1000,
        }}>
          {copiedText}
        </Box>
      )}
    </Box>
  );
}