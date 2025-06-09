import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const CargoList = () => {
    const [cargos, setCargos] = useState([]);

    useEffect(() => {
        fetchCargos();
    }, []);

    const fetchCargos = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/api/cargos/`);
            setCargos(response.data);
        } catch (error) {
            console.error('Error fetching cargos:', error);
        }
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Список грузов
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Наименование</TableCell>
                            <TableCell>Вес (кг)</TableCell>
                            <TableCell>Объем (м³)</TableCell>
                            <TableCell>Код ТН ВЭД</TableCell>
                            <TableCell>Стоимость</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cargos.map(cargo => (
                            <TableRow key={cargo.id}>
                                <TableCell>{cargo.name}</TableCell>
                                <TableCell>{cargo.weight}</TableCell>
                                <TableCell>{cargo.volume}</TableCell>
                                <TableCell>{cargo.code_tn_ved}</TableCell>
                                <TableCell>{cargo.cost}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default CargoList;
