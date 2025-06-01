import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
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
  TextField,
  MenuItem,
  Link
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { documentsApi } from '../api/api';

const Documents = () => {
  const { orderId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    document_type: '',
    file: null
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await documentsApi.getAll();
      if (orderId) {
        const filteredDocs = response.data.filter(doc => doc.order_id === parseInt(orderId));
        setDocuments(filteredDocs);
      } else {
        setDocuments(response.data);
      }
    } catch (err) {
      setError('Ошибка при загрузке документов');
      console.error('Ошибка:', err);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (event) => {
    setNewDocument({
      ...newDocument,
      file: event.target.files[0]
    });
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newDocument.name);
      formData.append('document_type', newDocument.document_type);
      formData.append('file', newDocument.file);
      if (orderId) {
        formData.append('order', orderId);
      }

      await documentsApi.create(formData);
      setOpenDialog(false);
      fetchDocuments();
      setNewDocument({ name: '', document_type: '', file: null });
    } catch (err) {
      setError('Ошибка при создании документа');
      console.error('Ошибка:', err);
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот документ?')) {
      try {
        await documentsApi.delete(documentId);
        fetchDocuments();
      } catch (err) {
        setError('Ошибка при удалении документа');
        console.error('Ошибка:', err);
      }
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await documentsApi.getById(document.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Ошибка при скачивании документа');
      console.error('Ошибка:', err);
    }
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          {orderId ? 'Документы заказа' : 'Все документы'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Добавить документ
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Тип документа</TableCell>
              {!orderId && <TableCell>Заказ</TableCell>}
              <TableCell>Дата создания</TableCell>
              <TableCell>Размер</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>{document.name}</TableCell>
                <TableCell>{document.document_type}</TableCell>
                {!orderId && (
                  <TableCell>
                    {document.order_id && (
                      <Link
                        component={RouterLink}
                        to={`/orders/${document.order_id}`}
                      >
                        Заказ #{document.order_id}
                      </Link>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {new Date(document.created_at).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>{document.file_size}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleDownload(document)}
                  >
                    <DownloadIcon />
                  </IconButton>
                  {!orderId && document.order_id && (
                    <IconButton
                      color="primary"
                      component={RouterLink}
                      to={`/orders/${document.order_id}/documents`}
                    >
                      <ViewIcon />
                    </IconButton>
                  )}
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(document.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Добавить документ</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название документа"
                value={newDocument.name}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Тип документа"
                value={newDocument.document_type}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, document_type: e.target.value })
                }
              >
                <MenuItem value="contract">Договор</MenuItem>
                <MenuItem value="invoice">Счет</MenuItem>
                <MenuItem value="act">Акт</MenuItem>
                <MenuItem value="other">Другое</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Выбрать файл
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {newDocument.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Выбран файл: {newDocument.file.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!newDocument.name || !newDocument.document_type || !newDocument.file}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents; 