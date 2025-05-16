import React, { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

const TableFilters = ({ filters = [], onApplyFilters, onClearFilters }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterValues, setFilterValues] = useState({});

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (name, value) => {
    setFilterValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(filterValues);
    handleClose();
  };

  const handleClear = () => {
    setFilterValues({});
    onClearFilters();
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        title="Фильтры"
      >
        <FilterIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="h6" gutterBottom>
            Фильтры
          </Typography>
          {Array.isArray(filters) && filters.map((filter) => (
            <Box key={filter.name} sx={{ mb: 2 }}>
              {filter.type === 'text' ? (
                <TextField
                  fullWidth
                  label={filter.label}
                  value={filterValues[filter.name] || ''}
                  onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  size="small"
                />
              ) : filter.type === 'select' ? (
                <FormControl fullWidth size="small">
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={filterValues[filter.name] || ''}
                    onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                    label={filter.label}
                  >
                    <MenuItem value="">Все</MenuItem>
                    {filter.options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : filter.type === 'number' ? (
                <TextField
                  fullWidth
                  type="number"
                  label={filter.label}
                  value={filterValues[filter.name] || ''}
                  onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              ) : filter.type === 'date' ? (
                <TextField
                  fullWidth
                  type="date"
                  label={filter.label}
                  value={filterValues[filter.name] || ''}
                  onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              ) : null}
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              size="small"
            >
              Очистить
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              size="small"
            >
              Применить
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default TableFilters; 