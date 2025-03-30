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
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loginUrl, setLoginUrl] = useState('https://www.passo.com.tr/tr/giris');
  const [siteKey, setSiteKey] = useState('0x4AAAAAAA4rK8-JCAhwWhV4');
  const [gsPriority, setGsPriority] = useState(false);
  const [priorityCodes, setPriorityCodes] = useState('');
  const [fbFanCardPriority, setFbFanCardPriority] = useState(false);
  const [fbDivanPriority, setFbDivanPriority] = useState(false);
  const [divanCouncilInfos, setDivanCouncilInfos] = useState(''); // Çoklu divan kurulu bilgileri
  const [fanCardInfos, setFanCardInfos] = useState(''); // Çoklu taraftar kart bilgileri



  // Bu yeni fonksiyonları ekleyin
  const handleFbFanCardPriorityChange = (e) => {
    const checked = e.target.checked;
    if (checked && (fbDivanPriority || gsPriority)) {
      setFbDivanPriority(false);
      setGsPriority(false);
    }
    setFbFanCardPriority(checked);
  };

  const handleFbDivanPriorityChange = (e) => {
    const checked = e.target.checked;
    if (checked && (fbFanCardPriority || gsPriority)) {
      setFbFanCardPriority(false);
      setGsPriority(false);
    }
    setFbDivanPriority(checked);
  };

  useEffect(() => {
    if (fanCardInfos.trim().length > 0) {
      setDivanCouncilInfos('');
    }
  }, [fanCardInfos]);
  
  useEffect(() => {
    if (divanCouncilInfos.trim().length > 0) {
      setFanCardInfos('');
    }
  }, [divanCouncilInfos]);
  
  // Web handler'ını da güncelleyelim
  const handleWebChange = (e) => {
    const checked = e.target.checked;
    setIsWeb(checked);
  };



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
    // Yeni FB öncelik doğrulaması ekleyin
    if (fbFanCardPriority && fanCardInfos.trim().length === 0) {
      showNotification('FB Taraftar Öncelik için taraftar kart bilgileri zorunludur.');
      return;
    }
    
    if (fbDivanPriority && divanCouncilInfos.trim().length === 0) {
      showNotification('FB Divan Öncelik için divan kurulu bilgileri zorunludur.');
      return;
    }
    
    // Divan kurulu bilgilerinin formatını kontrol edin (içinde : olmalı)
    if (fbDivanPriority) {
      const divanLines = parseTextToArray(divanCouncilInfos);
      const invalidLines = divanLines.filter(line => !line.includes(':'));
      
      if (invalidLines.length > 0) {
        showNotification('Divan kurulu bilgilerinde geçersiz format. Her satır "KOD:NUMARA" formatında olmalıdır.');
        return;
      }
  }


    // Web-specific validation
    if (isWeb) {
      if (!apiKey || !loginUrl || !siteKey) {
        showNotification('Web platformu için API Key, Login URL ve Site Key alanları zorunludur.');
        return;
      }
    }

    // if (gsPriority) {
    //   const codesList = parseTextToArray(priorityCodes);
    //   const accountsList = parseTextToArray(accounts);
    //   const requiredCodes = accountsList.length * 3;
      
    //   if (codesList.length < requiredCodes) {
    //     showNotification(`Her hesap için en az 3 öncelik kodu gerekli. ${accountsList.length} hesap için ${requiredCodes} kod gerekiyor.`);
    //     return;
    //   }
    // }
    

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
        delay: delay,
        api_key: isWeb ? apiKey : '',
        login_url: isWeb ? loginUrl : '',
        site_key: isWeb ? siteKey : '',
        gs_priority: gsPriority,
        priority_codes: gsPriority ? parseTextToArray(priorityCodes) : (fbDivanPriority ? parseTextToArray(divanCouncilInfos) : []),
        fb_fan_card_priority: fbFanCardPriority,
        fb_divan_priority: fbDivanPriority,
        fan_card_infos: fbFanCardPriority ? parseTextToArray(fanCardInfos) : [],
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
        is_web: isWeb,
        user_key: userKey,
        ticket_api: ticketApi,
        store_key: storeKey,
        delay: delay,
        api_key: isWeb ? apiKey : '',
        login_url: isWeb ? loginUrl : '',
        site_key: isWeb ? siteKey : '',
        gs_priority: gsPriority,
        priority_codes: gsPriority ? parseTextToArray(priorityCodes) : (fbDivanPriority ? parseTextToArray(divanCouncilInfos) : []),
        fb_fan_card_priority: fbFanCardPriority,
        fb_divan_priority: fbDivanPriority,
        fan_card_infos: fbFanCardPriority ? parseTextToArray(fanCardInfos) : [],
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
  // Fetch matches when component mounts
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
    if (sendMessage && selectedCategory && mode === 'otomatik') {
      const selectedCategoryData = categories.find(c => c.category_id.toString() === selectedCategory);
      
      sendMessage({ 
        action: 'get_blocks',
        venue_id: selectedVenueId,
        category_name: selectedCategoryData?.name || ''
      });
    }
  }, [sendMessage, selectedCategory, selectedMatch, selectedVenueId, categories]);

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
            setApiKey(config.api_key || '')
            

            setUserKey(config.user_key || '');
            setTicketApi(config.ticket_api || '');
            setStoreKey(config.store_key || '');  // Yeni eklenen
            setDelay(config.delay || 3);

            setApiKey(config.api_key || '');
            setLoginUrl(config.login_url || 'https://www.passo.com.tr/tr/giris');
            setSiteKey(config.site_key || '0x4AAAAAAA4rK8-JCAhwWhV4');
            
            setGsPriority(config.gs_priority || false)
            setPriorityCodes(config.priority_codes?.join('\n') || '');

            setFbFanCardPriority(config.fb_fan_card_priority || false);
            setFbDivanPriority(config.fb_divan_priority || false);
            setFanCardInfos(config.fan_card_infos?.join('\n') || '');
            setDivanCouncilInfos(config.priority_codes?.join('\n') || '');

            showNotification('Konfigürasyon başarıyla yüklendi', 'success');
          } else {
            showNotification('Konfigürasyon yüklenemedi: ' + latestMessage.error?.message, 'error');
          }
          break;
        
        case 'get_matches':
          if (!latestMessage.isError && latestMessage.result?.matches) {
            const matchList = latestMessage.result.matches.map(match => {
              const processedMatch = {
                ...match,
                match_id: match.match_id.toString(),
                venue_id: match.venue_id?.toString() || ''
              };
              return processedMatch;
            });
            setMatches(matchList);
          } else {
            setMatches([]); // Hata durumunda maç listesini sıfırla
            showNotification('Maç listesi alınamadı: ' + latestMessage.message);
          }
          break;
        
        case 'get_categories':
          if (!latestMessage.isError && latestMessage.result?.categories) {
            const categoryList = latestMessage.result.categories.map(category => ({
              ...category,
              id: category.category_id.toString()
            }));
            setCategories(categoryList);
          } else {
            setCategories([]); // Hata durumunda kategori listesini sıfırla
            setSelectedCategory(''); // Seçili kategoriyi de sıfırla
            showNotification('Kategori listesi alınamadı: ' + latestMessage.message);
          }
          break;
        case 'get_blocks':
          if (!latestMessage.isError && latestMessage.result?.blocks) {
            const blocksText = latestMessage.result.blocks.join('\n');
            setBlocks(blocksText);
          } else {
            showNotification('Blok listesi alınamadı: ' + latestMessage.message);
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
                onChange={handleWebChange}
              />
            }
            label="Web"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={gsPriority}
                onChange={(e) => setGsPriority(e.target.checked)}
                disabled={fbFanCardPriority || fbDivanPriority}
              />
            }
            label="GS Öncelik"
          />

          {/* Bu iki yeni checkbox ekleyin */}
          <FormControlLabel
            control={
              <Checkbox
                checked={fbFanCardPriority}
                onChange={handleFbFanCardPriorityChange}
                disabled={gsPriority || fbDivanPriority}
              />
            }
            label="FB Taraftar Öncelik"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fbDivanPriority}
                onChange={handleFbDivanPriorityChange}
                disabled={gsPriority || fbFanCardPriority}
              />
            }
            label="FB Divan Öncelik"
          />
        </Box>

        {mode === 'otomatik' ? (
          // Otomatik Mode Content
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box>
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
              <FormControl fullWidth size="small">
                <Select
                  value={selectedMatch}
                  onChange={(e) => {
                    const selectedMatchData = matches.find(m => m.match_id.toString() === e.target.value);
                    
                    setSelectedMatch(e.target.value);
                    setSelectedVenueId(selectedMatchData?.venue_id || '');
                    setSelectedCategory('');
                  }}
                  displayEmpty
                >
                  <MenuItem value="">Maç Seçin</MenuItem>
                  {matches.map((match) => (
                    <MenuItem key={match.match_id} value={match.match_id.toString()}>
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
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                  }}
                  displayEmpty
                  disabled={!selectedMatch}
                >
                  <MenuItem value="">Kategori Seçin</MenuItem>
                  {categories.map((category) => (
                    <MenuItem 
                      key={category.category_id} 
                      value={category.category_id.toString()}
                    >
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

            {isWeb && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    size="small"
                    placeholder="API Key giriniz"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Login URL"
                    value={loginUrl}
                    onChange={(e) => setLoginUrl(e.target.value)}
                    size="small"
                    placeholder="Login URL giriniz"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Site Key"
                    value={siteKey}
                    onChange={(e) => setSiteKey(e.target.value)}
                    size="small"
                    placeholder="Site Key giriniz"
                  />
                </Grid>
              </>
            )}
            
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

            {gsPriority && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Gs bonus kart öncelik kodları"
                  multiline
                  rows={10}
                  value={priorityCodes}
                  onChange={(e) => setPriorityCodes(e.target.value)}
                  placeholder="Her satıra bir öncelik kodu gelecek şekilde yazın"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Grid>
            )}

            {fbFanCardPriority && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Taraftar Kart Bilgileri"
                  multiline
                  rows={10}
                  value={fanCardInfos}
                  onChange={(e) => setFanCardInfos(e.target.value)}
                  placeholder="Her satıra bir taraftar kart bilgisi gelecek şekilde yazın"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Grid>
            )}

            {/* Yeni FB Divan Öncelik alanı ekleyin */}
            {fbDivanPriority && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Divan Kurulu Bilgileri"
                  multiline
                  rows={10}
                  value={divanCouncilInfos}
                  onChange={(e) => setDivanCouncilInfos(e.target.value)}
                  placeholder="Her satıra bir divan kurulu bilgisi gelecek şekilde yazın (örn: 234S7HS:112399243)"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Grid>
            )}
          </Grid>
        ) : (
          // Manuel Mode Content
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box>
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

            {isWeb && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    size="small"
                    placeholder="API Key giriniz"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Login URL"
                    value={loginUrl}
                    onChange={(e) => setLoginUrl(e.target.value)}
                    size="small"
                    placeholder="Login URL giriniz"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Site Key"
                    value={siteKey}
                    onChange={(e) => setSiteKey(e.target.value)}
                    size="small"
                    placeholder="Site Key giriniz"
                  />
                </Grid>
              </>
            )}
            
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
            {gsPriority && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Gs bonus kart öncelik kodları"
                  multiline
                  rows={10}
                  value={priorityCodes}
                  onChange={(e) => setPriorityCodes(e.target.value)}
                  placeholder="Her satıra bir öncelik kodu gelecek şekilde yazın"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Grid>
            )}


            {fbFanCardPriority && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Taraftar Kart Bilgileri"
                  multiline
                  rows={10}
                  value={fanCardInfos}
                  onChange={(e) => setFanCardInfos(e.target.value)}
                  placeholder="Her satıra bir taraftar kart bilgisi gelecek şekilde yazın"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Grid>
            )}

            {/* Yeni FB Divan Öncelik alanı ekleyin */}
            {fbDivanPriority && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Divan Kurulu Bilgileri"
                  multiline
                  rows={10}
                  value={divanCouncilInfos}
                  onChange={(e) => setDivanCouncilInfos(e.target.value)}
                  placeholder="Her satıra bir divan kurulu bilgisi gelecek şekilde yazın (örn: 234S7HS:112399243)"
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                    }
                  }}
                />
              </Grid>
            )}

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