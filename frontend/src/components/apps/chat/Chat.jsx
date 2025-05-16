import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, TextField, Button, Avatar } from '@mui/material';
import api from '../../../api';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get('chat/messages');
        setMessages(response.data);
      } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        setMessages([{
          id: 1,
          sender: 'Система',
          text: 'Добро пожаловать в чат!',
          timestamp: new Date(),
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        await api.post('chat/messages', {
          text: newMessage,
          sender: 'Вы'
        });
        
        setMessages(prevMessages => [...prevMessages, {
          id: Date.now(),
          sender: 'Вы',
          text: newMessage,
          timestamp: new Date(),
        }]);
        setNewMessage('');
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography>Загрузка сообщений...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100vh' }}>
      <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" gutterBottom>
          Чат
        </Typography>
        
        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem key={message.id}>
                <Avatar sx={{ mr: 2 }}>{message.sender[0]}</Avatar>
                <ListItemText
                  primary={message.sender}
                  secondary={
                    <>
                      {message.text}
                      <Typography variant="caption" display="block">
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Отправить
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chat; 