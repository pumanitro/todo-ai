import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Container,
} from '@mui/material';
import { Add, Delete, Refresh } from '@mui/icons-material';
import { database } from '../firebase/config';
import { ref, push, onValue, remove } from 'firebase/database';

interface Message {
  id: string;
  text: string;
  timestamp: number;
}

const HelloWorld: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const messagesRef = ref(database, 'messages');
    
    // Listen for changes in the database
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList: Message[] = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          text: value.text,
          timestamp: value.timestamp,
        }));
        
        // Sort by timestamp (newest first)
        messageList.sort((a, b) => b.timestamp - a.timestamp);
        setMessages(messageList);
        setIsConnected(true);
      } else {
        setMessages([]);
        setIsConnected(true);
      }
    }, (error) => {
      console.error('Firebase error:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, []);

  const addMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messagesRef = ref(database, 'messages');
      await push(messagesRef, {
        text: newMessage.trim(),
        timestamp: Date.now(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const messageRef = ref(database, `messages/${messageId}`);
      await remove(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      addMessage();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom color="primary">
          🚀 Hello World!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          React + TypeScript + Firebase Real-time Database + Material UI
        </Typography>
        <Chip 
          label={isConnected ? 'Connected to Firebase' : 'Connecting...'} 
          color={isConnected ? 'success' : 'warning'}
          icon={<Refresh />}
          sx={{ mt: 2 }}
        />
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Real-time Messages
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Type a message"
              variant="outlined"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your message here..."
            />
            <Button
              variant="contained"
              onClick={addMessage}
              disabled={!newMessage.trim()}
              startIcon={<Add />}
              sx={{ minWidth: 120 }}
            >
              Add
            </Button>
          </Box>

          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No messages yet. Add your first message above! 🎉
              </Typography>
            </Box>
          ) : (
            <List>
              {messages.map((message) => (
                <ListItem key={message.id} divider>
                  <ListItemText
                    primary={message.text}
                    secondary={`Added: ${new Date(message.timestamp).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => deleteMessage(message.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 What's working here:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="✅ React 18 with TypeScript" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✅ Material UI components and theming" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✅ Firebase Real-time Database integration" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✅ Real-time data synchronization" />
            </ListItem>
            <ListItem>
              <ListItemText primary="✅ CRUD operations (Create, Read, Delete)" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default HelloWorld; 