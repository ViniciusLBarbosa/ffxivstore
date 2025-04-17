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
      setSuccess('Configurações atualizadas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      return newSettings;
    });
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Você precisa estar logado para acessar as configurações.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notificações
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Notificações por Email"
              secondary="Receba atualizações importantes sobre sua conta"
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
              primary="Atualizações de Pedidos"
              secondary="Receba notificações sobre o status dos seus pedidos"
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
              primary="Emails Promocionais"
              secondary="Receba ofertas especiais e promoções"
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
                primary="Autenticação de Dois Fatores"
                secondary="Adicione uma camada extra de segurança à sua conta"
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