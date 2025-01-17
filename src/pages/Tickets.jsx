import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Typography, Grid, TextField, IconButton } from '@mui/material';
import { CopyAll as CopyIcon } from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';

export default function TicketsPage() {
    const categories = ['Mobil', 'Web', 'Hepsi'];
    const [selectedCategory, setSelectedCategory] = useState('Hepsi');
    const [tickets, setTickets] = useState([]);
    const [copiedText, setCopiedText] = useState('');
    const [transferNotification, setTransferNotification] = useState('');
    const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (sendMessage) {
                sendMessage({ action: 'tickets', category: selectedCategory });
            }
        }, 500);

        return () => clearInterval(intervalId);
    }, [selectedCategory, sendMessage]);

    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            if (latestMessage.action === 'tickets') {
                if (latestMessage.isError || latestMessage.result.length === 0) {
                    setTickets([]);
                } else {
                    const unexpiredTickets = latestMessage.result.tickets.filter((ticket) => {
                        const expiryDate = new Date(ticket.expiry_time);
                        return expiryDate > new Date();
                    });
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
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedText(`${text} kopyalandı!`);
                setTimeout(() => setCopiedText(''), 2000);
            }).catch((err) => {
                console.error('Kopyalama başarısız oldu: ', err);
                fallbackCopyToClipboard(text);
            });
        } else {
            fallbackCopyToClipboard(text);
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
        if (sendMessage) {
            sendMessage({
                action: isMobile ? 'mbl_transfer' : 'web_transfer',
                rowId,
                sourceEmail: sourceEmail,
                sourcePassword: sourcePassword,
                targetEmail: targetEmail,
                targetPassword: targetPassword
            });
            
            setTransferNotification('Transfer işlemi başladı');
            setTimeout(() => setTransferNotification(''), 2000);
        }
    };

    const copyTicketDetails = (ticket) => {
        const details = `Email: ${ticket.username}\nŞifre: ${ticket.password}\nKoltuk: ${ticket.seatCategory_Name}\nBlok: ${ticket.block_Name}\nTribün: ${ticket.tribune_Name}\nFiyat: ${ticket.formattedTicketPrice}\nSüre: ${getRemainingTime(ticket.expiry_time)}`;
        copyToClipboard(details);
    };

    return (
        <Box p={3}>
            <Box display="flex" gap={1} mb={3} alignItems="center">
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

            {(copiedText || transferNotification) && (
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
                    {copiedText || transferNotification}
                </Box>
            )}
        </Box>
    );
}