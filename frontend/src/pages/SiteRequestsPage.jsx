import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import api from '../api/api';

const SiteRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/site-requests/requests/');
      setRequests(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcess = async (id) => {
    try {
      await api.post(`/api/site-requests/requests/${id}/process/`);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при обработке заявки:', error);
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/api/site-requests/requests/${id}/complete/`);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при завершении заявки:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/api/site-requests/requests/${id}/reject/`);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'primary';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'Новая';
      case 'in_progress':
        return 'В обработке';
      case 'completed':
        return 'Завершена';
      case 'rejected':
        return 'Отклонена';
      default:
        return status;
    }
  };

  if (loading) {
    return <Typography>Загрузка...</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Заявки с сайта
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{new Date(request.created_at).toLocaleString()}</TableCell>
                <TableCell>{request.name}</TableCell>
                <TableCell>{request.phone}</TableCell>
                <TableCell>{request.email}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(request.status)}
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleView(request)}
                    title="Просмотр"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  {request.status === 'new' && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleProcess(request.id)}
                        title="В обработку"
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleReject(request.id)}
                        title="Отклонить"
                      >
                        <CloseIcon />
                      </IconButton>
                    </>
                  )}
                  {request.status === 'in_progress' && (
                    <IconButton
                      size="small"
                      onClick={() => handleComplete(request.id)}
                      title="Завершить"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>Детали заявки</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Имя"
                    value={selectedRequest.name}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Телефон"
                    value={selectedRequest.phone}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    value={selectedRequest.email}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Комментарий"
                    value={selectedRequest.comment}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={4}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Источник"
                    value={selectedRequest.source_domain}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Статус"
                    value={getStatusText(selectedRequest.status)}
                    fullWidth
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SiteRequestsPage; 