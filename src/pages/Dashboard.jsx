import { useEffect, useState } from 'react';
import { Box, Grid, Button, useTheme, Select, MenuItem, FormControl } from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRef } from 'react'; 
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';

export default function Dashboard() {
  const theme = useTheme();
  const [botData, setBotData] = useState(null);
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const [copiedText, setCopiedText] = useState('');
  const [mblFontSize, setMblFontSize] = useState('10px');
  const [webFontSize, setWebFontSize] = useState('10px');

  const [mblAutoScroll, setMblAutoScroll] = useState(true);
  const [webAutoScroll, setWebAutoScroll] = useState(true);

  const mblLogRef = useRef(null);
  const webLogRef = useRef(null);

  // Mobil log için scroll effect
  useEffect(() => {
    if (mblAutoScroll && mblLogRef.current) {
      mblLogRef.current.scrollTop = mblLogRef.current.scrollHeight;
    }
  }, [botData?.mbl_log, mblAutoScroll]);

  // Web log için scroll effect
  useEffect(() => {
    if (webAutoScroll && webLogRef.current) {
      webLogRef.current.scrollTop = webLogRef.current.scrollHeight;
    }
  }, [botData?.web_log, webAutoScroll]);

  // Manuel scroll handler'ları ekleyelim
  const handleMblScroll = (e) => {
    if (!mblAutoScroll) return;
    
    const element = e.target;
    const isScrolledToBottom = Math.abs((element.scrollHeight - element.scrollTop) - element.clientHeight) < 1;
    
    if (!isScrolledToBottom) {
      setMblAutoScroll(false);
    }
  };

  const handleWebScroll = (e) => {
    if (!webAutoScroll) return;
    
    const element = e.target;
    const isScrolledToBottom = Math.abs((element.scrollHeight - element.scrollTop) - element.clientHeight) < 1;
    
    if (!isScrolledToBottom) {
      setWebAutoScroll(false);
    }
  };

  const getTurkeyTime = () => {
    const date = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return date.toLocaleString('tr-TR', options);
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

  const fetchBotData = () => {
    if (sendMessage) {
      sendMessage({ action: 'bot_status' });
    }
  };

  const startBot = () => {
    if (sendMessage) {
      sendMessage({ action: 'bot_start' });
      fetchBotData();
    }
  };

  const stopBot = () => {
    const warningMessage = `Bot'u durdurmak istediğinize emin misiniz?\n\nDurdurunca:\n- Tüm hesapların işlemleri durdurulacak\n- Sepetteki biletler biletlerim sayfasında görüntülenemiyecek`;
  
    if (window.confirm(warningMessage)) {
      if (sendMessage) {
        sendMessage({ action: 'bot_stop' });
        fetchBotData();
      }
    }
  };

  useEffect(() => {
    fetchBotData();

    const interval = setInterval(fetchBotData, 500);
    return () => clearInterval(interval);
  }, [sendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message) => {
        if (message.action === 'bot_status' && !message.isError) {
          setBotData(message.result.status);
        }
        if (message.action == "bot_start")  {
          if (message.isError) {
            alert(message.message);
            messages.length = 0;
          }
        }
      });
    }
  }, [messages]);

  useEffect(() => {
    if (botData?.title) {
      document.title = `${botData.title} | Bayer Ticket 🎫`;
    }
  }, [botData]);

  const downloadLog = (logType) => {
    const logContent = logType === 'mbl_log' ? botData?.mbl_log : botData?.web_log;
    if (logContent) {
      const blob = new Blob([logContent.map((log) => log.message).join('\n')], {
        type: 'text/plain;charset=utf-8',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${logType}.txt`;
      link.click();
    }
  };

  const deleteLog = (logType) => {
    if (window.confirm(`${logType} Çıktılarını silmek istediğine eminmisin ?`)) {
      if (sendMessage) {
        sendMessage({
          action: 'delete_log',
          logType: logType,
        });
      }
    }
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
      {/* Status Box */}
      <Box
        sx={{
          width: '100%',
          height: '20%',
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#000',
          borderRadius: theme.shape.borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          p: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
            flex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            Bot Durumu: {botData?.is_running ? 'Açık' : 'Kapalı'}
            {!botData?.is_running && (
              <Button
                variant="contained"
                color="success"
                onClick={startBot}
                sx={{ ml: 2 }}
              >
                Başlat
              </Button>
            )}
            {botData?.is_running && (
              <Button
                variant="contained"
                color="error"
                onClick={stopBot}
                sx={{ ml: 2 }}
              >
                Durdur
              </Button>
            )}
          </div>
          <div>Hesap Sayısı: {botData?.total_accounts || '0'}</div>
          <div>Proxy Sayısı: {botData?.proxy_count || '0'}</div>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
            flex: 1,
          }}
        >
          <div>Dizin: {botData?.path || 'N/A'}</div>
          <div>Kullanıcı: {botData?.username || 'N/A'}</div>
          <div 
            onClick={() => {
              if (botData?.lissans_key) {
                copyToClipboard(botData.lissans_key);
              }
            }}
            style={{ 
              cursor: 'pointer',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span>Lisans:&nbsp;</span>
            <span>{botData?.lissans_key || 'N/A'}</span>
          </div>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
            flex: 1,
          }}
        >
          <div>Web Aktif Hesap Sayısı: {botData?.web_accounts || '0'}</div>
          <div>Mobil Aktif Hesap Sayısı: {botData?.mobile_accounts || '0'}</div>
          <Box sx={{ color: "green" }}>
            {botData?.user?.full_name && `Bol kazançlar ${botData.user.full_name} 💵💲`}
          </Box>
        </Box>
      </Box>

      {/* Controls Box */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0, alignItems: 'center' }}>
        {/* Mobile Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            onClick={() => downloadLog('mbl_log')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FileDownloadIcon sx={{ fontSize: 15 }} />
          </Button>
          <Button
            onClick={() => deleteLog('mbl_log')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'error.main',
            }}
          >
            <DeleteIcon sx={{ fontSize: 15 }} />
          </Button>
          <Button
            onClick={() => setMblAutoScroll(!mblAutoScroll)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: !mblAutoScroll ? 'success.main' : 'warning.main',
            }}
          >
            {!mblAutoScroll ? <LockOpenIcon sx={{ fontSize: 15 }} /> : <LockIcon sx={{ fontSize: 15 }} />}
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={mblFontSize}
              onChange={(e) => setMblFontSize(e.target.value)}
              sx={{ height: 30, color: 'white', backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#555' }}
            >
              <MenuItem value="8px">Küçük</MenuItem>
              <MenuItem value="10px">Orta</MenuItem>
              <MenuItem value="12px">Büyük</MenuItem>
              <MenuItem value="14px">Çok Büyük</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Web Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <Select
              value={webFontSize}
              onChange={(e) => setWebFontSize(e.target.value)}
              sx={{ height: 30, color: 'white', backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#555' }}
            >
              <MenuItem value="8px">Küçük</MenuItem>
              <MenuItem value="10px">Orta</MenuItem>
              <MenuItem value="12px">Büyük</MenuItem>
              <MenuItem value="14px">Çok Büyük</MenuItem>
            </Select>
          </FormControl>
          <Button
            onClick={() => downloadLog('web_log')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FileDownloadIcon sx={{ fontSize: 15 }} />
          </Button>
          <Button
            onClick={() => deleteLog('web_log')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'error.main',
            }}
          >
            <DeleteIcon sx={{ fontSize: 15 }} />
          </Button>
          <Button
            onClick={() => setWebAutoScroll(!webAutoScroll)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: !webAutoScroll ? 'success.main' : 'warning.main',
            }}
          >
            {!webAutoScroll ? <LockOpenIcon sx={{ fontSize: 15 }} /> : <LockIcon sx={{ fontSize: 15 }} />}
          </Button>
        </Box>
      </Box>

      {/* Logs Grid */}
      <Grid container spacing={2} sx={{ height: 'calc(85vh - 150px)' }}>
        {/* Mobile Log */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Box
            ref={mblLogRef}
            onScroll={handleMblScroll}
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#000',
              borderRadius: theme.shape.borderRadius,
              display: 'flex',
              flexDirection: 'column',
              color: theme.palette.mode === 'dark' ? '#80ff80' : '#0f0',
              fontFamily: 'monospace',
              fontSize: mblFontSize,
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
            <div style={{ marginBottom: '8px' }}>Mobil Bot Çıktıları</div>
            <Box sx={{ flex: 1 }}>
              {botData?.mbl_log?.length > 0 &&
                botData.mbl_log.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      color: log.color || 'white',
                      padding: '2px 0',
                    }}
                  >
                    {log.message}
                  </div>
                ))}
            </Box>
          </Box>
        </Grid>

        {/* Web Log */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Box
            ref={webLogRef}
            onScroll={handleWebScroll}
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#000',
              borderRadius: theme.shape.borderRadius,
              display: 'flex',
              flexDirection: 'column',
              color: theme.palette.mode === 'dark' ? '#80ff80' : '#0f0',
              fontFamily: 'monospace',
              fontSize: webFontSize,
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
            <div style={{ marginBottom: '8px' }}>Web Bot Çıktıları</div>
            <Box sx={{ flex: 1 }}>
              {botData?.web_log?.length > 0 &&
                botData.web_log.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      color: log.color || 'white',
                      padding: '2px 0',
                    }}
                  >
                    {log.message}
                  </div>
                ))}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Copy Success Message */}
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