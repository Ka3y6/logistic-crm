import React from 'react';
import { Box, Typography, IconButton, Tooltip, Alert, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Divider, Paper } from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import MarkAsUnreadIcon from '@mui/icons-material/MarkAsUnread';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close'; // Иконка для закрытия
import ReplyIcon from '@mui/icons-material/Reply'; // Иконка Ответить
import ReplyAllIcon from '@mui/icons-material/ReplyAll'; // Иконка Ответить всем
import ForwardIcon from '@mui/icons-material/Forward'; // Иконка Переслать
import api from '../../../api';

// Принимает email, onActionComplete, onCloseView, onReply, onReplyAll, onForward
const EmailView = ({ email, onActionComplete, onCloseView, onReply, onReplyAll, onForward }) => {
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState('');

  // Если email не передан (например, при первоначальной загрузке или после сброса), ничего не рендерим
  // Родительский компонент должен показывать заглушку
  if (!email) {
    return null;
  }

  const formatDate = (isoDateString) => {
    if (!isoDateString) return 'Неизвестная дата';
    try {
      // Используем более компактный формат
      return new Date(isoDateString).toLocaleTimeString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Неверная дата';
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    setActionError('');
    try {
        // Используем правильный mailbox из email объекта, если он там есть, иначе можно передать его как проп
        const mailbox = email.mailbox || 'INBOX'; // Примерное предположение, нужно проверить
        await api.post('/email/messages/action/', { action: action, email_ids: [email.id], mailbox: mailbox });
        if (onActionComplete) {
             onActionComplete(); // Вызываем коллбэк для обновления списка и сброса view
        }
        // onCloseView() больше не нужен здесь, его вызывает родитель из onActionComplete
    } catch (err) {
         console.error(`Ошибка при выполнении действия ${action}:`, err);
         setActionError(`Не удалось выполнить действие ${action}. ${err.response?.data?.error || 'Попробуйте позже.'}`);
    } finally {
        setActionLoading(false);
    }
  };

  // Определяем, какое тело использовать
  const bodyContent = email.body || '';
  const isHtml = email.is_html || false;

  return (
    // Используем Box вместо Dialog
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Верхняя панель с темой, датой и действиями */}
      <Paper elevation={0} square sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Tooltip title={email.subject || 'Без темы'}>
                 <Typography variant="h6" noWrap sx={{ mr: 2, flexGrow: 1 }}>
                     {email.subject || 'Без темы'}
                 </Typography>
             </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {/* Кнопки действий: Ответить/Переслать */} 
                   <Tooltip title="Ответить">
                       <IconButton onClick={() => onReply && onReply(email)} size="small">
                           <ReplyIcon fontSize="small"/>
                       </IconButton>
                   </Tooltip>
                   <Tooltip title="Ответить всем">
                       {/* TODO: Показывать "Ответить всем", только если есть кому отвечать (кроме отправителя) */}
                       <IconButton onClick={() => onReplyAll && onReplyAll(email)} size="small">
                           <ReplyAllIcon fontSize="small"/>
                       </IconButton>
                   </Tooltip>
                   <Tooltip title="Переслать">
                       <IconButton onClick={() => onForward && onForward(email)} size="small">
                           <ForwardIcon fontSize="small"/>
                       </IconButton>
                   </Tooltip>

                   <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                   {/* Кнопки действий: Пометить/Удалить/Закрыть */}
                  <Tooltip title="Пометить непрочитанным">
                    {/* Показываем кнопку только если письмо прочитано */}
                    <span> {/* Обертка для disabled IconButton */}
                       <IconButton onClick={() => handleAction('mark_unread')} disabled={actionLoading || !email.is_read} size="small">
                          <MarkAsUnreadIcon fontSize="small"/>
                       </IconButton>
                    </span>
                  </Tooltip>
                   <Tooltip title="Удалить">
                       <IconButton onClick={() => handleAction('delete')} disabled={actionLoading} size="small">
                           <DeleteIcon fontSize="small"/>
                       </IconButton>
                   </Tooltip>
                   <Tooltip title="Закрыть панель">
                       <IconButton onClick={onCloseView} size="small" sx={{ ml: 1 }}>
                           <CloseIcon fontSize="small"/>
                       </IconButton>
                   </Tooltip>
            </Box>
         </Box>
          {/* Информация От кого/Кому/Дата */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                 <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{email.from}</Typography>
                 {email.to && <Typography variant="caption" color="text.secondary">Кому: {email.to}</Typography>}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right', flexShrink: 0, ml: 1 }}>
                {formatDate(email.date_iso || email.date)} {/* Используем date_iso если есть */}
              </Typography>
          </Box>
      </Paper>
      
      {/* Основное содержимое письма с прокруткой */} 
      <Box sx={{ overflowY: 'auto', flexGrow: 1, p: 2 }}>
        {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
        {actionLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Выполняется действие...
            </Typography>
          </Box>
        )}

        {isHtml ? (
          <Box 
             sx={{ '& img': { maxWidth: '100%', height: 'auto' }, wordBreak: 'break-word' }}
             dangerouslySetInnerHTML={{ __html: bodyContent }} 
          />
        ) : bodyContent ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
             {bodyContent}
          </Typography>
        ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>[Нет содержимого]</Typography>
        )}

        {/* Вложения */} 
        {email.attachments && email.attachments.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" gutterBottom>
              Вложения ({email.attachments.length})
            </Typography>
            <List dense>
              {email.attachments.map((att, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                    <AttachmentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={att.filename} secondary={`${att.content_type} (${att.size_kb ? att.size_kb + ' KB' : ''})`} />
                   {/* TODO: Кнопка скачивания */}
                   {/* <Button size="small" variant="outlined" sx={{ml: 1}}>Скачать</Button> */}
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* Убираем DialogActions */}
    </Box>
  );
};

export default EmailView; 