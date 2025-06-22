import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
import { siteRequestsApi } from '../api/api';
import ClientForm from '../components/clients/ClientForm';
import { clientsApi } from '../api/api';
import SiteRequestList from '../components/siteRequests/SiteRequestList';

const SiteRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await siteRequestsApi.getAll();
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      setRequests(Array.isArray(response.data.results) ? response.data.results : []);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcess = async (id) => {
    try {
      await siteRequestsApi.process(id);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при обработке заявки:', error);
    }
  };

  const handleComplete = async (id) => {
    try {
      await siteRequestsApi.complete(id);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при завершении заявки:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await siteRequestsApi.reject(id);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleOpenCreateClient = (request) => {
    setSelectedRequest(request);
    setCreateDialogOpen(true);
  };

  const handleCreateClient = async (formData) => {
    try {
      await clientsApi.create(formData);
      await siteRequestsApi.process(selectedRequest.id);
      setCreateDialogOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при создании клиента:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить заявку?')) return;
    try {
      await siteRequestsApi.delete(id);
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при удалении заявки:', error);
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!ids.length) return;
    if (!window.confirm(`Удалить ${ids.length} заявок?`)) return;
    try {
      for (const id of ids) {
        await siteRequestsApi.delete(id);
      }
      fetchRequests();
    } catch (error) {
      console.error('Ошибка при массовом удалении заявок:', error);
    }
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
      <SiteRequestList
        requests={requests}
        loading={loading}
        error={null}
        onApprove={handleOpenCreateClient}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onApplyFilters={() => {}}
      />

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

      <ClientForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateClient}
        client={selectedRequest ? {
          company_name: selectedRequest.name,
          comments: selectedRequest.message || '',
          contacts: [
            {
              type: 'manager',
              phone: selectedRequest.phone,
              email: selectedRequest.email,
              name: selectedRequest.name,
            },
          ],
        } : null}
      />
    </Box>
  );
};

export default SiteRequestsPage; 