import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Grid,
  CircularProgress,
  Button,
  Collapse,
  IconButton,
  Alert
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/format';

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'cancelled': 'error'
  };
  return statusColors[status] || 'default';
};

const getStatusLabel = (status) => {
  const statusLabels = {
    'pending': 'Pendente',
    'processing': 'Em Processamento',
    'completed': 'Concluído',
    'cancelled': 'Cancelado'
  };
  return statusLabels[status] || status;
};

const getPaymentMethodLabel = (method) => {
  const methodLabels = {
    'pix': 'PIX',
    'credit': 'Cartão de Crédito',
    'boleto': 'Boleto Bancário'
  };
  return methodLabels[method] || method;
};

const formatOrderPrice = (price, currency) => {
  if (currency === 'USD') {
    return `$${Number(price).toFixed(2)}`;
  }
  return formatPrice(price);
};

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      {/* Informações Básicas */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: expanded ? 2 : 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>
              Pedido #{order.id.slice(-6)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.createdAt?.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
            {formatOrderPrice(order.total, order.currency)}
          </Typography>
          <Chip
            label={getStatusLabel(order.status)}
            color={getStatusColor(order.status)}
          />
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            size="small"
          >
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
      </Box>

      {/* Preview do primeiro item */}
      {!expanded && order.items[0] && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          mt: 2
        }}>
          <Box
            component="img"
            src={order.items[0].image}
            alt={order.items[0].name}
            sx={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              borderRadius: 1
            }}
          />
          <Box>
            <Typography variant="body1">
              {order.items[0].name}
              {order.items.length > 1 && ` + ${order.items.length - 1} ${order.items.length - 1 === 1 ? 'item' : 'itens'}`}
            </Typography>
            {order.items[0].category === 'leveling' && (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Level: {order.items[0].startLevel || '?'} - {order.items[0].endLevel || '?'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Job: {order.items[0].job || 'Não especificado'}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              Forma de Pagamento: {getPaymentMethodLabel(order.paymentMethod)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Detalhes Expandidos */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
          {/* Itens do Pedido */}
          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 'bold', mb: 2 }}>
            Itens do Pedido
          </Typography>
          {order.items.map((item) => (
            <Box
              key={item.category === 'leveling' ? `${item.id}-${item.job}` : item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1
              }}
            >
              <Box
                component="img"
                src={item.image}
                alt={item.name}
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">{item.name}</Typography>
                {item.category === 'leveling' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Level: {item.startLevel || '?'} - {item.endLevel || '?'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Job: {item.job || 'Não especificado'}
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  Quantidade: {item.quantity}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Typography variant="body2" color="primary">
                    {formatPrice(item.priceBRL)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${Number(item.priceUSD).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {order.currency === 'USD' 
                  ? `$${(Number(item.priceUSD) * item.quantity).toFixed(2)}`
                  : formatPrice(Number(item.priceBRL) * item.quantity)
                }
              </Typography>
            </Box>
          ))}

          {/* Informações de Entrega e Pagamento */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Endereço de Entrega
                </Typography>
                <Typography variant="body2">
                  {order.address.street}, {order.address.number}
                  {order.address.complement && ` - ${order.address.complement}`}
                </Typography>
                <Typography variant="body2">
                  {order.address.neighborhood}
                </Typography>
                <Typography variant="body2">
                  {order.address.city} - {order.address.state}
                </Typography>
                <Typography variant="body2">
                  CEP: {order.address.zipCode}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Informações de Contato e Pagamento
                </Typography>
                <Typography variant="body2">
                  Discord: {order.discord}
                </Typography>
                <Typography variant="body2">
                  Forma de Pagamento: {getPaymentMethodLabel(order.paymentMethod)}
                </Typography>
                <Typography variant="body2">
                  Moeda: {order.currency === 'USD' ? 'Dólar (USD)' : 'Real (BRL)'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { id } = useParams();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        if (id) {
          // Buscar pedido específico
          const orderDoc = await getDoc(doc(db, 'orders', id));
          if (orderDoc.exists()) {
            const data = orderDoc.data();
            setOrders([{
              id: orderDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate()
            }]);
          } else {
            setError('Pedido não encontrado');
          }
        } else {
          // Buscar lista de pedidos
          const ordersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid)
          );

          const ordersSnapshot = await getDocs(ordersQuery);
          const ordersList = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate()
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);

          setOrders(ordersList);
        }
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        setError('Erro ao carregar pedidos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, id]);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Você precisa estar logado para ver seu histórico de compras.</Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Detalhes do Pedido' : 'Histórico de Compras'}
      </Typography>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>
            {id ? 'Pedido não encontrado' : 'Você ainda não realizou nenhuma compra.'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </Box>
      )}
    </Container>
  );
} 