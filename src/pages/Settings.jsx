import { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    twoFactorAuth: false
  });
  const [success, setSuccess] = useState('');

  const handleToggle = (setting) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [setting]: !prev[setting]
      };
      
      // Aqui você implementaria a lógica para salvar as configurações no backend
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      return newSettings;
    });
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>You have to log in to see your information.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="E-Mail Notifications"
              secondary="Receive notifications via email for important updates"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Order Updates"
              secondary="Recieve updates on your order status"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.orderUpdates}
                onChange={() => handleToggle('orderUpdates')}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Sale Alerts"
              secondary="Recieve alerts for sales and promotions"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={settings.promotionalEmails}
                onChange={() => handleToggle('promotionalEmails')}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Segurança
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Two-Factor Authentication"
                secondary="Add an extra layer of security to your account"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={settings.twoFactorAuth}
                  onChange={() => handleToggle('twoFactorAuth')}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Box>
      </Paper>
    </Container>
  );
} 