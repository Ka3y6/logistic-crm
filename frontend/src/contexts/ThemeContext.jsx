import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import api from '../api';
import { useAuth } from './AuthContext';

export const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const defaultTheme = {
  sidebar: {
    backgroundColor: '#2A3042',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
    selectedColor: 'rgba(255, 255, 255, 0.1)',
    logoColor: '#FFFFFF'
  },
  topbar: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    iconColor: '#666666'
  },
  main: {
    backgroundColor: '#f5f5f5',
    cardBackground: '#ffffff',
    textColor: '#333333',
    primaryColor: '#1976d2',
    borderColor: '#e0e0e0'
  },
  font: {
    family: 'Inter',
    size: '16px'
  }
};

export const CustomThemeProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  const isInitialLoad = useRef(true);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
  });

  const updateTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', JSON.stringify(newTheme));
  }, []);

  const getLogoFilter = useCallback((color) => {
    if (color === '#FFFFFF' || color === '#ffffff') {
      return 'brightness(0) invert(1)';
    }
    return 'brightness(0)';
  }, []);

  const customTheme = createTheme({
    palette: {
      primary: {
        main: theme.main?.primaryColor || '#1976d2',
      },
      background: {
        default: theme.main?.backgroundColor || '#f5f5f5',
        paper: theme.main?.cardBackground || '#ffffff',
      },
    },
    typography: {
      fontFamily: theme.font?.family || 'Inter',
      fontSize: parseInt(theme.font?.size || '16'),
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: theme.sidebar?.backgroundColor || '#2A3042',
            color: theme.sidebar?.textColor || '#FFFFFF',
            '& .MuiListItemIcon-root': {
              color: theme.sidebar?.iconColor || '#FFFFFF',
            },
            '& .MuiListItemText-root': {
              color: theme.sidebar?.textColor || '#FFFFFF',
              transition: 'all 0.2s ease-in-out',
              '& .MuiTypography-root': {
                transition: 'all 0.2s ease-in-out',
              }
            },
            '& .logo': {
              filter: getLogoFilter(theme.sidebar?.logoColor || '#FFFFFF'),
              transition: 'all 0.2s ease-in-out',
            },
            '& .MuiListItem-root': {
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: theme.sidebar?.selectedColor || 'rgba(255, 255, 255, 0.1)',
                '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                  color: theme.sidebar?.textColor || '#FFFFFF',
                },
                '& .MuiListItemText-root': {
                  transform: 'translateY(-2px)',
                  '& .MuiTypography-root': {
                    fontSize: 'calc(1rem + 2px)',
                  }
                },
              },
            },
            '& .Mui-selected': {
              backgroundColor: theme.sidebar?.selectedColor || 'rgba(255, 255, 255, 0.1)',
              borderLeft: `4px solid ${theme.main?.primaryColor || '#1976d2'}`,
              '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                color: theme.sidebar?.textColor || '#FFFFFF',
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: theme.topbar?.backgroundColor || '#FFFFFF',
            color: theme.topbar?.textColor || '#000000',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            '& .MuiIconButton-root': {
              color: theme.topbar?.iconColor || '#666666',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: theme.main?.cardBackground || '#ffffff',
            color: theme.main?.textColor || '#333333',
            borderColor: theme.main?.borderColor || '#e0e0e0',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: theme.main?.cardBackground || '#ffffff',
            color: theme.main?.textColor || '#333333',
            borderColor: theme.main?.borderColor || '#e0e0e0',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: theme.main?.textColor || '#333333',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: theme.main?.borderColor || '#e0e0e0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: '0',
            textTransform: 'none',
            minWidth: 'auto',
            padding: '12px 16px',
            '&.Mui-selected': {
              color: theme.main?.primaryColor || '#1976d2',
              borderBottom: `2px solid ${theme.main?.primaryColor || '#1976d2'}`,
              borderTopLeftRadius: '0',
              borderTopRightRadius: '0',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              backgroundColor: theme.main?.cardBackground || '#ffffff',
              '&:hover': {
                backgroundColor: theme.main?.cardBackground || '#ffffff',
              },
              '&.Mui-focused': {
                backgroundColor: theme.main?.cardBackground || '#ffffff',
              },
            },
            '& .MuiInputBase-input': {
              backgroundColor: theme.main?.cardBackground || '#ffffff',
              '&:focus': {
                backgroundColor: theme.main?.cardBackground || '#ffffff',
              },
              '&:hover': {
                backgroundColor: theme.main?.cardBackground || '#ffffff',
              },
              '&:-webkit-autofill': {
                WebkitBoxShadow: `0 0 0 1000px ${theme.main?.cardBackground || '#ffffff'} inset`,
                WebkitTextFillColor: theme.main?.textColor || '#333333',
              },
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.main?.borderColor || '#e0e0e0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.main?.primaryColor || '#1976d2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.main?.primaryColor || '#1976d2',
              borderWidth: '2px',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: theme.main?.cardBackground || '#ffffff',
            '&:hover': {
              backgroundColor: theme.main?.cardBackground || '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: theme.main?.cardBackground || '#ffffff',
            },
            '& input': {
              backgroundColor: theme.main?.cardBackground || '#ffffff',
              '&:focus': {
                backgroundColor: theme.main?.cardBackground || '#ffffff',
              },
              '&:-webkit-autofill': {
                WebkitBoxShadow: `0 0 0 1000px ${theme.main?.cardBackground || '#ffffff'} inset`,
                WebkitTextFillColor: theme.main?.textColor || '#333333',
              },
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.main?.borderColor || '#e0e0e0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.main?.primaryColor || '#1976d2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.main?.primaryColor || '#1976d2',
              borderWidth: '2px',
            },
          },
        },
      },
    },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && isInitialLoad.current) {
      const fetchUserSettings = async () => {
        try {
          const response = await api.get('/user-settings/get_settings/');
          if (response.data && response.data.theme_settings) {
            const serverTheme = response.data.theme_settings;
            updateTheme(serverTheme);
          }
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      };
      fetchUserSettings();
      isInitialLoad.current = false;
    }
  }, [isAuthenticated, authLoading, updateTheme]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      <MuiThemeProvider theme={customTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 