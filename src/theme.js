import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8B21FF', // 600
      light: '#9447FF', // 500
      dark: '#25034F', // 950
      contrastText: '#fff',
    },
    secondary: {
      main: '#AB7CFF', // 400
      light: '#C6ABFF', // 300
      dark: '#570CA6', // 900
      contrastText: '#fff',
    },
    background: {
      default: '#F5F5FF', // Variação do 50
      paper: '#fff',
    },
    text: {
      primary: '#25034F', // 950
      secondary: '#570CA6', // 900
    },
    error: {
      main: '#FF3D3D',
    },
    success: {
      main: '#4CAF50',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: '#25034F',
    },
    h2: {
      color: '#25034F',
    },
    h3: {
      color: '#25034F',
    },
    h4: {
      color: '#25034F',
    },
    h5: {
      color: '#25034F',
    },
    h6: {
      color: '#25034F',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
}); 