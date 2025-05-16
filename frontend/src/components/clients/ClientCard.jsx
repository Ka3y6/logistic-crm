import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Divider,
  Box,
  // Link as MuiLink // Не используется
} from '@mui/material';
import { Close as CloseIcon, MailOutline as MailIcon } from '@mui/icons-material';
import { useEmail } from '../../contexts/EmailContext';

const ClientCard = ({ open, onClose, client }) => {
  const { openComposeModal } = useEmail();

  if (!client) return null;

  // Преобразуем контакты из формата {manager: [], director: []} в массив
  const contacts = [];
  if (client.contacts?.manager?.length > 0) {
    contacts.push(...client.contacts.manager.map(c => ({ ...c, contact_type: 'manager' })));
  }
  if (client.contacts?.director?.length > 0) {
    contacts.push(...client.contacts.director.map(c => ({ ...c, contact_type: 'director' })));
  }

  // Функция-обработчик для клика по email
  const handleEmailClick = (emailAddress) => {
    if (emailAddress) {
      console.log(`Email clicked: ${emailAddress}, opening compose modal...`);
      openComposeModal({ to: emailAddress });
      // Можно закрыть карточку клиента после открытия окна письма, если нужно
      // onClose(); 
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {client.company_name || 'Новый клиент'}
          </Typography>
          <Button onClick={onClose} color="inherit">
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Основная информация
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Наименование компании
                </Typography>
                <Typography variant="body1">
                  {client.company_name || 'Не указано'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Сфера деятельности
                </Typography>
                <Typography variant="body1">
                  {client.business_scope || 'Не указана'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Адрес
                </Typography>
                <Typography variant="body1">
                  {client.address || 'Не указан'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Реквизиты
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">
                  УНП
                </Typography>
                <Typography variant="body1">
                  {client.unp || 'Не указан'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">
                  УНН
                </Typography>
                <Typography variant="body1">
                  {client.unn || 'Не указан'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary">
                  ОКПО
                </Typography>
                <Typography variant="body1">
                  {client.okpo || 'Не указан'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Банковские реквизиты
                </Typography>
                <Typography variant="body1">
                  {client.bank_details || 'Не указаны'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Контактная информация
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Контактная информация</Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><b>Имя:</b> {client?.user?.username || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 0.5 }}><b>Email:</b></Typography>
                    {client?.user?.email ? (
                      <Box 
                        onClick={() => handleEmailClick(client.user.email)}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' } 
                        }}
                      >
                        <MailIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} />
                        <Typography variant="body2" component="span">{client.user.email}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">-</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><b>Телефон:</b> {client?.phone || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>
            {contacts.length > 0 ? (
              <Grid container spacing={2}>
                {contacts.map((contact, index) => (
                  <React.Fragment key={index}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="primary">
                        {contact.contact_type === 'manager' ? 'Менеджер' : 'Директор'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        ФИО
                      </Typography>
                      <Typography variant="body1">
                        {contact.name || 'Не указано'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Телефон
                      </Typography>
                      <Typography variant="body1">
                        {contact.phone || 'Не указан'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Email
                      </Typography>
                      {contact.email ? (
                        <Box 
                          onClick={() => handleEmailClick(contact.email)}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer',
                            color: 'primary.main',
                            '&:hover': { textDecoration: 'underline' } 
                          }}
                        >
                          <MailIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} />
                          <Typography variant="body2" component="span">{contact.email}</Typography>
                      </Box>
                       ) : (
                         <Typography variant="body1">Не указан</Typography>
                       )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Skype
                      </Typography>
                      <Typography variant="body1">
                        {contact.skype || 'Не указан'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Telegram
                      </Typography>
                      <Typography variant="body1">
                        {contact.telegram || 'Не указан'}
                      </Typography>
                    </Grid>
                    {index < contacts.length - 1 && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                      </Grid>
                    )}
                  </React.Fragment>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="textSecondary">
                Контактная информация не указана
              </Typography>
            )}
          </Grid>

          {client.comments && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="textSecondary">
                Комментарии
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body1">
                {client.comments}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientCard; 