import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Typography,
  useTheme,
  IconButton,
  Snackbar,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function FBCodeGenerator() {
  const theme = useTheme();
  const [sampleCode, setSampleCode] = useState('');
  const [codeAmount, setCodeAmount] = useState(2000);
  const [generatedCodes, setGeneratedCodes] = useState('');
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState('both');
  const textAreaRef = useRef(null);

  // TC kimlik numarası algoritmasına uygun randomize TC üretme
  const generateTCKimlikNo = () => {
    // İlk 9 haneyi rastgele oluştur, ilk hane 0 olamaz
    const digits = [Math.floor(Math.random() * 9) + 1]; // İlk hane 1-9 arası olmalı
    
    // 2-9 arası haneler için rastgele sayılar ekle
    for (let i = 0; i < 8; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    
    // 10. haneyi hesapla: (1, 3, 5, 7, 9. hanelerin toplamı * 7 - 2, 4, 6, 8. hanelerin toplamı) % 10
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    
    const tenthDigit = (oddSum * 7 - evenSum) % 10;
    digits.push(tenthDigit);
    
    // 11. haneyi hesapla: (İlk 10 hanenin toplamı) % 10
    const sum = digits.reduce((acc, digit) => acc + digit, 0);
    const eleventhDigit = sum % 10;
    digits.push(eleventhDigit);
    
    // Diziyi string'e çevir
    return digits.join('');
  };

  // Örnek koda benzer rastgele kod üretimi
  const generateSimilarCode = (baseSampleCode) => {
    if (!baseSampleCode || baseSampleCode.length < 5) {
      return '';
    }

    // Orijinal kodun uzunluğunu al
    const codeLength = baseSampleCode.length;
    
    // Prefix kısmını koru (ilk 4-6 karakter)
    const prefixLength = Math.min(6, Math.max(4, Math.floor(codeLength * 0.3)));
    const prefix = baseSampleCode.substring(0, prefixLength);
    
    // Son kısmın uzunluğunu hesapla
    const remainingLength = codeLength - prefixLength;
    let newPart = '';

    // Kalan kısmı rastgele oluştur
    for (let i = 0; i < remainingLength; i++) {
      newPart += Math.floor(Math.random() * 10);
    }

    // Son birkaç karakteri orijinal koddan farklı yap
    // Böylece her defa tamamen farklı kodlar üretilir
    if (newPart === baseSampleCode.substring(prefixLength)) {
      const lastDigits = newPart.slice(-2);
      const newLastDigits = (parseInt(lastDigits) + 17) % 100;
      newPart = newPart.slice(0, -2) + newLastDigits.toString().padStart(2, '0');
    }

    return prefix + newPart;
  };

  // Verilen kodu belirli miktarda arttır/azalt
  const incrementDecrementCodeByAmount = (code, amount, increment = true) => {
    try {
      // Kodun sayısal değerini al
      const numericValue = BigInt(code);
      
      // Arttır veya azalt
      const newValue = increment ? numericValue + BigInt(amount) : numericValue - BigInt(amount);
      
      // String'e çevir ve orijinal uzunluğa tamamla
      return newValue.toString().padStart(code.length, '0');
    } catch (error) {
      // Hata durumunda benzer bir kod üret (sayısal dönüşüm sorunu olabilir)
      return generateSimilarCode(code);
    }
  };

  // Kodları üret
  const generateCodes = () => {
    if (!sampleCode) {
      alert('Lütfen örnek bir kod giriniz');
      return;
    }

    setIsGenerating(true);

    // İşlemi arka planda yapabilmek için setTimeout kullanıyoruz
    setTimeout(() => {
      try {
        const codes = [];
        let baseCode = BigInt(sampleCode);
        // Üretilen kodları takip etmek için bir Set kullan
        const generatedCodeSet = new Set();
        
        // Başlangıç kodunu ekle
        generatedCodeSet.add(sampleCode);
        
        // Önce ardışık değerlerle dolduralım (örn: +1, +2, +3, ...)
        let sequentialCount = Math.min(codeAmount, 100); // En fazla ilk 100 kodu ardışık yap
        for (let i = 1; i <= sequentialCount; i++) {
          if (codes.length >= codeAmount) break;
          
          // Ardışık olarak arttır
          let newCode = (baseCode + BigInt(i)).toString().padStart(sampleCode.length, '0');
          if (!generatedCodeSet.has(newCode)) {
            generatedCodeSet.add(newCode);
            const tc = generateTCKimlikNo();
            codes.push(`${newCode}:${tc}`);
          }
        }
        
        // Kalan kodları rastgele değerlerle doldur
        let attemptsCount = 0;
        const maxAttempts = codeAmount * 10; // Sonsuz döngüyü önlemek için maksimum deneme sayısı
        
        while (codes.length < codeAmount && attemptsCount < maxAttempts) {
          attemptsCount++;
          let newCode;
          
          if (generationType === 'increment') {
            // Rastgele arttırma miktarı (100-10000 arası)
            const incrementAmount = 100 + Math.floor(Math.random() * 9900);
            const doIncrement = Math.random() > 0.3; // %70 arttırma, %30 azaltma olasılığı
            newCode = incrementDecrementCodeByAmount(sampleCode, incrementAmount, doIncrement);
          } else if (generationType === 'similar') {
            // Tamamen farklı, benzer bir kod üret
            newCode = generateSimilarCode(sampleCode);
          } else {
            // both - karışık üretim
            if (Math.random() < 0.6) {
              const incrementAmount = 100 + Math.floor(Math.random() * 9900);
              const doIncrement = Math.random() > 0.3;
              newCode = incrementDecrementCodeByAmount(sampleCode, incrementAmount, doIncrement);
            } else {
              newCode = generateSimilarCode(sampleCode);
            }
          }
          
          // Eğer bu kod daha önce üretilmediyse, ekle
          if (!generatedCodeSet.has(newCode)) {
            generatedCodeSet.add(newCode);
            const tc = generateTCKimlikNo();
            codes.push(`${newCode}:${tc}`);
          }
        }
        
        if (attemptsCount >= maxAttempts && codes.length < codeAmount) {
          alert(`Yeterli benzersiz kod üretilemedi. ${codes.length} kod üretildi.`);
        }
        
        setGeneratedCodes(codes.join('\n'));
        setIsGenerating(false);
      } catch (error) {
        console.error('Kod üretimi sırasında hata:', error);
        alert('Kod üretimi sırasında bir hata oluştu');
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleCopy = async () => {
    if (generatedCodes) {
      try {
        await navigator.clipboard.writeText(generatedCodes);
        setShowCopyNotification(true);
      } catch (err) {
        console.error('Kopyalama başarısız:', err);
      }
    }
  };

  const handleDownload = () => {
    if (generatedCodes) {
      const blob = new Blob([generatedCodes], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fb_oncelik_kodlari.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

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
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          mb: 3
        }}
      >
        <Typography variant="h5" gutterBottom color="primary">
          Fenerbahçe Öncelik Kodu Üretici
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Örnek Kod (1907022360287850 gibi)"
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              placeholder="Örneğin: 1907022360287850"
              margin="normal"
              variant="outlined"
              InputProps={{
                sx: {
                  fontFamily: 'monospace',
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Üretilecek Kod Adeti"
              type="number"
              value={codeAmount}
              onChange={(e) => {
                const value = Math.max(1, Math.min(10000, Number(e.target.value)));
                setCodeAmount(value);
              }}
              margin="normal"
              variant="outlined"
              InputProps={{
                inputProps: { min: 1, max: 10000 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Üretim Tipi</InputLabel>
              <Select
                value={generationType}
                label="Üretim Tipi"
                onChange={(e) => setGenerationType(e.target.value)}
              >
                <MenuItem value="both">Karışık</MenuItem>
                <MenuItem value="increment">Arttır/Azalt</MenuItem>
                <MenuItem value="similar">Benzer Oluştur</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={generateCodes}
              disabled={isGenerating || !sampleCode}
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
              fullWidth
              size="large"
            >
              {isGenerating ? "Kodlar Üretiliyor..." : "Kodları Üret"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6">
            Üretilen Kodlar ({generatedCodes.split('\n').filter(Boolean).length})
          </Typography>
          <Box>
            <IconButton 
              onClick={handleCopy}
              disabled={!generatedCodes}
              color="primary"
              sx={{ mr: 1 }}
              title="Kodları Kopyala"
            >
              <ContentCopyIcon />
            </IconButton>
            <IconButton 
              onClick={handleDownload}
              disabled={!generatedCodes}
              color="secondary"
              title="TXT Olarak İndir"
            >
              <FileDownloadIcon />
            </IconButton>
          </Box>
        </Box>
        
        <TextField
          multiline
          fullWidth
          rows={15}
          value={generatedCodes}
          InputProps={{
            readOnly: true,
            ref: textAreaRef,
          }}
          sx={{
            flex: 1,
            '& .MuiInputBase-root': {
              height: '100%',
            },
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '14px',
              height: '100%',
              overflowY: 'auto',
              backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
            },
          }}
          placeholder="Üretilen kodlar burada görünecek..."
          variant="outlined"
        />
      </Paper>

      <Snackbar
        open={showCopyNotification}
        autoHideDuration={2000}
        onClose={() => setShowCopyNotification(false)}
        message="Kodlar başarıyla kopyalandı"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}