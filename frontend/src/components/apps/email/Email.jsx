import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button, CircularProgress, Alert, ListItemIcon, Checkbox, Toolbar, Tooltip, IconButton, Grid, Divider, ListSubheader, ListItemButton, Snackbar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkAsUnreadIcon from '@mui/icons-material/MarkAsUnread';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import InboxIcon from '@mui/icons-material/Inbox';
import SendIcon from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CreateIcon from '@mui/icons-material/Create';
import AttachmentIcon from '@mui/icons-material/Attachment';
import api from '../../../api';
import EmailView from './EmailView';
import { styled } from '@mui/material/styles';
import MarkunreadIcon from '@mui/icons-material/Markunread';
import { useEmail } from '../../../contexts/EmailContext';

const mailboxes = [
  { name: 'INBOX', label: 'Входящие', icon: <InboxIcon fontSize="small" /> },
  { name: 'INBOX.Sent', label: 'Отправленные', icon: <SendIcon fontSize="small" /> }, 
  { name: 'INBOX.Trash', label: 'Корзина', icon: <DeleteSweepIcon fontSize="small" /> },
];

const StyledListItemText = styled(ListItemText)({
    '& .MuiListItemText-primary': {
        fontWeight: 'normal',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    '& .MuiListItemText-secondary': {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
});

const EmailListItem = styled(ListItemButton, { 
    shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'unread' 
})(({ theme, selected, unread }) => ({
    borderLeft: selected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
    backgroundColor: selected ? theme.palette.action.selected : theme.palette.background.paper,
    '& .MuiListItemText-primary': {
        fontWeight: unread ? 'bold' : 'normal',
    },
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    position: 'relative',
    paddingRight: '100px',
}));

// Функция для получения правильного имени папки
const getMailboxName = (name) => {
  return name;
};

const Email = () => {
  const {
    openComposeModal,
  } = useEmail();
  const [emails, setEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState('INBOX');
  const [hoveredEmailId, setHoveredEmailId] = useState(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalEmails, setTotalEmails] = useState(0);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const listRef = useRef(null);

  useEffect(() => {
    if (selectedMailbox) {
      setLoading(true);
      setSelectedEmail(null);
      setEmails([]);
      setCurrentOffset(0);
      setTotalEmails(0);
      setHasMoreEmails(true);
      setSelectedEmailIds(new Set());
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }

      const fetchData = async () => {
        const offsetToFetch = 0;
        const limitToFetch = 25;
        try {
          const mailboxName = getMailboxName(selectedMailbox);
          console.log(`Запрос писем (useEffect): mailbox=${mailboxName}, limit=${limitToFetch}, offset=${offsetToFetch}`);
          const response = await api.get(`/email/messages/?mailbox=${encodeURIComponent(mailboxName)}&limit=${limitToFetch}&offset=${offsetToFetch}`, {
            timeout: 60000 // Увеличиваем таймаут до 60 секунд
          });
          const fetchedEmails = response.data.emails || [];
          const totalCount = response.data.total_count || 0;
          console.log(`Получено писем (useEffect): ${fetchedEmails.length}, всего: ${totalCount}`);

          setEmails(fetchedEmails);
          const newOffset = fetchedEmails.length;
          setCurrentOffset(newOffset);
          setTotalEmails(totalCount);
          setHasMoreEmails(newOffset < totalCount);

        } catch (err) {
          console.error("Ошибка загрузки писем (useEffect):", err);
          let errorMsg;
          if (err.code === 'ECONNABORTED') {
            errorMsg = 'Превышено время ожидания ответа от сервера. Пожалуйста, попробуйте еще раз.';
          } else {
            errorMsg = err.response?.data?.error || `Не удалось загрузить письма из папки ${selectedMailbox}`;
          }
          setError(errorMsg);
          setSnackbar({ open: true, message: errorMsg, severity: 'error' });
          setHasMoreEmails(false);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [selectedMailbox]);

  const loadMoreEmails = useCallback(async () => {
    if (!hasMoreEmails || loadingMore) return;

    setLoadingMore(true);
    setError('');
    const offsetToFetch = currentOffset;
    const limitToFetch = 25;

    try {
      console.log(`Запрос ЕЩЕ писем: mailbox=${selectedMailbox}, limit=${limitToFetch}, offset=${offsetToFetch}`);
      const response = await api.get(`/email/messages/?mailbox=${encodeURIComponent(selectedMailbox)}&limit=${limitToFetch}&offset=${offsetToFetch}`, {
        timeout: 60000 // Увеличиваем таймаут до 60 секунд
      });
      const fetchedEmails = response.data.emails || [];

      console.log(`Получено ЕЩЕ писем: ${fetchedEmails.length}`);

      setEmails(prevEmails => [...prevEmails, ...fetchedEmails]);
      setCurrentOffset(prevOffset => {
        const newOffset = prevOffset + fetchedEmails.length;
        setHasMoreEmails(newOffset < totalEmails);
        return newOffset;
      });

    } catch (err) {
      console.error("Ошибка загрузки ЕЩЕ писем:", err);
      let errorMsg;
      if (err.code === 'ECONNABORTED') {
        errorMsg = 'Превышено время ожидания ответа от сервера. Пожалуйста, попробуйте еще раз.';
      } else {
        errorMsg = err.response?.data?.error || `Не удалось загрузить больше писем из папки ${selectedMailbox}`;
      }
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      setHasMoreEmails(false);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedMailbox, currentOffset, hasMoreEmails, loadingMore, totalEmails]);

  const refreshCurrentMailbox = useCallback(async () => {
      setLoading(true);
      setError('');
      const offsetToFetch = 0;
      const limitToFetch = 25;
      try {
          console.log(`Обновление писем: mailbox=${selectedMailbox}, limit=${limitToFetch}, offset=${offsetToFetch}`);
          const response = await api.get(`/email/messages/?mailbox=${encodeURIComponent(selectedMailbox)}&limit=${limitToFetch}&offset=${offsetToFetch}`);
          const fetchedEmails = response.data.emails || [];
          const totalCount = response.data.total_count || 0;
          console.log(`Обновлено писем: ${fetchedEmails.length}, всего: ${totalCount}`);

          setEmails(fetchedEmails);
          const newOffset = fetchedEmails.length;
          setCurrentOffset(newOffset);
          setTotalEmails(totalCount);
          setHasMoreEmails(newOffset < totalCount);
          setSelectedEmail(null);
          setSelectedEmailIds(new Set());

      } catch (err) {
          console.error("Ошибка обновления писем:", err);
          const errorMsg = err.response?.data?.error || `Не удалось обновить ${selectedMailbox}`;
          setError(errorMsg);
          setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      } finally {
          setLoading(false);
      }
  }, [selectedMailbox]);

  const handleComposeOpen = () => {
    openComposeModal({});
  };

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестная дата';
    return dateString;
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = new Set(emails.map((n) => n.id));
      setSelectedEmailIds(newSelecteds);
      return;
    }
    setSelectedEmailIds(new Set());
  };

  const handleEmailAction = async (action, emailIds, currentMailbox) => {
    if (!emailIds || emailIds.length === 0) {
        console.warn(`handleEmailAction called with no email IDs for action: ${action}`);
        setSnackbar({ open: true, message: 'Не выбрано ни одного письма для действия.', severity: 'warning' });
        return;
    }
    setActionLoading(true);
    setError('');
    try {
      await api.post('/email/messages/action/', {
        action: action,
        email_ids: emailIds,
        mailbox: currentMailbox
      });
      setSnackbar({ open: true, message: `Действие '${action}' успешно выполнено. Обновление...`, severity: 'success' });
      refreshCurrentMailbox();
    } catch (err) {
      console.error(`Ошибка при выполнении действия ${action} в ${currentMailbox}:`, err);
      const errorMsg = `Не удалось выполнить действие "${action}". ${err.response?.data?.error || 'Попробуйте позже.'}`;
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatQuote = (email) => {
    const sender = email.from || 'Неизвестный отправитель';
    const dateSent = email.date_iso ? new Date(email.date_iso).toLocaleString('ru-RU') : (email.date || 'Неизвестная дата');
    const body = email.body_plain || '';
    return `\n\n----- Исходное сообщение -----\nОт: ${sender}\nДата: ${dateSent}\nТема: ${email.subject || 'Без темы'}\n\n${body}`;
  };

  const handleReply = (email) => {
    if (!email) return;
    const quotedBody = formatQuote(email);
    openComposeModal({
      to: email.from || '',
      subject: `Re: ${email.subject || 'Без темы'}`,
      content: `<p><br></p>${quotedBody.replace(/\n/g, '<br>')}`,
      replyToEmail: email
    });
  };

  const handleReplyAll = (email) => {
    if (!email) return;
    const recipients = [email.from, ...(email.to || []), ...(email.cc || [])].filter(Boolean);
    const uniqueRecipients = [...new Set(recipients)];
    const toAddresses = uniqueRecipients.join(', ');

    const quotedBody = formatQuote(email);
    openComposeModal({
      to: toAddresses, 
      cc: '',
      subject: `Re: ${email.subject || 'Без темы'}`,
      content: `<p><br></p>${quotedBody.replace(/\n/g, '<br>')}`,
      replyToEmail: email
    });
  };

  const handleForward = (email) => {
    if (!email) return;
    const quotedBody = formatQuote(email);
    openComposeModal({
      to: '',
      subject: `Fwd: ${email.subject || 'Без темы'}`,
      content: `<p><br></p>${quotedBody.replace(/\n/g, '<br>')}`,
      forwardEmail: email
    });
  };

  const handleCloseEmailView = () => {
    setSelectedEmail(null);
  };

  const numSelected = selectedEmailIds.size;
  const rowCount = emails.length;
  const currentMailboxLabel = mailboxes.find(m => m.name === selectedMailbox)?.label || selectedMailbox;

  return (
    <Grid container spacing={1} sx={{ p: 1, height: 'calc(100vh - 64px - 16px)', flexWrap: 'nowrap' }}>
      <Grid item xs={12} sm={3} md={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              onClick={handleComposeOpen} 
              startIcon={<CreateIcon />}
              fullWidth
            >
            Написать
          </Button>
        </Box>
          <Divider />
          <List dense component="nav" sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <ListSubheader component="div">
              Почтовые ящики
            </ListSubheader>
            {mailboxes.map((mailbox) => (
              <ListItemButton
                key={mailbox.name}
                selected={selectedMailbox === mailbox.name}
                onClick={() => {setSelectedMailbox(mailbox.name); setSelectedEmail(null);}}
              >
                <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                  {mailbox.icon}
                </ListItemIcon>
                <ListItemText primary={mailbox.label} primaryTypographyProps={{ variant: 'body2' }}/>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={4} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {error && !loading && <Alert severity="error" sx={{ m: 1, flexShrink: 0 }}>{error}</Alert>}
          
          <Toolbar 
            sx={{
              pl: { sm: 1 },
              pr: { xs: 1, sm: 1 },
              ...(numSelected > 0 && {
                bgcolor: (theme) => theme.palette.action.selected,
              }),
              minHeight: '56px',
              flexShrink: 0
            }}
          >
            {numSelected > 0 ? (
              <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
                component="div"
              >
                Выбрано: {numSelected}
              </Typography>
            ) : (
              <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
                {currentMailboxLabel}
                    </Typography>
            )}

            {numSelected > 0 && (
              <Box sx={{ display: 'flex' }}>
                <Tooltip title="Пометить прочитанным">
                  <IconButton onClick={() => handleEmailAction('mark_read', Array.from(selectedEmailIds), selectedMailbox)} disabled={actionLoading || numSelected === 0}>
                    <MarkEmailReadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Пометить непрочитанным">
                  <IconButton onClick={() => handleEmailAction('mark_unread', Array.from(selectedEmailIds), selectedMailbox)} disabled={actionLoading || numSelected === 0}>
                    <MarkAsUnreadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                  <IconButton onClick={() => handleEmailAction('delete', Array.from(selectedEmailIds), selectedMailbox)} disabled={actionLoading || numSelected === 0}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
                {actionLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
              </Box>
            )}
          </Toolbar>
          <Divider />

          <Box sx={{ overflowY: 'auto', flexGrow: 1 }}> 
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Загрузка писем...
                </Typography>
              </Box>
            ) : loadingMore ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Загрузка дополнительных писем...
                </Typography>
              </Box>
            ) : emails.length > 0 ? (
              <List disablePadding dense sx={{ pt: 0 }}>
                <ListItem divider sx={{ bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 1 }}>
                  <ListItemIcon sx={{ minWidth: 'auto', mr: 0.5 }}>
                    <Checkbox
                      color="primary"
                      indeterminate={numSelected > 0 && numSelected < rowCount}
                      checked={rowCount > 0 && numSelected === rowCount}
                      onChange={handleSelectAllClick}
                      inputProps={{
                        'aria-label': 'select all emails',
                      }}
                      size="small"
                    />
                  </ListItemIcon>
                </ListItem>
                <ListItem divider sx={{ bgcolor: 'background.paper', position: 'sticky', top: 56, zIndex: 1 }}>
                  {hasMoreEmails && !loadingMore && (
                    <Button
                      onClick={loadMoreEmails}
                      disabled={loadingMore || !hasMoreEmails}
                      fullWidth
                      sx={{ justifyContent: 'center', py: 1 }}
                    >
                      {loadingMore ? <CircularProgress size={24} /> : 'Загрузить еще'}
                    </Button>
                  )}
                </ListItem>
                {emails.map((email) => {
                  const isCurrent = selectedEmail?.id === email.id;
                  const isHovered = hoveredEmailId === email.id;
                  const hasAttachments = email.attachments && email.attachments.length > 0;

                  return (
                    <EmailListItem
                      key={email.id}
                      selected={isCurrent}
                      unread={!email.is_read}
                      onClick={() => handleEmailSelect(email)}
                      onMouseEnter={() => setHoveredEmailId(email.id)}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', pr: 1 }}>
                        <StyledListItemText
                          primary={email.from}
                          secondary={email.subject}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {email.content_preview}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                          {formatDate(email.date)}
                        </Typography>
                        <Box>
                          {hasAttachments && (
                            <Tooltip title="Есть вложения">
                              <AttachmentIcon fontSize="small" color="action" sx={{ color: 'text.secondary', verticalAlign: 'middle' }} />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      
                      {isHovered && (
                        <Box sx={{ 
                          position: 'absolute', 
                          right: 8, 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          display: 'flex', 
                          gap: 0.5,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 1,
                          p: 0.5
                        }}>
                          <Tooltip title="Удалить">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEmailAction('delete', [email.id], selectedMailbox); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={email.is_read ? "Пометить непрочитанным" : "Пометить прочитанным"}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEmailAction(email.is_read ? 'mark_unread' : 'mark_read', [email.id], selectedMailbox); }}>
                              {email.is_read ? <MarkunreadIcon fontSize="small" /> : <MarkEmailReadIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </EmailListItem>
                  );
                })}
        </List>
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>Нет писем</Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={5} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={1} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {selectedEmail ? (
            <EmailView 
              email={selectedEmail} 
              onActionComplete={refreshCurrentMailbox}
              onCloseView={handleCloseEmailView}
              onReply={handleReply}
              onReplyAll={handleReplyAll}
              onForward={handleForward}
            />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
              <Typography variant="h6">Выберите письмо для просмотра</Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default Email; 