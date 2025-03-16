import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Typography, Grid, TextField, IconButton, useTheme, Chip, Paper } from '@mui/material';
import { CopyAll as CopyIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';
import { Alert, Collapse } from '@mui/material';

export default function TicketsPage() {
    const theme = useTheme();
    const categories = ['Mobil', 'Web', 'Hepsi'];
    const [selectedCategory, setSelectedCategory] = useState('Hepsi');
    const [tickets, setTickets] = useState([]);
    const [copiedText, setCopiedText] = useState('');
    const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
    const [tribuneCounts, setTribuneCounts] = useState({});

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

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (sendMessage) {
                sendMessage({ action: 'tickets', category: selectedCategory });
            }
        }, 500);

        return () => clearInterval(intervalId);
    }, [selectedCategory, sendMessage]);

    // Count tribunes with more than 1 minute remaining
    const countTribunesByRemainingTime = (tickets, minimumMinutes = 1) => {
        // Filter tickets with more than minimumMinutes minutes remaining
        const validTickets = tickets.filter(ticket => {
            const expiryDate = new Date(ticket.expiry_time);
            const currentDate = new Date();
            const timeDifference = expiryDate - currentDate;
            
            // Check if remaining time is more than minimumMinutes minutes (in milliseconds)
            return timeDifference > (minimumMinutes * 60 * 1000);
        });
        
        // Count occurrences of each tribune
        const tribuneCounts = {};
        validTickets.forEach(ticket => {
            const tribuneName = ticket.tribune_Name || 'Bilinmeyen Tribün';
            tribuneCounts[tribuneName] = (tribuneCounts[tribuneName] || 0) + 1;
        });
        
        return tribuneCounts;
    };
    
    // Get the ticket category from the first ticket
    const getTicketCategory = (tickets) => {
        if (tickets && tickets.length > 0 && tickets[0].seatCategory_Name) {
            return tickets[0].seatCategory_Name;
        }
        return "Kategori Adı";
    };

    // Generate the display string for tribune counts
    const generateTribuneCountsDisplay = (tribuneCounts) => {
        return Object.entries(tribuneCounts)
            .map(([tribune, count]) => `${tribune}: ${count} Adet`)
            .join(' - ');
    };

    // Generate copy format as requested
    const generateCopyFormat = (tribuneCounts, categoryName) => {
        let result = categoryName + '\n\n';
        
        Object.entries(tribuneCounts).forEach(([tribune, count]) => {
            const countText = count === 1 ? 'tek' : `${count}x`;
            result += `${tribune} ${countText}\n`;
        });
        
        return result;
    };

    // Copy tribune counts in specified format
    const copyTribuneCounts = () => {
        const category = getTicketCategory(tickets);
        const copyText = generateCopyFormat(tribuneCounts, category);
        copyToClipboard(copyText);
    };

    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            if (latestMessage.action === 'tickets') {
                if (latestMessage.isError) {
                    showNotification('Biletler yüklenemedi', 'error');
                    setTickets([]);
                    setTribuneCounts({});
                } else if (!latestMessage.result || !latestMessage.result.tickets || latestMessage.result.tickets.length === 0) {
                    showNotification('Aktif bilet bulunamadı', 'warning');
                    setTickets([]);
                    setTribuneCounts({});
                } else {
                    const unexpiredTickets = latestMessage.result.tickets.filter((ticket) => {
                        const expiryDate = new Date(ticket.expiry_time);
                        return expiryDate > new Date();
                    });
                    
                    if (unexpiredTickets.length === 0) {
                        showNotification('Süresiz bilet bulunamadı', 'warning');
                        setTribuneCounts({});
                    } else {
                        // Calculate tribune counts for tickets with more than 1 minute remaining
                        const newTribuneCounts = countTribunesByRemainingTime(unexpiredTickets);
                        setTribuneCounts(newTribuneCounts);
                    }
                    
                    setTickets(unexpiredTickets);
                }
            }
        }
    }, [messages]);
    
    const getRemainingTime = (expiryTime) => {
        const expiryDate = new Date(expiryTime);
        const currentDate = new Date();
        const timeDifference = expiryDate - currentDate;

        if (timeDifference <= 0) return "Süre dolmuş";

        const remainingSeconds = Math.floor(timeDifference / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        return `${minutes} dk ${seconds} sn`;
    };

    const copyToClipboard = (text) => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
              showNotification(`Kopyalandı`, 'success');
            }).catch((err) => {
              showNotification('Kopyalama başarısız', 'error');
            });
          } else {
            throw new Error('Clipboard API desteklenmiyor');
          }
        } catch (err) {
          showNotification('Kopyalama başarısız', 'error');
        }
    };
    
    const fallbackCopyToClipboard = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopiedText(`${text} kopyalandı!`);
            setTimeout(() => setCopiedText(''), 2000);
        } catch (err) {
            console.error('Kopyalama başarısız oldu: ', err);
        }
        document.body.removeChild(textArea);
    };

    const handleTransfer = (rowId, sourceEmail, sourcePassword, targetEmail, targetPassword, isMobile) => {
        if (!targetEmail || !targetPassword) {
          showNotification('Lütfen email ve şifre bilgilerini giriniz', 'warning');
          return;
        }
      
        if (sendMessage) {
          sendMessage({
            action: isMobile ? 'mbl_transfer' : 'web_transfer',
            rowId,
            sourceEmail: sourceEmail,
            sourcePassword: sourcePassword,
            targetEmail: targetEmail,
            targetPassword: targetPassword
          });
          
          showNotification('Transfer işlemi başladı', 'info');
        }
    };

    const copyTicketDetails = (ticket) => {
        const details = `Email: ${ticket.username}\nŞifre: ${ticket.password}\nKoltuk: ${ticket.seatCategory_Name}\nBlok: ${ticket.block_Name}\nTribün: ${ticket.tribune_Name}\nFiyat: ${ticket.formattedTicketPrice}\nSüre: ${getRemainingTime(ticket.expiry_time)}`;
        copyToClipboard(details);
    };

    // Check if there are any tribune counts to display
    const hasTribuneCounts = Object.keys(tribuneCounts).length > 0;

    return (
        <Box p={3}>
            <Box display="flex" flexDirection="column" gap={2} mb={3}>
                {/* Tribune counts summary */}
                {hasTribuneCounts && (
                    <Paper 
                        elevation={1} 
                        sx={{ 
                            p: 2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            backgroundColor: theme.palette.background.paper
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                1 dakikadan fazla süresi olan biletler:
                            </Typography>
                            <Typography variant="body2">
                                {generateTribuneCountsDisplay(tribuneCounts)}
                            </Typography>
                        </Box>
                        <IconButton 
                            onClick={copyTribuneCounts}
                            aria-label="Kopyala"
                            sx={{ 
                                ml: 2,
                                p: 2,
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                color: theme.palette.text.primary,
                                borderRadius: '50%',
                                boxShadow: theme.shadows[1],
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    transform: 'scale(1.05)',
                                    transition: 'all 0.2s'
                                },
                                transition: 'all 0.2s'
                            }}
                        >
                            <ContentCopyIcon fontSize="medium" />
                        </IconButton>
                    </Paper>
                )}

                {/* Category filters */}
                <Box display="flex" gap={1} alignItems="center">
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'contained' : 'outlined'}
                            onClick={() => setSelectedCategory(category)}
                            sx={{ fontSize: '0.7rem' }}
                        >
                            {category}
                        </Button>
                    ))}
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', ml: 2 }}>
                        Toplam Bilet: {tickets.length}
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={2}>
                {tickets.map((ticket, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                            sx={{ 
                                maxWidth: 550, 
                                fontSize: '0.9rem', 
                                position: 'relative', 
                                ':hover .copy-btn': { opacity: 1 }
                            }}>
                            <CardContent>
                                <Grid container spacing={1}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ fontSize: 20 }} gutterBottom>
                                            {ticket.platform}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ 
                                                fontSize: 15, 
                                                cursor: 'pointer',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                                                }
                                            }}
                                            gutterBottom
                                            onClick={() => copyToClipboard(ticket.username)}
                                        >
                                            {ticket.username}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ 
                                                fontSize: 15, 
                                                cursor: 'pointer',
                                                borderRadius: '4px',
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                                                }
                                            }}
                                            gutterBottom
                                            onClick={() => copyToClipboard(ticket.password)}
                                        >
                                            {ticket.password}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: 12 }} gutterBottom>
                                            {ticket.seatCategory_Name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: 12 }} gutterBottom>
                                            {ticket.block_Name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: 12 }} gutterBottom>
                                            {ticket.tribune_Name}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: 12 }} gutterBottom>
                                            <span>Sıra : </span> {ticket.refSeatInfo_RowName} <span>Koltuk : </span> {ticket.refSeatInfo_SeatName}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: 12 }} gutterBottom>
                                            {ticket.formattedTicketPrice}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontSize: 12 }} gutterBottom>
                                            {getRemainingTime(ticket.expiry_time)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} sx={{ margin: 'auto' }}>
                                        <TextField
                                            label="Email"
                                            type="email"
                                            variant="outlined"
                                            margin="dense"
                                            placeholder='E-Posta'
                                            id={`email-${ticket.rowId}`}
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                        <TextField
                                            label="Şifre"
                                            type="text"
                                            variant="outlined"
                                            margin="dense"
                                            placeholder='Parola'
                                            id={`password-${ticket.rowId}`}
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            sx={{ mt: 1, fontSize: '0.7rem' }}
                                            onClick={() => {
                                                const emailInput = document.getElementById(`email-${ticket.rowId}`);
                                                const passwordInput = document.getElementById(`password-${ticket.rowId}`);
                                                
                                                const targetEmail = emailInput?.value;
                                                const targetPassword = passwordInput?.value;

                                                if (!targetEmail || !targetPassword) {
                                                    alert('Lütfen email ve şifre bilgilerini giriniz.');
                                                    return;
                                                }

                                                const isMobile = ticket.platform.toLowerCase().includes('mobil');
                                                handleTransfer(
                                                    ticket.rowId,
                                                    ticket.username,
                                                    ticket.password,
                                                    targetEmail,
                                                    targetPassword,
                                                    isMobile
                                                );
                                            }}
                                        >
                                            Transfer Et
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                            <IconButton
                                onClick={() => copyTicketDetails(ticket)}
                                className="copy-btn"
                                sx={{
                                    position: 'absolute',
                                    top: 5,
                                    right: 5,
                                    fontSize: '0.8rem',
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    padding: '2px',
                                    opacity: 0,
                                    transition: 'opacity 0.3s',
                                    ':hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
                                }}
                            >
                                <CopyIcon fontSize="small" />
                            </IconButton>
                        </Card>
                    </Grid>
                ))}
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
        </Box>
    );
}