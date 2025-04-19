import { useState } from 'react';
import { Box, Button, CircularProgress, Typography, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadImage } from '../services/imgbb';
import { ImageCrop } from './ImageCrop';

export function ImageUpload({ onImageUpload, disableCrop = false, aspectRatio = 1 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [showCrop, setShowCrop] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar o tipo do arquivo
    if (!file.type.startsWith('image/')) {
      setError('Please select image files only.');
      return;
    }

    // Validar o tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('The image must be 5MB or less.');
      return;
    }

    setError('');

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      if (!disableCrop) {
        setShowCrop(true);
      }
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);

    // Se o cropping estiver desabilitado, fazer upload direto
    if (disableCrop) {
      setLoading(true);
      try {
        const imageUrl = await uploadImage(file);
        onImageUpload(imageUrl);
        setPreview(imageUrl);
      } catch (error) {
        setError('Error uploading image. Please try again.');
        console.error('Erro no upload:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCropComplete = async (croppedFile) => {
    setLoading(true);
    setError('');

    try {
      const imageUrl = await uploadImage(croppedFile);
      onImageUpload(imageUrl);
      setPreview(imageUrl);
    } catch (error) {
      setError('Error uploading image. Please try again.');
      console.error('Erro no upload:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="image-upload"
        type="file"
        onChange={handleFileChange}
        disabled={loading}
      />
      <label htmlFor="image-upload">
        <Button
          variant="outlined"
          component="span"
          startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? 'Uploading...' : 'Choose Image'}
        </Button>
      </label>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {preview && !showCrop && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Preview:
          </Typography>
          <Box
            component="img"
            src={preview}
            alt="Preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: 1
            }}
          />
        </Box>
      )}

      <ImageCrop
        open={showCrop}
        onClose={() => setShowCrop(false)}
        imageUrl={preview}
        onCropComplete={handleCropComplete}
        aspectRatio={aspectRatio}
      />
    </Box>
  );
} 