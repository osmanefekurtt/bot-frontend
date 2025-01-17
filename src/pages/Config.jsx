import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Grid, 
  Paper, 
  Typography, 
  Button,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Collapse,
  FormControlLabel,
  Checkbox,
  IconButton  
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WEB_SOCKET_URL from '../config.jsx';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

export default function Config() {
  const theme = useTheme();
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  
  // Form states
  const [mode, setMode] = useState('manuel');
  const [eventId, setEventId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accounts, setAccounts] = useState('');
  const [proxies, setProxies] = useState('');
  const [blocks, setBlocks] = useState('');
  const [selectedMatch, setSelectedMatch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [matches, setMatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notification, setNotification] = useState({
    message: '',
    type: 'info',
    show: false
  });
  const [title, setTitle] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isWeb, setIsWeb] = useState(false);
  const [userKey, setUserKey] = useState('');
  const [ticketApi, setTicketApi] = useState('');
  const [storeKey, setStoreKey] = useState('');
  const [delay, setDelay] = useState(3);

  // Parse text area content into array, filtering empty lines and lines < 3 chars
  const parseTextToArray = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length >= 3);
  };

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

  const handleSubmit = () => {
    // Validasyon kontrolleri
    if (mode === 'manuel') {
      if (!eventId || !categoryId) {
        showNotification('Maç ID ve Kategori ID alanları zorunludur.');
        return;
      }
    } else {
      if (!selectedMatch || !selectedCategory) {
        showNotification('Lütfen Maç ve Kategori seçiniz.');
        return;
      }
    }

    if (!title) {
      showNotification('Başlık alanı zorunludur.');
      return;
    }

    // Listelerin validasyonu
    const accountsList = parseTextToArray(accounts);
    const proxiesList = parseTextToArray(proxies);
    const blocksList = parseTextToArray(blocks);

    if (accountsList.length === 0) {
      showNotification('En az bir hesap girmelisiniz.');
      return;
    }

    if (proxiesList.length === 0) {
      showNotification('En az bir proxy girmelisiniz.');
      return;
    }

    // Her hesap için 5 proxy kontrolü
    const requiredProxyCount = accountsList.length * 5;
    if (proxiesList.length < requiredProxyCount) {
      showNotification(`Yetersiz proxy sayısı! ${accountsList.length} hesap için ${requiredProxyCount} proxy gerekli, ${proxiesList.length} proxy mevcut.`);
      return;
    }

    if (blocksList.length === 0) {
      showNotification('En az bir blok girmelisiniz.');
      return;
    }

    // if (!userKey || !ticketApi || !storeKey) {
    //   showNotification('Bildirim ayarları (User Key, Ticket API ve Store Key) zorunludur.');
    //   return;
    // }

    let config;
    if (mode === 'manuel') {
      config = {
        event_id: eventId,
        category_id: categoryId,
        accounts: parseTextToArray(accounts).map(acc => {
          const [username, password] = acc.split(':');
          return { username, password };
        }),
        proxies: parseTextToArray(proxies),
        blocks: parseTextToArray(blocks),
        mode: 'manuel',
        title: title,
        is_mobile: isMobile,
        is_web: isWeb,
        user_key: userKey,
        ticket_api: ticketApi,
        store_key: storeKey,
        delay: delay
      };
    } else {
      // Otomatik mod için aynı yapı
      config = {
        event_id: selectedMatch,
        category_id: selectedCategory,
        accounts: parseTextToArray(accounts).map(acc => {
          const [username, password] = acc.split(':');
          return { username, password };
        }),
        proxies: parseTextToArray(proxies),
        blocks: parseTextToArray(blocks),
        mode: 'otomatik',
        title: title,
        is_mobile: isMobile,
        is_web: isWeb
      };
    }

    if (sendMessage) {
      sendMessage({
        action: 'set_config',
        ...config
      });
      showNotification('Ayarlar kaydediliyor...', 'info');
    }
  };

  // Fetch matches when component mounts
  useEffect(() => {
    if (sendMessage && mode === 'otomatik') {
      sendMessage({ action: 'get_matches' });
    }

    if (sendMessage && mode === 'manuel') {
      sendMessage({ 
        action: 'get_config'
      });
    }
  }, [sendMessage, mode]);

  // Fetch categories when a match is selected
  useEffect(() => {
    if (sendMessage && selectedMatch && mode === 'otomatik') {
      sendMessage({ 
        action: 'get_categories',
        match_id: selectedMatch
      });
    }
  }, [sendMessage, selectedMatch]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      switch (latestMessage.action) {
        case 'set_config':
          if (!latestMessage.isError) {
            showNotification('Ayarlar başarıyla kaydedildi', 'success');
          } else {
            showNotification(latestMessage.error?.message || 'Ayarlar kaydedilirken bir hata oluştu', 'error');
          }
          break;
        case 'get_config':
          if (!latestMessage.isError) {
            const config = latestMessage.result.config; // config objesi result.config içinde
            
            // Hesapları username:password formatında string'e çevir
            const accountsStr = config.accounts.map(account => 
              `${account.username}:${account.password}`
            ).join('\n');

            setEventId(config.event_id || '');
            setCategoryId(config.category_id || '');
            setAccounts(accountsStr);
            setProxies(config.proxies.join('\n') || ''); 
            setBlocks(config.blocks.join('\n') || ''); 
            setTitle(config.title || '');
            setIsMobile(config.is_mobile || false);
            setIsWeb(config.is_web || false);
            
            // Otomatik mod için match ve category id'lerini de set et
            setSelectedMatch(config.event_id || '');
            setSelectedCategory(config.category_id || '');

            setUserKey(config.user_key || '');
            setTicketApi(config.ticket_api || '');
            setStoreKey(config.store_key || '');  // Yeni eklenen
            setDelay(config.delay || 3);

            showNotification('Konfigürasyon başarıyla yüklendi', 'success');
          } else {
            showNotification('Konfigürasyon yüklenemedi: ' + latestMessage.error?.message, 'error');
          }
          break;
        
        case 'get_matches':
          if (!latestMessage.isError) {
            setMatches(latestMessage.result || []);
          } else {
            showNotification('Maç listesi alınamadı: ' + latestMessage.message);
          }
          break;
        
        case 'get_categories':
          if (!latestMessage.isError) {
            setCategories(latestMessage.result || []);
          } else {
            showNotification('Kategori listesi alınamadı: ' + latestMessage.message);
          }
          break;
      }
    }
  }, [messages]);

  return (
    <Box sx={{ 
      p: 3,
      height: '100%',
      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f4f4f4',
    }}>
      <Paper elevation={3} sx={{ p: 3 }}>

        {/* Mode Selection Buttons */}
        <Box display="flex" gap={1} mb={3}>
          <Button
            variant={mode === 'manuel' ? 'contained' : 'outlined'}
            onClick={() => setMode('manuel')}
            sx={{ fontSize: '0.7rem' }}
          >
            Manuel
          </Button>
          <Button
            variant={mode === 'otomatik' ? 'contained' : 'outlined'}
            onClick={() => setMode('otomatik')}
            sx={{ fontSize: '0.7rem' }}
            disabled
          >
            Otomatik
          </Button>
        </Box>

        {/* Platform Checkboxes */}
        <Box display="flex" gap={2} mb={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isMobile}
                onChange={(e) => setIsMobile(e.target.checked)}
              />
            }
            label="Mobil"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isWeb}
                onChange={(e) => setIsWeb(e.target.checked)}
              />
            }
            label="Web"
          />
        </Box>

        {mode === 'otomatik' ? (
          // Otomatik Mode Content
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="User Key"
                      value={userKey}
                      onChange={(e) => setUserKey(e.target.value)}
                      size="small"
                      placeholder="Bildirim user key"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Ticket API"
                      value={ticketApi}
                      onChange={(e) => setTicketApi(e.target.value)}
                      size="small"
                      placeholder="Bildirim ticket API"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Store Key"
                      value={storeKey}
                      onChange={(e) => setStoreKey(e.target.value)}
                      size="small"
                      placeholder="Store key"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedMatch}
                  onChange={(e) => setSelectedMatch(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>Maç Seçin</MenuItem>
                  {matches.map((match) => (
                    <MenuItem key={match.id} value={match.id}>
                      {match.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  displayEmpty
                  disabled={!selectedMatch}
                >
                  <MenuItem value="" disabled>Kategori Seçin</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Başlık"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="small"
                placeholder="Sitenin başlığını girin"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Hesaplar"
                multiline
                rows={10}
                value={accounts}
                onChange={(e) => setAccounts(e.target.value)}
                placeholder="Her satıra bir hesap gelecek şekilde yazın"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Proxyler"
                multiline
                rows={10}
                value={proxies}
                onChange={(e) => setProxies(e.target.value)}
                placeholder="Her satıra bir proxy gelecek şekilde yazın"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bloklar"
                multiline
                rows={10}
                value={blocks}
                onChange={(e) => setBlocks(e.target.value)}
                placeholder="Her satıra bir blok gelecek şekilde yazın"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  }
                }}
              />
            </Grid>
          </Grid>
        ) : (
          // Manuel Mode Content
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="User Key"
                      value={userKey}
                      onChange={(e) => setUserKey(e.target.value)}
                      size="small"
                      placeholder="Bildirim user key"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Ticket API"
                      value={ticketApi}
                      onChange={(e) => setTicketApi(e.target.value)}
                      size="small"
                      placeholder="Bildirim ticket API"
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Store Key"
                      value={storeKey}
                      onChange={(e) => setStoreKey(e.target.value)}
                      size="small"
                      placeholder="Store key"
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                        borderRadius: 1,
                        height: '40px', // TextField'ın yüksekliği
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newValue = Math.max(0.2, parseFloat(delay || 3) - 0.2);
                          setDelay(newValue.toFixed(1));
                        }}
                        sx={{
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                          padding: '4px'
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <TextField
                        value={delay || 3}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseFloat(value);
                          if (value === '' || (!isNaN(numValue) && numValue >= 0.2 && numValue <= 10)) {
                            setDelay(value);
                          }
                        }}
                        size="small"
                        inputProps={{
                          style: { textAlign: 'center', padding: '2px' },
                          step: 0.2
                        }}
                        sx={{
                          width: '45px',
                          '& .MuiOutlinedInput-root': {
                            height: '28px',
                            '& input': {
                              padding: '4px',
                              '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                                '-webkit-appearance': 'none',
                              },
                            },
                          },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newValue = Math.min(10, parseFloat(delay || 3) + 0.2);
                          setDelay(newValue.toFixed(1));
                        }}
                        sx={{
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                          padding: '4px'
                        }}
                      >
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Maç ID"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Kategori ID"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Başlık"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="small"
                placeholder="Sitenin başlığını girin"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Hesaplar"
                multiline
                rows={10}
                value={accounts}
                onChange={(e) => setAccounts(e.target.value)}
                placeholder="Her satıra bir hesap gelecek şekilde yazın"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Proxyler"
                multiline
                rows={10}
                value={proxies}
                onChange={(e) => setProxies(e.target.value)}
                placeholder="Her satıra bir proxy gelecek şekilde yazın"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bloklar"
                multiline
                rows={10}
                value={blocks}
                onChange={(e) => setBlocks(e.target.value)}
                placeholder="Her satıra bir blok gelecek şekilde yazın"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  }
                }}
              />
            </Grid>
          </Grid>
        )}

        {/* Submit Button */}
        <Grid container sx={{ mt: 3 }}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              startIcon={<SaveIcon />}
              size="large"
            >
              Kaydet
            </Button>
          </Grid>
        </Grid>
      </Paper>


      {/* Sağ üst köşede fixed bildirim */}
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