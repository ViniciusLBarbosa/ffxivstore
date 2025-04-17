import { AppBar, Toolbar, Typography, Button, Badge, Box } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { UserMenu } from './UserMenu';

export function Header() {
  const { cartItems } = useCart();
  const { user } = useAuth();

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#6200ea' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          FFXIV Store
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/"
            color="inherit"
            sx={{ fontWeight: 'medium' }}
          >
            Home
          </Button>

          <Button
            component={Link}
            to="/products"
            color="inherit"
            sx={{ fontWeight: 'medium' }}
          >
            Produtos
          </Button>

          <Button
            component={Link}
            to="/cart"
            color="inherit"
            sx={{ fontWeight: 'medium' }}
            startIcon={
              <Badge badgeContent={cartItems.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            }
          >
            Carrinho
          </Button>

          {!user ? (
            <Button
              component={Link}
              to="/login"
              color="inherit"
              sx={{ fontWeight: 'medium' }}
            >
              Login / Cadastro
            </Button>
          ) : (
            <UserMenu />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
} 