import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  IconButton, 
  Grid, 
  Alert, 
  Chip,
  Divider,
  Paper
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/format';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { TermsDialog } from '../components/TermsDialog';
import { useTheme } from '../contexts/ThemeContext';

export function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stockStatus, setStockStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [removedItems, setRemovedItems] = useState([]);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const checkStockStatus = async () => {
      const status = {};
      const itemsToRemove = [];
      
      for (const item of cartItems) {
        const productDoc = await getDoc(doc(db, 'products', item.id));
        if (productDoc.exists()) {
          const inStock = productDoc.data().inStock;
          status[item.id] = inStock;
          
          // Se o produto está fora de estoque, adiciona à lista de remoção
          if (!inStock) {
            itemsToRemove.push(item.id);
          }
        }
      }
      
      setStockStatus(status);
      
      // Remove os itens fora de estoque e atualiza a lista de itens removidos
      itemsToRemove.forEach(itemId => {
        removeFromCart(itemId);
      });
      
      if (itemsToRemove.length > 0) {
        setRemovedItems(itemsToRemove);
      }
      
      setLoading(false);
    };

    checkStockStatus();
  }, [cartItems, removeFromCart]);

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setTermsDialogOpen(true);
  };

  const handleTermsDialogClose = (accepted) => {
    setTermsDialogOpen(false);
    if (accepted) {
      navigate('/checkout');
    }
  };

  const calculateTotalBRL = () => {
    return cartItems.reduce((total, item) => total + (Number(item.priceBRL) * item.quantity), 0);
  };

  const calculateTotalUSD = () => {
    return cartItems.reduce((total, item) => total + (Number(item.priceUSD) * item.quantity), 0);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography>Carregando...</Typography>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ textAlign: 'center', py: 8, px: 3 }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Seu carrinho está vazio
          </Typography>
          {removedItems.length > 0 && (
            <Alert severity="info" sx={{ mt: 2, mb: 2, maxWidth: 400, mx: 'auto' }}>
              Alguns itens foram removidos automaticamente por estarem fora de estoque.
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/products')}
            sx={{ mt: 2 }}
            size="large"
          >
            Continuar Comprando
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Área principal dos produtos */}
      <Box sx={{ flex: 1, p: 4, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          Carrinho de Compras
        </Typography>

        {removedItems.length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Alguns itens foram removidos automaticamente por estarem fora de estoque.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {cartItems.map((item) => (
            <Paper
              key={item.id}
              elevation={3}
              sx={{
                width: 300,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Box
                component="img"
                src={item.image}
                alt={item.name}
                sx={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover'
                }}
              />
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {item.name}
                  </Typography>
                  {item.category === 'leveling' && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Level: {item.startLevel} - {item.endLevel}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Job: {item.job}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" color="primary">
                      {formatPrice(item.priceBRL)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${Number(item.priceUSD).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  bgcolor: isDarkMode ? 'background.paper' : 'grey.100',
                  borderRadius: 1,
                  p: 1,
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      sx={{ color: 'text.primary' }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ 
                      minWidth: '40px', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: 'text.primary'
                    }}>
                      {item.quantity}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      sx={{ color: 'text.primary' }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <IconButton 
                    color="error" 
                    onClick={() => removeFromCart(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Resumo fixo na direita */}
      <Paper 
        elevation={3} 
        sx={{ 
          width: 400,
          height: 'calc(100vh - 64px)', // Altura da viewport menos o header
          position: 'sticky',
          top: 64, // Altura do header
          right: 0,
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        <Box sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Resumo do Pedido
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Total em Reais (BRL)
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(calculateTotalBRL())}
                </Typography>
              </Box>
              
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  Total em Dólar (USD)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  ${calculateTotalUSD().toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ 
          p: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          position: 'sticky',
          bottom: 0,
          width: '100%'
        }}>
          <Box>
            <Button
              component={Link}
              to="/checkout"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={cartItems.length === 0}
            >
              Finalizar Compra
            </Button>
            <Button
              component={Link}
              to="/products"
              variant="outlined"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
            >
              Continuar Comprando
            </Button>
          </Box>
        </Box>
      </Paper>

      <TermsDialog
        open={termsDialogOpen}
        onClose={handleTermsDialogClose}
      />
    </Box>
  );
} 