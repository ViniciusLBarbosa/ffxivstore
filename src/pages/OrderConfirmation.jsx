import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatPrice } from '../utils/format';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../contexts/AuthContext';

export function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          // Verifica se o pedido pertence ao usuário atual
          if (orderData.userId === user.uid) {
            setOrder({ id: orderDoc.id, ...orderData });
          } else {
            setError('Você não tem permissão para ver este pedido');
          }
        } else {
          setError('Pedido não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        setError('Erro ao carregar os detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user, navigate]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
        
        <Typography variant="h4" gutterBottom>
          Order confirmed!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Order number: #{orderId.slice(-6)}
        </Typography>

        <Box sx={{ my: 4 }}>
          <Typography variant="body1" paragraph>
            Thanks for your order! We will process it as soon as possible.
          </Typography>
          
          <Box sx={{ 
            bgcolor: 'background.paper', 
            p: 3, 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3
          }}>
            <Typography variant="h6" gutterBottom color="primary">
              Contact Information
            </Typography>
            <Typography variant="body1" paragraph>
              We will contact you via the information below:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body1">
                • Discord: <strong>{order.discordId}</strong>
              </Typography>
              <Typography variant="body1">
                • Email: <strong>{order.userEmail}</strong>
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            Total: {order.currency === 'USD' 
              ? `$${Number(order.total).toFixed(2)}`
              : formatPrice(order.total)
            }
          </Typography>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            component={Link}
            to="/orders"
            variant="contained"
            color="primary"
          >
            Go to My Orders
          </Button>
          
          <Button
            component={Link}
            to="/products"
            variant="outlined"
          >
            Go Back To Shopping
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 