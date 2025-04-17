// Você precisa se registrar em https://api.imgbb.com/ para obter sua chave API
const IMGBB_API_KEY = 'bf8c7cb1b0ff35604237ed181fb04c8b';

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMGBB_API_KEY);

  try {
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Erro ao fazer upload da imagem');
    }
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
} 