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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import MailIcon from '@mui/icons-material/Mail';
import { useEmail } from '../../contexts/EmailContext';

const CarrierCard = ({ open, onClose, carrier }) => {
  const { openComposeModal } = useEmail();

  if (!carrier) return null;

  // Получаем контакты менеджера и директора без дефолтных значений
  const managerContact = carrier.contacts?.manager?.[0];
  const directorContact = carrier.contacts?.director?.[0];

  // Функция-обработчик для клика по email
  const handleEmailClick = (emailAddress) => {
    if (emailAddress) {
      console.log(`Email clicked: ${emailAddress}, opening compose modal...`);
      openComposeModal({ to: emailAddress });
      // onClose(); // Можно закрыть карточку при необходимости
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
            {carrier.company_name}
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
                  {carrier.company_name || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Направления работы
                </Typography>
                <Typography variant="body1">
                  {carrier.working_directions || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Расположение
                </Typography>
                <Typography variant="body1">
                  {carrier.location || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Номер ТС или контейнера
                </Typography>
                <Typography variant="body1">
                  {carrier.vehicle_number || ''}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Автопарк
                </Typography>
                <Typography variant="body1">
                  {carrier.fleet || ''}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Контакты менеджера
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  ФИО
                </Typography>
                <Typography variant="body1">
                  {managerContact?.name || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Телефон
                </Typography>
                <Typography variant="body1">
                  {managerContact?.phone || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Email
                </Typography>
                {managerContact?.email ? (
                  <Box 
                    onClick={() => handleEmailClick(managerContact.email)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' } 
                    }}
                  >
                    <MailIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} />
                    <Typography variant="body1" component="span">{managerContact.email}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body1">-</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Skype
                </Typography>
                <Typography variant="body1">
                  {managerContact?.skype || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Telegram
                </Typography>
                <Typography variant="body1">
                  {managerContact?.telegram || ''}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Контакты директора
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  ФИО
                </Typography>
                <Typography variant="body1">
                  {directorContact?.name || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Телефон
                </Typography>
                <Typography variant="body1">
                  {directorContact?.phone || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Email
                </Typography>
                {directorContact?.email ? (
                  <Box 
                    onClick={() => handleEmailClick(directorContact.email)}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' } 
                    }}
                  >
                    <MailIcon fontSize="inherit" sx={{ mr: 0.5, color: 'action.active' }} />
                    <Typography variant="body1" component="span">{directorContact.email}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body1">-</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Skype
                </Typography>
                <Typography variant="body1">
                  {directorContact?.skype || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Telegram
                </Typography>
                <Typography variant="body1">
                  {directorContact?.telegram || ''}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Известные тарифы
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">
              {carrier.known_rates || ''}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" color="textSecondary">
              Комментарии
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">
              {carrier.comments || ''}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CarrierCard; 