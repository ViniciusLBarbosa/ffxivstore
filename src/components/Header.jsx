import { AppBar, Toolbar, Button, IconButton, Badge, Box, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme as useMuiTheme, Avatar } from '@mui/material';
import { ShoppingCart, Person, Menu as MenuIcon, AdminPanelSettings, Logout, Settings, Receipt, LightMode, DarkMode } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';

export function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, signOut } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { isDarkMode, toggleTheme } = useTheme();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      handleClose();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={handleMenu}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Button
            component={Link}
            to="/"
            variant="header"
            sx={{ 
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              textTransform: 'none',
              fontWeight: 'bold',
              color: isDarkMode ? '#CED4DA' : '#4A5568'
            }}
          >
            FFXIV Store
          </Button>
          {!isMobile && (
            <>
              <Button 
                component={Link} 
                to="/products" 
                variant="header"
                sx={{ 
                  color: isDarkMode ? '#CED4DA' : '#4A5568',
                  textTransform: 'none'
                }}
              >
                Serviços
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={toggleTheme} 
            sx={{ color: isDarkMode ? '#CED4DA' : '#4A5568' }}
          >
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>

          <IconButton
            component={Link}
            to="/cart"
            sx={{ color: isDarkMode ? '#CED4DA' : '#4A5568' }}
          >
            <Badge badgeContent={cartItems.length} color="primary">
              <ShoppingCart />
            </Badge>
          </IconButton>

          {user ? (
            <>
              <IconButton
                onClick={handleMenu}
                sx={{ color: isDarkMode ? '#CED4DA' : '#4A5568' }}
              >
                <Avatar
                  src={user.photoURL}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: 'primary.main'
                  }}
                >
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }
                }}
              >
                {user.isAdmin && (
                  <MenuItem component={Link} to="/admin" onClick={handleClose}>
                    <ListItemIcon>
                      <AdminPanelSettings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Admin</ListItemText>
                  </MenuItem>
                )}
                <MenuItem component={Link} to="/profile" onClick={handleClose}>
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Perfil</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to="/orders" onClick={handleClose}>
                  <ListItemIcon>
                    <Receipt fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Pedidos</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to="/settings" onClick={handleClose}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Configurações</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sair</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="header"
              sx={{ color: isDarkMode ? '#CED4DA' : '#4A5568' }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
} 