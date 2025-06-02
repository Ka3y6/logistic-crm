import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const CargoList = ({ cargos, orderId }) => {
  if (!cargos || cargos.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary">
        Нет прикрепленных грузов
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Номер груза</TableCell>
            <TableCell>Тип груза</TableCell>
            <TableCell>Вес (кг)</TableCell>
            <TableCell>Объем (м³)</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargos.map((cargo) => (
            <TableRow key={cargo.id}>
              <TableCell>{cargo.cargo_number}</TableCell>
              <TableCell>{cargo.cargo_type}</TableCell>
              <TableCell>{cargo.weight}</TableCell>
              <TableCell>{cargo.volume}</TableCell>
              <TableCell>{cargo.status}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CargoList; 