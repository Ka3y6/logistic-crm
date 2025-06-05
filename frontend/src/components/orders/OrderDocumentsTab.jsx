import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  CircularProgress, 
  Typography,
  Alert,
  DialogActions,
  Button,
  TextField,
  Menu,
  MenuItem,
  Fab
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { renderAsync } from 'docx-preview';
import { OutTable, ExcelRenderer } from 'react-excel-renderer';
import api from '../../api/api';

const OrderDocumentsTab = ({ orderId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [documentToRename, setDocumentToRename] = useState(null);
  const [newName, setNewName] = useState('');
  const [previewType, setPreviewType] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [excelCols, setExcelCols] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const docxContainerRef = useRef(null);
  const [generateMenuAnchor, setGenerateMenuAnchor] = useState(null);
  const [generating, setGenerating] = useState(false);

  const documentTypes = [
    { id: 'invoice', name: 'Счет' },
    { id: 'contract', name: 'Договор' },
    { id: 'act', name: 'Акт выполненных работ' },
    { id: 'specification', name: 'Спецификация' }
  ];

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/documents/?order=${orderId}`);
        let docs = [];
        if (Array.isArray(res.data)) {
          docs = res.data.filter(doc => doc.order === orderId);
        } else if (res.data && Array.isArray(res.data.results)) {
          docs = res.data.results.filter(doc => doc.order === orderId);
        } else if (res.data && Array.isArray(res.data.data)) {
          docs = res.data.data.filter(doc => doc.order === orderId);
        }
        console.log("Fetched Docs for Order:", orderId, docs);
        setDocuments(docs);
      } catch (e) {
        console.error("Error fetching documents:", e);
        setError('Ошибка при загрузке документов');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [orderId]);

  const handlePreview = async (doc) => {
    setError(null);
    setPreviewType(null);
    setPreviewData(null);
    setExcelCols([]);
    setExcelRows([]);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);

    try {
      const response = await api.get(`/documents/${doc.id}/?download=true`, {
        responseType: 'blob'
      });
      const fileBlob = new Blob([response.data], { type: response.headers['content-type'] });
      setPreviewData(fileBlob);

      const nameSource = doc.name || '';
      const fileSource = doc.file || '';
      let potentialExt = '';
      if (fileSource.includes('.')) {
        potentialExt = fileSource.split('.').pop().toLowerCase();
      } else if (nameSource.includes('.')) {
        potentialExt = nameSource.split('.').pop().toLowerCase();
      }
      const ext = potentialExt;
      console.log("[handlePreview] Extracted extension:", ext);

      if (!['docx', 'xlsx', 'pdf'].includes(ext)) {
        setError("Предпросмотр не поддерживается для этого типа файла.");
        setPreviewData(null);
        return;
      }
      setPreviewType(ext);
      setPreviewName(doc.name || 'Документ');

      if (ext === 'pdf') {
        const fileUrl = URL.createObjectURL(fileBlob);
        console.log("[handlePreview] Created PDF Blob URL:", fileUrl);
        setPreviewUrl(fileUrl);
      } else {
        setPreviewUrl('preview-ready');

        setTimeout(() => {
          if (ext === 'docx') {
            console.log("[handlePreview setTimeout DOCX] Checking ref:", docxContainerRef.current);
            if (docxContainerRef.current && fileBlob) {
              docxContainerRef.current.innerHTML = '';
              renderAsync(fileBlob, docxContainerRef.current, null)
                .then(() => console.log("DOCX rendered via setTimeout"))
                .catch(error => {
                  console.error('Error rendering DOCX via setTimeout:', error);
                  setError('Ошибка при отображении DOCX файла.');
                });
            } else {
              console.warn("[handlePreview setTimeout DOCX] Ref not ready or data missing.");
              if (!docxContainerRef.current) setError('Ошибка: Контейнер для DOCX не найден.');
            }
          } else if (ext === 'xlsx') {
             console.log("[handlePreview setTimeout XLSX] Parsing XLSX");
             if (fileBlob) {
                ExcelRenderer(fileBlob, (err, resp) => {
                  if(err){
                    console.error('Error parsing XLSX:', err);
                    setError('Ошибка при чтении XLSX файла.');
                  } else {
                    console.log("XLSX parsed via setTimeout, cols:", resp.cols.length, "rows:", resp.rows.length);
                    setExcelCols(resp.cols);
                    setExcelRows(resp.rows);
                  }
                });
             } else {
                 console.warn("[handlePreview setTimeout XLSX] Data missing.");
             }
           }
        }, 0);
      }

    } catch (err) {
      console.error("[handlePreview] Error loading blob:", err);
      setError(`Ошибка при загрузке документа для просмотра: ${err?.response?.data?.error || err.message}`);
      handleClosePreview();
    }
  };

  const handleClosePreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewName('');
    setPreviewType(null);
    setPreviewData(null);
    setExcelCols([]);
    setExcelRows([]);
    setError(null);
  };

  const handleDownload = async (doc) => {
    setError(null);
    try {
      const response = await api.get(`/documents/${doc.id}/?download=true`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const nameSource = doc.name || '';
      const fileSource = doc.file || '';
      const sourceForExt = nameSource.includes('.') ? nameSource : (fileSource.includes('.') ? fileSource : ''); 
      let ext = sourceForExt.split('.').pop().toLowerCase();
      if (!['pdf', 'docx', 'xlsx', 'doc', 'xls'].includes(ext)) {
          if (!sourceForExt.includes('.')) ext = '';
      } 

      let baseName = doc.name ? doc.name.replace(/\.[^/.]+$/, "") : 'document';
      if (!baseName || baseName.trim() === '') {
          baseName = 'document';
      } 

      const downloadFilename = ext ? `${baseName}.${ext}` : baseName;
      
      link.setAttribute('download', downloadFilename); 
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Ошибка при скачивании документа:", err);
      setError(`Ошибка при скачивании документа: ${err?.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteClick = (doc) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/documents/${documentToDelete.id}/`);
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении документа');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleRenameClick = (doc) => {
    setDocumentToRename(doc);
    setNewName(doc.name);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!newName.trim()) {
      setError('Название документа не может быть пустым');
      return;
    }
    try {
      const response = await api.patch(`/documents/${documentToRename.id}/`, {
        name: newName.trim()
      });
      setDocuments(documents.map(doc => 
        doc.id === documentToRename.id ? { ...doc, name: response.data.name } : doc
      ));
      setRenameDialogOpen(false);
      setDocumentToRename(null);
      setNewName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при переименовании документа');
    }
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setDocumentToRename(null);
    setNewName('');
  };

  const handleGenerateClick = (event) => {
    setGenerateMenuAnchor(event.currentTarget);
  };

  const handleGenerateClose = () => {
    setGenerateMenuAnchor(null);
  };

  const handleGenerateDocument = async (documentType) => {
    try {
      setGenerating(true);
      const response = await api.post(`/orders/${orderId}/generate_document/`, {
        document_type: documentType
      });
      
      if (response.data) {
        // Обновляем список документов
        const res = await api.get(`/documents/?order=${orderId}`);
        let docs = [];
        if (Array.isArray(res.data)) {
          docs = res.data.filter(doc => doc.order === orderId);
        } else if (res.data && Array.isArray(res.data.results)) {
          docs = res.data.results.filter(doc => doc.order === orderId);
        } else if (res.data && Array.isArray(res.data.data)) {
          docs = res.data.data.filter(doc => doc.order === orderId);
        }
        setDocuments(docs);
        // Закрываем меню
        handleGenerateClose();
      }
    } catch (error) {
      console.error('Ошибка при генерации документа:', error);
      setError('Не удалось сгенерировать документ');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '200px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Документы заказа</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Typography sx={{ p: 2, textAlign: 'center' }}>
          Нет доступных документов
        </Typography>
      ) : (
        <List>
          {documents.map((doc) => (
            <ListItem
              key={doc.id}
              secondaryAction={
                <Box>
                  <IconButton edge="end" onClick={() => handlePreview(doc)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDownload(doc)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleRenameClick(doc)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDeleteClick(doc)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText primary={doc.name} />
            </ListItem>
          ))}
        </List>
      )}

      <Fab
        color="primary"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        onClick={handleGenerateClick}
        disabled={generating}
      >
        {generating ? <CircularProgress size={24} color="inherit" /> : <AddIcon />}
      </Fab>

      <Menu
        anchorEl={generateMenuAnchor}
        open={Boolean(generateMenuAnchor)}
        onClose={handleGenerateClose}
      >
        {documentTypes.map((type) => (
          <MenuItem
            key={type.id}
            onClick={() => handleGenerateDocument(type.id)}
          >
            {type.name}
          </MenuItem>
        ))}
      </Menu>

      <Dialog open={!!previewUrl} onClose={handleClosePreview} maxWidth="lg" fullWidth scroll="paper">
        <DialogTitle>Просмотр документа: {previewName}</DialogTitle>
        <DialogContent dividers>
          {previewType === 'pdf' && previewUrl && previewUrl.startsWith('blob:') && (
            <Box sx={{ height: '80vh' }}>
              <DocViewer
                documents={[{ uri: previewUrl, fileType: 'pdf', fileName: previewName }]}
                pluginRenderers={DocViewerRenderers}
                config={{
                  header: { disableHeader: true, disableFileName: true },
                  pdfVerticalScrollByDefault: true
                }}
                style={{ height: '100%' }}
              />
            </Box>
          )}
          {previewType === 'docx' && (
            <Box ref={docxContainerRef} sx={{ 
                padding: '10px',
                '& .docx-wrapper': { background: '#fff', boxShadow: 'none' },
                '& .docx-wrapper > section.docx': { padding: '10px !important' }
             }} />
          )}
          {previewType === 'xlsx' && (
            excelRows.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                    <OutTable data={excelRows} columns={excelCols} tableClassName="ExcelTable" tableHeaderRowClass="heading" />
                </Box>
            ) : (
                <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
            )
          )}
          {!['pdf', 'docx', 'xlsx'].includes(previewType) && previewType && (
             <Typography color="text.secondary">
                Предпросмотр для типа файла '{previewType}' не реализован.
             </Typography>
          )}
        </DialogContent>
         <DialogActions>
            <Button onClick={handleClosePreview}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить документ "{documentToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={renameDialogOpen} onClose={handleRenameCancel}>
        <DialogTitle>Переименование документа</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Новое название"
            type="text"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameCancel}>Отмена</Button>
          <Button onClick={handleRenameConfirm} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDocumentsTab; 