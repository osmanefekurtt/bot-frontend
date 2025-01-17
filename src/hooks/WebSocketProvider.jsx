import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket.jsx';
import WEB_SOCKET_URL from '../config.jsx';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const [botStatus, setBotStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);

  // Gelen mesajları işleme
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message) => {
        if (message.action === 'bot_status') {
          setBotStatus(message.result); // Bot durumunu güncelle
        }

        if (message.action === 'accounts' && !message.isError) {
          const newAccounts = message.result.map((account) => ({
            segment: account.segment,
            title: account.title,
          }));
          setAccounts(newAccounts); // Hesapları güncelle
        }
      });
    }
  }, [messages]);

  // Hesapları çekmek için mesaj gönderme
  useEffect(() => {
    if (sendMessage) {
      sendMessage({ action: 'accounts', type: 'all' }); // İlk başta hesapları çek
    }

    const interval = setInterval(() => {
      if (sendMessage) {
        sendMessage({ action: 'accounts', type: 'all' }); // 20 saniyede bir hesapları çek
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [sendMessage]);

  return (
    <WebSocketContext.Provider value={{ messages, sendMessage, botStatus, accounts }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  return useContext(WebSocketContext);
}
