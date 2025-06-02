import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import { documentsApi } from '../api/api';

const DocumentSelector = ({ open, onClose, onSelect }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await documentsApi.getAll();
      console.log('Response from server:', response);
      console.log('Response data:', response.data);
      const docs = Array.isArray(response.data) ? response.data : [];
      console.log('Processed documents:', docs);
      setDocuments(docs);
    } catch (err) {
      setError('Ошибка при загрузке документов');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (docId) => {
    setSelectedDocs(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  const handleSubmit = () => {
    const selectedDocuments = documents.filter(doc => selectedDocs.includes(doc.id));
    onSelect(selectedDocuments);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Выберите документы для прикрепления</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center">
            Нет доступных документов
          </Typography>
        ) : (
          <List>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                button
                onClick={() => handleToggle(doc.id)}
              >
                <Checkbox
                  edge="start"
                  checked={selectedDocs.includes(doc.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemText
                  primary={doc.name}
                  secondary={new Date(doc.created_at).toLocaleDateString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={selectedDocs.length === 0}
        >
          Прикрепить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentSelector; 