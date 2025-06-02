import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  Box,
  Tooltip,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import api from '../../api';

// Helper to extract contacts consistently
const getContactsFromEntity = (entity, type) => {
    const contacts = [];
    if (!entity) return contacts;

    if (type === 'client' && entity.user?.email) {
        contacts.push({ type: 'Email (осн.)', value: entity.user.email, source: 'user' });
    }

    const managerContacts = entity.contacts?.manager || [];
    managerContacts.forEach(c => {
        if (c.phone) contacts.push({ type: 'Телефон (менеджер)', value: c.phone, source: 'manager' });
        if (c.email) contacts.push({ type: 'Email (менеджер)', value: c.email, source: 'manager' });
    });

    const directorContacts = entity.contacts?.director || [];
    directorContacts.forEach(c => {
        if (c.phone) contacts.push({ type: 'Телефон (директор)', value: c.phone, source: 'director' });
        if (c.email) contacts.push({ type: 'Email (директор)', value: c.email, source: 'director' });
    });

    return contacts;
};


const ContactSelectionModal = ({ open, onClose, onContactSelect }) => {
  const [clients, setClients] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState(null); // 'client' or 'carrier'
  const [selectedEntity, setSelectedEntity] = useState(null); // Full entity object with details
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch lists on open
  useEffect(() => {
    if (open) {
      setError('');
      setSearchTerm('');
      setSelectedEntity(null);
      setSelectedEntityType(null);

      const fetchLists = async () => {
        setLoadingClients(true);
        setLoadingCarriers(true);
        try {
          const [clientRes, carrierRes] = await Promise.all([
            api.get('/clients/?limit=1000'), // Fetch a large list initially
            api.get('/carriers/?limit=1000')
          ]);
          setClients(clientRes.data.results || clientRes.data || []);
          setCarriers(carrierRes.data.results || carrierRes.data || []);
        } catch (err) {
          console.error("Error fetching clients/carriers:", err);
          setError('Не удалось загрузить списки клиентов/перевозчиков.');
        } finally {
          setLoadingClients(false);
          setLoadingCarriers(false);
        }
      };
      fetchLists();
    }
  }, [open]);

  // Filter lists based on search term
  const filteredClients = useMemo(() =>
    clients.filter(c =>
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]);

  const filteredCarriers = useMemo(() =>
    carriers.filter(c =>
      c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [carriers, searchTerm]);

  // Fetch entity details on selection
  const handleSelectEntity = async (type, entityId) => {
    setSelectedEntityType(type);
    setSelectedEntity(null); // Clear previous details
    setLoadingDetails(true);
    setError('');
    try {
      // Assuming detail endpoints exist
      const response = await api.get(`/${type === 'client' ? 'clients' : 'carriers'}/${entityId}/`);
      setSelectedEntity(response.data);
    } catch (err) {
      console.error(`Error fetching ${type} details:`, err);
      setError(`Не удалось загрузить детали ${type === 'client' ? 'клиента' : 'перевозчика'}.`);
      setSelectedEntityType(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle contact selection
  const handleContactClick = (contact) => {
    if (!selectedEntity || !selectedEntityType) return;
    const entityName = selectedEntity.company_name || `${selectedEntity.user?.first_name || ''} ${selectedEntity.user?.last_name || ''}`.trim();
    const entityTypeLabel = selectedEntityType === 'client' ? 'Клиент' : 'Перевозчик';
    const contactString = `[Контакт: ${entityTypeLabel} "${entityName}" - ${contact.type} ${contact.value}]`;
    onContactSelect(contactString);
    onClose(); // Close modal after selection
  };

  const contacts = useMemo(() => getContactsFromEntity(selectedEntity, selectedEntityType), [selectedEntity, selectedEntityType]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>Выбор контакта</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Grid container spacing={0} sx={{ height: '60vh' }}>
          {/* Search and Lists Column */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', borderRight: { md: '1px solid divider' } }}>
            <Box sx={{ p: 2, borderBottom: '1px solid divider' }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Поиск по названию/имени..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {(loadingClients || loadingCarriers) && !clients.length && !carriers.length && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              )}
              <Grid container spacing={0}>
                <Grid item xs={6} sx={{ borderRight: '1px solid divider' }}>
                  <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>Клиенты</Typography>
                  <List dense sx={{ pt: 0 }}>
                    {loadingClients && clients.length === 0 && <ListItem><CircularProgress size={20} /></ListItem>}
                    {filteredClients.map(client => (
                      <ListItemButton
                        key={client.id}
                        selected={selectedEntityType === 'client' && selectedEntity?.id === client.id}
                        onClick={() => handleSelectEntity('client', client.id)}
                      >
                        <ListItemText primary={client.company_name} secondary={`${client.user?.first_name || ''} ${client.user?.last_name || ''}`.trim()} />
                      </ListItemButton>
                    ))}
                    {!loadingClients && filteredClients.length === 0 && <ListItem><ListItemText primary="Нет клиентов" /></ListItem>}
                  </List>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" sx={{ p: 1, bgcolor: 'grey.100', textAlign: 'center' }}>Перевозчики</Typography>
                  <List dense sx={{ pt: 0 }}>
                    {loadingCarriers && carriers.length === 0 && <ListItem><CircularProgress size={20} /></ListItem>}
                    {filteredCarriers.map(carrier => (
                      <ListItemButton
                        key={carrier.id}
                        selected={selectedEntityType === 'carrier' && selectedEntity?.id === carrier.id}
                        onClick={() => handleSelectEntity('carrier', carrier.id)}
                      >
                        <ListItemText primary={carrier.company_name} />
                      </ListItemButton>
                    ))}
                    {!loadingCarriers && filteredCarriers.length === 0 && <ListItem><ListItemText primary="Нет перевозчиков" /></ListItem>}
                  </List>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Details Column */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid divider', bgcolor: 'grey.50', minHeight: '65px' }}>
              <Typography variant="h6">
                {selectedEntity ?
                  selectedEntity.company_name || `${selectedEntity.user?.first_name || ''} ${selectedEntity.user?.last_name || ''}`.trim()
                  : 'Выберите клиента или перевозчика'}
              </Typography>
              {selectedEntityType && (
                  <Typography variant="caption" color="text.secondary">
                      {selectedEntityType === 'client' ? 'Клиент' : 'Перевозчик'}
                  </Typography>
              )}
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {loadingDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : selectedEntity ? (
                 contacts.length > 0 ? (
                    <List dense>
                      {contacts.map((contact, index) => (
                        <ListItemButton key={index} onClick={() => handleContactClick(contact)}>
                           <Tooltip title={contact.type} placement="left">
                               {contact.type.toLowerCase().includes('email') ?
                                   <EmailIcon sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small"/> :
                                   <PhoneIcon sx={{ mr: 1.5, color: 'text.secondary' }} fontSize="small"/>
                               }
                           </Tooltip>
                          <ListItemText primary={contact.value} secondary={contact.type} />
                        </ListItemButton>
                      ))}
                    </List>
                 ) : (
                   <Typography color="text.secondary">Нет контактных данных</Typography>
                 )
              ) : (
                <Typography color="text.secondary">Контактные данные появятся здесь</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
        {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactSelectionModal; 