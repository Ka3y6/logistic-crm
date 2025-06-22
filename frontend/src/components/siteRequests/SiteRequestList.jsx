import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Alert,
  TablePagination,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import DataTable from '../common/DataTable';
import TableFilters from '../common/TableFilters';

/**
 * Унифицированный список заявок с сайта.
 */
const SiteRequestList = ({
  requests,
  loading,
  error,
  onApprove,      // клик по галочке — открыть форму создания клиента
  onDelete,       // удаление одной заявки
  onBulkDelete,   // удаление выделенных заявок (массив id)
  onApplyFilters,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const dataTableRef = useRef(null);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const statusColor = {
    new: 'primary',
    in_progress: 'warning',
    completed: 'success',
    rejected: 'error',
  };
  const statusText = {
    new: 'Новая',
    in_progress: 'В обработке',
    completed: 'Завершена',
    rejected: 'Отклонена',
  };

  const columns = [
    {
      field: 'created_at',
      headerName: 'Дата',
      minWidth: 170,
      renderCell: ({ row }) => new Date(row.created_at).toLocaleString(),
    },
    { field: 'name', headerName: 'Имя', minWidth: 150 },
    { field: 'phone', headerName: 'Телефон', minWidth: 140 },
    { field: 'email', headerName: 'Email', minWidth: 180 },
    {
      field: 'status',
      headerName: 'Статус',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Chip label={statusText[row.status]} color={statusColor[row.status] || 'default'} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Действия',
      minWidth: 120,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Просмотр">
            <IconButton size="small" onClick={() => onApprove && onApprove(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'new' && (
            <Tooltip title="В обработку / Создать клиента">
              <IconButton size="small" onClick={() => onApprove && onApprove(row)}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Удалить">
            <IconButton size="small" color="error" onClick={() => onDelete && onDelete(row.id)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h5" sx={{ flexShrink: 0 }}>Заявки с сайта</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <TableFilters
            filters={[
              { name: 'name', label: 'Имя', type: 'text' },
              { name: 'phone', label: 'Телефон', type: 'text' },
              { name: 'email', label: 'Email', type: 'text' },
            ]}
            onApplyFilters={onApplyFilters}
            onClearFilters={() => onApplyFilters({})}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <DataTable
        ref={dataTableRef}
        data={requests}
        columns={columns}
        loading={loading}
        error={error}
        onBulkDelete={onBulkDelete}
        tableContext="site_requests"
      />

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={requests.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Строк на странице:"
      />
    </Box>
  );
};

export default SiteRequestList; 