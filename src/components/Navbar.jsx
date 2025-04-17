import { AppBar, Toolbar, Typography, Button, Box, Badge, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export function Navbar() {
  const { user } = useAuth();
  const { cartItems } = useCart();

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  


  const showAdminButton = user && user.isAdmin === true;


  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          FFXIV Store
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/products">
            Produtos
          </Button>
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/cart"
            sx={{ ml: 1 }}
          >
            <Badge badgeContent={cartItemCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/profile">
                Perfil
              </Button>
              {showAdminButton && (
                <Button color="inherit" component={RouterLink} to="/admin">
                  Admin
                </Button>
              )}
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
} 