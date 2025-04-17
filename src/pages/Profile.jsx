import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Box,
  TextField,
  Button,
  Alert,
  Grid,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from '../components/ImageUpload';

export function Profile() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      photoURL: imageUrl
    }));
    setSuccess('Imagem enviada com sucesso!');
    setShowImageUpload(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile({
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });
      setSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      setError('Erro ao atualizar perfil. Tente novamente.');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Você precisa estar logado para acessar esta página.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box
            sx={{
              position: 'relative',
              '&:hover .edit-overlay': {
                opacity: 1
              },
              cursor: 'pointer'
            }}
            onClick={() => setShowImageUpload(true)}
          >
            <Avatar
              src={formData.photoURL || user.photoURL}
              sx={{ 
                width: 100, 
                height: 100, 
                mb: 2,
                border: '4px solid #f5f5f5'
              }}
            >
              {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
            </Avatar>
            <Box
              className="edit-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out'
              }}
            >
              <EditIcon sx={{ color: 'white' }} />
            </Box>
          </Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Meu Perfil
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                disabled
              />
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </Box>

        {showImageUpload && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowImageUpload(false);
              }
            }}
          >
            <Paper sx={{ p: 3, maxWidth: 500, width: '90%' }}>
              <Typography variant="h6" gutterBottom>
                Alterar Foto de Perfil
              </Typography>
              <ImageUpload onImageUpload={handleImageUpload} />
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
} 