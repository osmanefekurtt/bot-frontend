import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, TextField, Grid, Typography, Alert, Collapse, useTheme, IconButton } from '@mui/material';
import { useWebSocket } from '../hooks/useWebSocket';
import WEB_SOCKET_URL from '../config';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function CheckPriority() {
    const theme = useTheme();
    const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
    const [matches, setMatches] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [priorityCodes, setPriorityCodes] = useState('');
    const [workingCodes, setWorkingCodes] = useState([]);
    const [nonWorkingCodes, setNonWorkingCodes] = useState([]);
    const [isChecking, setIsChecking] = useState(false);
    const [notification, setNotification] = useState({
        message: '',
        type: 'info',
        show: false
    });

    const handleCopy = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            showNotification(`${type} kopyalandı`, 'success');
        } catch (err) {
            showNotification('Kopyalama hatası: ' + err.message, 'error');
        }
    };

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
        if (sendMessage) {
            sendMessage({ action: 'get_matches' });
            
            const interval = setInterval(() => {
                sendMessage({ action: 'get_priority_status' });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [sendMessage]);

    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            
            switch(latestMessage.action) {
                case 'get_matches':
                    if (!latestMessage.isError && latestMessage.result?.matches) {
                        setMatches(latestMessage.result.matches || []);
                    } else {
                        showNotification('Maç listesi alınamadı', 'error');
                    }
                    break;
                case 'get_priorities':
                    if (!latestMessage.isError && latestMessage.result?.priorities) {
                        setPriorities(latestMessage.result.priorities || []);
                    } else {
                        showNotification('Öncelik listesi alınamadı', 'error');
                    }
                    break;
                case 'check_priorities':
                    if (latestMessage.isError) {
                        showNotification(latestMessage.error?.message || 'Kontrol işlemi başarısız', 'error');
                    }
                    break;
                case 'get_priority_status':
                    if (!latestMessage.isError && latestMessage.result) {
                        setIsChecking(latestMessage.result.is_active);
                        setWorkingCodes(latestMessage.result.check_priorities || []);
                        setNonWorkingCodes(latestMessage.result.failed_priorities || []);
                    }
                    break;
            }
        }
    }, [messages]);

    const handleMatchChange = (event) => {
        const matchId = event.target.value;
        setSelectedMatch(matchId);
        if (matchId) {
            sendMessage({ 
                action: 'get_priorities',
                match_id: matchId
            });
        }
    };

    const handlePriorityCodesChange = (e) => {
        const codes = e.target.value.split('\n').filter(code => code.trim());
        if (codes.length > 50) {
            showNotification('Maximum 50 satır girebilirsiniz', 'warning');
            return;
        }
        setPriorityCodes(e.target.value);
    };

    const handleCheck = () => {
        const codes = priorityCodes.split('\n').filter(code => code.trim());
        if (codes.length > 50) {
            showNotification('Maximum 50 satır girebilirsiniz', 'error');
            return;
        }
        
        if (!selectedMatch || !selectedPriority) {
            showNotification('Lütfen maç ve öncelik seçiniz', 'warning');
            return;
        }

        sendMessage({
            action: 'get_check_priorities',
            match_id: selectedMatch,
            priority_id: selectedPriority,
            codes: codes
        });
    };

    return (
        <Box p={3}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                    <FormControl fullWidth>
                        <InputLabel>Maç Seçin</InputLabel>
                        <Select
                            value={selectedMatch}
                            onChange={handleMatchChange}
                            label="Maç Seçin"
                        >
                            {matches.map((match) => (
                                <MenuItem key={match.match_id} value={match.match_id}>
                                    {match.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4}>
                    <FormControl fullWidth>
                        <InputLabel>Öncelik Seçin</InputLabel>
                        <Select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            label="Öncelik Seçin"
                        >
                            {priorities.map((priority) => (
                                <MenuItem key={priority.id} value={priority.id}>
                                    {priority.displayName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4}>
                    <Button 
                        variant="contained" 
                        onClick={handleCheck}
                        fullWidth 
                        sx={{ height: '56px' }}
                        disabled={isChecking}
                    >
                        {isChecking ? 'Kontrol Ediliyor...' : 'Kontrol Et'}
                    </Button>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>Öncelik Kodları (Max: 50)</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={priorityCodes}
                        onChange={handlePriorityCodesChange}
                        placeholder="Her satıra bir kod gelecek şekilde giriniz..."
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">Çalışan Kodlar</Typography>
                        <IconButton 
                            onClick={() => handleCopy(workingCodes.join('\n'), 'Çalışan kodlar')}
                            size="small"
                            disabled={!workingCodes.length}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={workingCodes.join('\n')}
                        InputProps={{ readOnly: true }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">Çalışmayan Kodlar</Typography>
                        <IconButton 
                            onClick={() => handleCopy(nonWorkingCodes.join('\n'), 'Çalışmayan kodlar')}
                            size="small"
                            disabled={!nonWorkingCodes.length}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={nonWorkingCodes.join('\n')}
                        InputProps={{ readOnly: true }}
                    />
                </Grid>
            </Grid>

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