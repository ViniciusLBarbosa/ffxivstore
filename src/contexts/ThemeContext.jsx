import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { theme as darkTheme } from '../theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const lightTheme = createTheme({
  ...darkTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF'
    },
    secondary: darkTheme.palette.secondary,
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#4A5568',
      secondary: '#718096'
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    error: {
      main: '#DC3545',
      light: '#E35D6A',
      dark: '#BD2130'
    },
    success: {
      main: '#198754',
      light: '#28A745',
      dark: '#146C43'
    },
    warning: {
      main: '#FFC107',
      light: '#FFCD39',
      dark: '#D39E00'
    },
    info: {
      main: '#0DCAF0',
      light: '#39D4FF',
      dark: '#0AA1C0'
    },
    action: {
      active: '#8B5CF6',
      hover: 'rgba(139, 92, 246, 0.08)',
      selected: 'rgba(139, 92, 246, 0.16)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)'
    },
    categories: {
      savage: {
        main: '#F59E0B',
        contrastText: '#000000',
        background: 'rgba(245, 158, 11, 0.12)'
      },
      ultimate: {
        main: '#DC3545',
        contrastText: '#FFFFFF',
        background: 'rgba(220, 53, 69, 0.12)'
      },
      extreme: {
        main: '#F97316',
        contrastText: '#000000',
        background: 'rgba(249, 115, 22, 0.12)'
      },
      leveling: {
        main: '#22C55E',
        contrastText: '#000000',
        background: 'rgba(34, 197, 94, 0.12)'
      },
      quests: {
        main: '#64748B',
        contrastText: '#FFFFFF',
        background: 'rgba(100, 116, 139, 0.12)'
      },
      gil: {
        main: '#F59E0B',
        contrastText: '#000000',
        background: 'rgba(245, 158, 11, 0.12)'
      }
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: '#4A5568',
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.01562em'
    },
    h2: {
      color: '#4A5568',
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.00833em'
    },
    h3: {
      color: '#4A5568',
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '0em'
    },
    h4: {
      color: '#4A5568',
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '0.00735em'
    },
    h5: {
      color: '#4A5568',
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0em'
    },
    h6: {
      color: '#4A5568',
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '0.0075em'
    },
    subtitle1: {
      color: '#718096',
      fontWeight: 500,
      letterSpacing: '0.00938em'
    },
    subtitle2: {
      color: '#718096',
      fontWeight: 500,
      letterSpacing: '0.00714em'
    },
    body1: {
      color: '#4A5568',
      letterSpacing: '0.00938em'
    },
    body2: {
      color: '#718096',
      letterSpacing: '0.01071em'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          textTransform: 'none'
        }
      }
    },
    MuiButton: {
      variants: [
        {
          props: { variant: 'header' },
          style: {
            color: '#4A5568',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(74, 85, 104, 0.04)'
            }
          }
        }
      ],
      styleOverrides: {
        root: {
          fontWeight: 500,
          textTransform: 'none'
        },
        contained: {
          backgroundColor: '#8B5CF6',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#7C3AED'
          }
        },
        outlined: {
          borderColor: '#8B5CF6',
          color: '#8B5CF6',
          '&:hover': {
            borderColor: '#7C3AED',
            color: '#7C3AED',
            backgroundColor: 'rgba(139, 92, 246, 0.04)'
          }
        },
        text: {
          color: '#8B5CF6',
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.04)'
          }
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    }
  }
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  useEffect(() => {
    localStorage.setItem('themeMode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
} 