import React, { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Link,
  FormControl,
  InputLabel
} from '@mui/material';
import api from '../../api/api';

const DocumentGenerator = ({ order }) => {
  const [documentType, setDocumentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filePath, setFilePath] = useState(null);

  const handleGenerate = async () => {
    if (!documentType) {
      setError('Выберите тип документа');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/orders/${order.id}/generate_document/`, { document_type: documentType });
      setFilePath(response.data.file_path);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при генерации документа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Генерация документов
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="document-type-label">Тип документа</InputLabel>
        <Select
          labelId="document-type-label"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          label="Тип документа"
        >
          <MenuItem value="">Выберите тип документа</MenuItem>
          <MenuItem value="contract">Договор</MenuItem>
          <MenuItem value="invoice">Счет</MenuItem>
          <MenuItem value="act">Акт</MenuItem>
        </Select>
      </FormControl>
      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={loading || !documentType}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Сгенерировать'}
      </Button>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {filePath && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Документ успешно сгенерирован. <Link href={filePath} target="_blank">Скачать</Link>
        </Alert>
      )}
    </Box>
  );
};

export default DocumentGenerator; 