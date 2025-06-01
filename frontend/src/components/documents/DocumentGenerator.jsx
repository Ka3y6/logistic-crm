import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../../api/api';

const DocumentGenerator = ({ orderId }) => {
  const [documents, setDocuments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    template: '',
    data: {},
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get(`documents/?order=${orderId}`);
      let documentsData = response.data;
      
      // Проверяем различные форматы ответа
      if (typeof documentsData === 'object' && documentsData !== null) {
        if (Array.isArray(documentsData.results)) {
          documentsData = documentsData.results;
        } else if (Array.isArray(documentsData.data)) {
          documentsData = documentsData.data;
        }
      }
      
      // Убеждаемся, что documentsData - это массив
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Ошибка при загрузке документов:', error);
      setError('Ошибка при загрузке документов');
      setDocuments([]); // Устанавливаем пустой массив в случае ошибки
    }
  }, [orderId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenDialog = (document = null) => {
    if (document) {
      setFormData({
        type: document.type,
        template: document.template,
        data: document.data,
      });
      setSelectedDocument(document);
    } else {
      setFormData({
        type: '',
        template: '',
        data: {},
      });
      setSelectedDocument(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDocument(null);
  };

  const handleGenerateDocument = async () => {
    try {
      const response = await api.post(`orders/${orderId}/generate-document/`, formData);
      window.open(response.data.document_url, '_blank');
      fetchDocuments();
    } catch (error) {
      setError(error.response?.data?.message || 'Произошла ошибка при генерации документа');
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await api.get(`documents/${documentId}/download/`);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document-${documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Ошибка при скачивании документа:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Документы заказа</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Создать документ
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Тип документа</TableCell>
              <TableCell>Шаблон</TableCell>
              <TableCell>Дата создания</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(documents) && documents.length > 0 ? (
              documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>{document.type}</TableCell>
                  <TableCell>{document.template}</TableCell>
                  <TableCell>
                    {new Date(document.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={document.status}
                      color={document.status === 'active' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleDownload(document.id)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Документы не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDocument ? 'Редактировать документ' : 'Создать документ'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Тип документа</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Тип документа"
                >
                  <MenuItem value="contract">Договор</MenuItem>
                  <MenuItem value="invoice">Счет</MenuItem>
                  <MenuItem value="act">Акт выполненных работ</MenuItem>
                  <MenuItem value="transport_order">Транспортная накладная</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Шаблон</InputLabel>
                <Select
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  label="Шаблон"
                >
                  <MenuItem value="standard">Стандартный</MenuItem>
                  <MenuItem value="custom">Пользовательский</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleGenerateDocument} variant="contained">
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentGenerator; 