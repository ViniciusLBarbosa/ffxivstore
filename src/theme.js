import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#A78BFA',
      light: '#C4B5FD',
      dark: '#7C3AED',
      contrastText: '#E9ECEF',
    },
    secondary: {
      main: '#7C3AED',
      light: '#8B5CF6',
      dark: '#6D28D9',
      contrastText: '#E9ECEF',
    },
    background: {
      default: '#292D3E', // Palenight background
      paper: '#2E3347', // Slightly lighter than background
    },
    text: {
      primary: '#BFC7D5',
      secondary: '#959CB6',
    },
    error: {
      main: '#FF5370',
      light: '#FF869A',
      dark: '#F07178',
    },
    success: {
      main: '#C3E88D',
      light: '#D4F3A2',
      dark: '#A7D37B',
    },
    warning: {
      main: '#FFCB6B',
      light: '#FFE082',
      dark: '#F0B252',
    },
    info: {
      main: '#82AAFF',
      light: '#A6C8FF',
      dark: '#5C8AF0',
    },
    divider: 'rgba(149, 156, 182, 0.08)',
    action: {
      active: '#A78BFA',
      hover: 'rgba(167, 139, 250, 0.08)',
      selected: 'rgba(167, 139, 250, 0.16)',
      disabled: 'rgba(149, 156, 182, 0.3)',
      disabledBackground: 'rgba(149, 156, 182, 0.12)',
    },
    categories: {
      savage: {
        main: '#FFCB6B',
        contrastText: '#292D3E',
        background: 'rgba(255, 203, 107, 0.12)',
      },
      ultimate: {
        main: '#FF5370',
        contrastText: '#E9ECEF',
        background: 'rgba(255, 83, 112, 0.12)',
      },
      extreme: {
        main: '#F78C6C',
        contrastText: '#292D3E',
        background: 'rgba(247, 140, 108, 0.12)',
      },
      leveling: {
        main: '#C3E88D',
        contrastText: '#292D3E',
        background: 'rgba(195, 232, 141, 0.12)',
      },
      quests: {
        main: '#959CB6',
        contrastText: '#292D3E',
        background: 'rgba(149, 156, 182, 0.12)',
      },
      gil: {
        main: '#FFCB6B',
        contrastText: '#292D3E',
        background: 'rgba(255, 203, 107, 0.12)',
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#BFC7D5',
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#BFC7D5',
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#BFC7D5',
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#BFC7D5',
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#BFC7D5',
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#BFC7D5',
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      color: '#959CB6',
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      color: '#959CB6',
      letterSpacing: '0.00714em',
    },
    body1: {
      color: '#BFC7D5',
      letterSpacing: '0.00938em',
    },
    body2: {
      color: '#959CB6',
      letterSpacing: '0.01071em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#292D3E',
          color: '#BFC7D5',
          scrollbarColor: "#3F4461 #292D3E",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 8,
            height: 8,
            backgroundColor: '#292D3E',
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#3F4461",
            border: "2px solid #292D3E",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#4A5173",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#4A5173",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#4A5173",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E3347',
          backgroundImage: 'none',
          '&.MuiCard-root': {
            borderRadius: 16,
            border: '1px solid rgba(149, 156, 182, 0.05)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            backgroundColor: '#2E3347',
            borderColor: 'rgba(149, 156, 182, 0.08)',
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E3347',
          backgroundImage: 'none',
          '& .MuiCardContent-root': {
            backgroundColor: '#2E3347',
            color: '#BFC7D5',
          },
          '& pre': {
            backgroundColor: '#2E3347',
            color: '#BFC7D5',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E3347',
          color: '#BFC7D5',
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E3347',
          '&:before': {
            backgroundColor: 'rgba(149, 156, 182, 0.08)',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(149, 156, 182, 0.02)',
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E3347',
          color: '#BFC7D5',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: '#2E3347',
          color: '#BFC7D5',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(149, 156, 182, 0.04)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: 'rgba(157, 78, 221, 0.5)',
          '&:hover': {
            borderColor: '#9D4EDD',
            backgroundColor: 'rgba(157, 78, 221, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(157, 78, 221, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#9D4EDD',
            },
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#161225',
          backgroundImage: 'none',
          borderBottom: '1px solid rgba(206, 212, 218, 0.05)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161225',
          borderRight: '1px solid rgba(206, 212, 218, 0.05)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161225',
          backgroundImage: 'none',
          borderRadius: 16,
          border: '1px solid rgba(206, 212, 218, 0.05)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(206, 212, 218, 0.08)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(149, 156, 182, 0.08)',
          color: '#BFC7D5',
        },
        head: {
          color: '#E9ECEF',
          fontWeight: 600,
          backgroundColor: '#2E3347',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.category-savage': {
            backgroundColor: 'rgba(255, 203, 107, 0.12)',
            color: '#FFCB6B',
            '& .MuiChip-icon': {
              color: '#FFCB6B',
            },
          },
          '&.category-ultimate': {
            backgroundColor: 'rgba(255, 83, 112, 0.12)',
            color: '#FF5370',
            '& .MuiChip-icon': {
              color: '#FF5370',
            },
          },
          '&.category-extreme': {
            backgroundColor: 'rgba(247, 140, 108, 0.12)',
            color: '#F78C6C',
            '& .MuiChip-icon': {
              color: '#F78C6C',
            },
          },
          '&.category-leveling': {
            backgroundColor: 'rgba(195, 232, 141, 0.12)',
            color: '#C3E88D',
            '& .MuiChip-icon': {
              color: '#C3E88D',
            },
          },
          '&.category-quests': {
            backgroundColor: 'rgba(149, 156, 182, 0.12)',
            color: '#959CB6',
            '& .MuiChip-icon': {
              color: '#959CB6',
            },
          },
          '&.category-gil': {
            backgroundColor: 'rgba(255, 203, 107, 0.12)',
            color: '#FFCB6B',
            '& .MuiChip-icon': {
              color: '#FFCB6B',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#2E3347',
        },
        standardSuccess: {
          backgroundColor: 'rgba(195, 232, 141, 0.12)',
          color: '#C3E88D',
        },
        standardError: {
          backgroundColor: 'rgba(255, 83, 112, 0.12)',
          color: '#FF5370',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 203, 107, 0.12)',
          color: '#FFCB6B',
        },
        standardInfo: {
          backgroundColor: 'rgba(130, 170, 255, 0.12)',
          color: '#82AAFF',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#161225',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#161225',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#161225',
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          backgroundColor: '#161225',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(206, 212, 218, 0.02)',
          },
          '&:hover': {
            backgroundColor: 'rgba(206, 212, 218, 0.04)',
          },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 11, 26, 0.8)',
        },
      },
    },
  },
}); 