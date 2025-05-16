import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Tabs, Tab } from '@mui/material';
import EmailSettingsForm from '../components/settings/EmailSettingsForm';
import Settings from '../components/Settings';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
          Настройки
        </Typography>
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="Настройки">
            <Tab label="Стили" {...a11yProps(0)} />
            <Tab label="Почта" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
        <Settings />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <EmailSettingsForm />
        </TabPanel>
    </Paper>
    </Container>
  );
};

export default SettingsPage; 