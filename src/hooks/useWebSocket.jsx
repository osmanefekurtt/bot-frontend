import { useState, useEffect, useCallback } from 'react';

export function useWebSocket(url) {
  const [ws, setWs] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // WebSocket bağlantısını başlat
  useEffect(() => {
    const socket = new WebSocket(url);
    setWs(socket);

    socket.onopen = () => {
      setIsOpen(true);
      console.log('WebSocket bağlantısı kuruldu');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, message];
        return newMessages.length >= 50 ? [] : newMessages; // Clear messages after 20
      });
    };

    socket.onclose = () => {
      setIsOpen(false);
      console.log('WebSocket bağlantısı kapandı');
    };

    return () => {
      socket.close();
    };
  }, [url]);

  // Mesaj gönderme
  const sendMessage = useCallback(
    (message) => {
      if (ws && isOpen) {
        ws.send(JSON.stringify(message));
      }
    },
    [ws, isOpen]
  );

  return { ws, isOpen, messages, sendMessage };
}
