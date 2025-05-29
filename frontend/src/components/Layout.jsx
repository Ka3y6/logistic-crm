import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Backdrop, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Alert, IconButton, Tooltip, Chip } from '@mui/material';
import Sidebar from './layout/Sidebar';
import TopNavbar from './layout/TopNavbar';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useEmail } from '../contexts/EmailContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import './Layout.css';
import DocumentSelector from './DocumentSelector';

const DRAWER_WIDTH = 240;

// Выносим CustomToolbar за пределы Layout и мемоизируем
const CustomToolbar = React.memo(() => {
  console.log('Rendering CustomToolbar');
  return (
    <div id="toolbar" className="ql-toolbar ql-snow">
      <span className="ql-formats">
        <select className="ql-header" defaultValue="">
          <option value="1">Заголовок 1</option>
          <option value="2">Заголовок 2</option>
          <option value="3">Заголовок 3</option>
          <option value="">Обычный текст</option>
        </select>
      </span>
      <span className="ql-formats">
        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-underline" />
        <button className="ql-link" />
      </span>
      <span className="ql-formats">
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
      </span>
      <span className="ql-formats">
        <button className="ql-clean" />
      </span>
      <span className="ql-formats">
        {/* Кнопка "Прикрепить" использует обработчик из modules */}
        <button className="ql-attach" title="Прикрепить документ">
          <svg viewBox="0 0 18 18">
            <path className="ql-stroke" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6z" />
          </svg>
        </button>
      </span>
    </div>
  );
});

function Layout({ children }) {
  const { user } = useAuth();
  const { theme: customTheme } = useCustomTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { isComposeOpen, composeData, closeComposeModal, setComposeData: setContextComposeData } = useEmail();

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isDocumentSelectorOpen, setIsDocumentSelectorOpen] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const quillRef = useRef(null);
  const lastSelection = useRef(null);

  // Локальное состояние для содержимого редактора (Delta)
  const [localEditorContent, setLocalEditorContent] = useState(null);
  const debounceTimeoutRef = useRef(null); // Ref для хранения ID таймера

  // Инициализируем контент в формате Quill
  const initialContent = React.useMemo(() => ({ ops: [{ insert: '\n' }] }), []);

  useEffect(() => {
    if (isComposeOpen) {
      // Устанавливаем начальное значение из контекста или initialContent
      setLocalEditorContent(composeData.content || initialContent);
      // Даем время на монтирование DOM для isEditorReady
      setTimeout(() => setIsEditorReady(true), 100);
    } else {
      setIsEditorReady(false);
      setLocalEditorContent(null); // Сбрасываем локальное состояние при закрытии
    }
    // Добавляем composeData.content в зависимости, если мы хотим, чтобы
    // внешние изменения (например, при ответе на письмо) отражались в редакторе
  }, [isComposeOpen, composeData.content]);

  // Debounced обновление контекста
  useEffect(() => {
    // Если есть изменения в локальном контенте и редактор готов
    if (localEditorContent !== null && isEditorReady) {
      // Очищаем предыдущий таймер, если он был
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Устанавливаем новый таймер для обновления контекста
      debounceTimeoutRef.current = setTimeout(() => {
        console.log('Debounced update: Setting context content');
        setContextComposeData({ ...composeData, content: localEditorContent });
      }, 300); // Задержка 300 мс

      // Очистка таймера при размонтировании или перед следующим запуском эффекта
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }
  }, [localEditorContent, isEditorReady, setContextComposeData, composeData]); // Добавляем зависимости

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMainClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleSend = async () => {
    // Используем контент из контекста для отправки
    const contentToSend = composeData.content; 
    if (composeData.to && composeData.subject && contentToSend) {
      setSending(true);
      setSendError('');
      try {
        const formData = new FormData();
        formData.append('to', composeData.to);
        formData.append('subject', composeData.subject);
        // Преобразуем Delta в HTML перед отправкой, если бэкенд ожидает HTML
        // Если бэкенд ожидает Delta (JSON), отправляем contentToSend как есть (JSON.stringify)
        // Пример для HTML:
        let htmlContent = '';
        if (contentToSend && contentToSend.ops) { // Проверяем, что это Delta
          const tempQuill = new ReactQuill.Quill(document.createElement('div'));
          tempQuill.setContents(contentToSend);
          htmlContent = tempQuill.root.innerHTML;
        } else if (typeof contentToSend === 'string') {
          htmlContent = contentToSend; // Если уже строка (маловероятно с текущей логикой)
        }
        
        formData.append('content', htmlContent);
        formData.append('is_html', true);

        selectedDocuments.forEach((doc, index) => {
          formData.append(`documents[${index}]`, doc.id);
        });

        await api.post('/email/messages/send/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setSelectedDocuments([]);
        closeComposeModal();
      } catch (err) {
        console.error('Ошибка отправки письма:', err);
        setSendError(`Не удалось отправить письмо. ${err.response?.data?.error || 'Проверьте настройки или попробуйте позже.'}`);
      } finally {
        setSending(false);
      }
    }
  };

  const handleCloseDialog = () => {
    closeComposeModal();
  };

  const handleAttachDocuments = useCallback(() => {
    if (quillRef.current) {
      const quillInstance = quillRef.current.getEditor();
      lastSelection.current = quillInstance.getSelection(); 
      console.log('Selection saved:', lastSelection.current); 
    }
    setIsDocumentSelectorOpen(true);
  }, []);

  const handleDocumentSelect = useCallback((documents) => {
    setSelectedDocuments(documents);
    setIsDocumentSelectorOpen(false);

    setTimeout(() => {
      if (quillRef.current) {
        const quillInstance = quillRef.current.getEditor();
        quillInstance.focus(); 
        console.log('Restoring selection:', lastSelection.current); 
        if (lastSelection.current) {
          try {
             const editorBounds = quillInstance.getBounds(lastSelection.current.index, lastSelection.current.length);
             if (editorBounds) {
               quillInstance.setSelection(lastSelection.current); 
               console.log('Selection restored.');
             } else {
               console.warn('Saved selection range is out of bounds.');
               const length = quillInstance.getLength();
               quillInstance.setSelection(length > 0 ? length - 1 : 0); 
             }
          } catch (e) {
            console.warn('Could not restore selection:', e);
            const length = quillInstance.getLength();
            quillInstance.setSelection(length > 0 ? length - 1 : 0); 
          }
        } else {
           const length = quillInstance.getLength();
           quillInstance.setSelection(length > 0 ? length - 1 : 0);
           console.log('No previous selection, cursor set to end.');
        }
      }
    }, 100); 
  }, []); 

  const handleRemoveDocument = (docId) => {
    setSelectedDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const modules = React.useMemo(() => ({
    toolbar: {
      container: '#toolbar',
      handlers: {
        attach: handleAttachDocuments
      }
    }
  }), [handleAttachDocuments]);

  const formats = React.useMemo(() => [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ], []);

  // Добавляем отладочную информацию
  console.log('Layout - Component rendered');
  console.log('Layout - Current user:', user);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: customTheme.main?.backgroundColor }}>
      <TopNavbar 
        open={sidebarOpen}
        onSidebarToggle={handleSidebarToggle} 
      />
      <Sidebar 
        isOpen={sidebarOpen}
      />
      <Backdrop
        open={sidebarOpen}
        onClick={handleMainClick}
        sx={{
          position: 'fixed',
          zIndex: (theme) => theme.zIndex.drawer - 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          transition: (theme) => theme.transitions.create('opacity', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      />
      <Box
        component="main"
        onClick={handleMainClick}
        sx={{
          flexGrow: 1,
          marginLeft: sidebarOpen ? '20px' : 0,
          marginTop: '64px',
          transition: (theme) => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
          width: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH + 20}px)` : '100%',
          backgroundColor: customTheme.main?.backgroundColor,
          color: customTheme.main?.textColor,
          cursor: sidebarOpen ? 'pointer' : 'default',
        }}
      >
        <Box
          sx={{
            width: '100%',
            '& .MuiTableContainer-root': {
              width: 'calc(100% - 20px)',
              margin: '0 10px',
              overflowX: 'auto',
            },
            '& .MuiTable-root': {
              minWidth: 750,
              width: '100%',
            },
            '& .MuiGrid-container': {
              width: 'calc(100% - 20px)',
              margin: '0 10px',
            },
            '& .MuiCard-root': {
              width: '100%',
            }
          }}
        >
          {children}
        </Box>
      </Box>

      {isComposeOpen && isEditorReady && (
        <Dialog open={isComposeOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Новое письмо</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="to"
              label="Кому"
              type="email"
              fullWidth
              variant="standard"
              value={composeData.to}
              onChange={(e) => setContextComposeData({ ...composeData, to: e.target.value })}
            />
            <TextField
              margin="dense"
              id="subject"
              label="Тема"
              type="text"
              fullWidth
              variant="standard"
              value={composeData.subject}
              onChange={(e) => setContextComposeData({ ...composeData, subject: e.target.value })}
            />
            {selectedDocuments.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedDocuments.map((doc) => (
                  <Chip
                    key={doc.id}
                    label={doc.name}
                    onDelete={() => handleRemoveDocument(doc.id)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <CustomToolbar />
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={localEditorContent || initialContent}
                onChange={(content, delta, source, editor) => {
                  if (source === 'user') {
                    const currentContent = editor.getContents(); 
                    setLocalEditorContent(currentContent); 
                  }
                }}
                modules={modules}
                formats={formats}
                style={{ height: '300px', marginBottom: '20px' }}
                preserveWhitespace
              />
            </Box>
            {sendError && <Alert severity="error" sx={{ mt: 2 }}>{sendError}</Alert>}
          </DialogContent>
          <DialogActions>
            {sending && <CircularProgress size={20} sx={{ mr: 1 }} />}
            <Button onClick={handleCloseDialog} disabled={sending}>Отмена</Button>
            <Button 
              onClick={handleSend} 
              disabled={sending || !composeData.to || !composeData.subject || !localEditorContent}
            >
              Отправить
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <DocumentSelector
        open={isDocumentSelectorOpen}
        onClose={() => {
          setIsDocumentSelectorOpen(false);
          setTimeout(() => {
            if (quillRef.current) {
              quillRef.current.getEditor().focus(); 
            }
          }, 100);
        }}
        onSelect={handleDocumentSelect}
      />

    </Box>
  );
}

export default Layout; 