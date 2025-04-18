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
    'awaiting_payment': 'info',
    'payment_confirmed': 'info',
    'processing': 'info',
    'completed': 'success',
    'cancelled': 'error'
  };
  return statusColors[status] || 'default';
};

const getStatusLabel = (status) => {
  const statusLabels = {
    'pending': 'Pendente',
    'awaiting_payment': 'Aguardando Pagamento',
    'payment_confirmed': 'Pagamento Confirmado',
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

  // Verificações de segurança para garantir que o objeto order tem todas as propriedades necessárias
  if (!order || typeof order !== 'object') {
    return (
      <Paper sx={{ p: 3, width: '100%' }}>
        <Alert severity="error">Dados do pedido inválidos</Alert>
      </Paper>
    );
  }

  // Garantir que todas as propriedades necessárias existam com valores padrão
  const safeOrder = {
    id: order.id || 'unknown',
    createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(),
    total: order.total || 0,
    currency: order.currency || 'BRL',
    status: order.status || 'pending',
    paymentMethod: order.paymentMethod || 'pix',
    items: Array.isArray(order.items) ? order.items : [],
    address: order.address || {
      street: 'Não informado',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    discord: order.discord || 'Não informado'
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
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
              Pedido #{safeOrder.id.slice(-6)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {safeOrder.createdAt.toLocaleDateString('pt-BR', {
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
            {formatOrderPrice(safeOrder.total, safeOrder.currency)}
          </Typography>
          <Chip
            label={getStatusLabel(safeOrder.status)}
            color={getStatusColor(safeOrder.status)}
          />
          <IconButton 
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{ color: 'text.primary' }}
          >
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
      </Box>

      {/* Preview do primeiro item */}
      {!expanded && safeOrder.items[0] && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          mt: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box
            component="img"
            src={safeOrder.items[0].image || ''}
            alt={safeOrder.items[0].name || 'Produto'}
            sx={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              borderRadius: 1
            }}
          />
          <Box>
            <Typography variant="body1" color="text.primary">
              {safeOrder.items[0].name}
              {safeOrder.items.length > 1 && ` + ${safeOrder.items.length - 1} ${safeOrder.items.length - 1 === 1 ? 'item' : 'itens'}`}
            </Typography>
            {safeOrder.items[0].category === 'leveling' && (
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Level: {safeOrder.items[0].startLevel || '?'} - {safeOrder.items[0].endLevel || '?'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Job: {safeOrder.items[0].selectedJob || 'Não especificado'}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              Forma de Pagamento: {getPaymentMethodLabel(safeOrder.paymentMethod)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Detalhes Expandidos */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 3, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
          {/* Itens do Pedido */}
          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 'bold', mb: 2 }}>
            Itens do Pedido
          </Typography>
          {safeOrder.items.map((item) => (
            <Box
              key={item.category === 'leveling' ? `${item.id}-${item.selectedJob}` : item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box
                component="img"
                src={item.image || ''}
                alt={item.name || 'Produto'}
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" color="text.primary">{item.name || 'Produto'}</Typography>
                {item.category === 'leveling' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Level: {item.startLevel || '?'} - {item.endLevel || '?'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Job: {item.selectedJob || 'Não especificado'}
                    </Typography>
                  </Box>
                )}
                {item.category === 'gil' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quantidade: {item.gilAmount || 0} milhões de Gil
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total: {(item.totalGil || 0).toLocaleString()} Gil
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  Quantidade: {item.quantity}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Typography variant="body2" color="primary.main">
                    {formatPrice(item.price || 0)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {safeOrder.currency === 'USD' 
                  ? `$${((Number(item.price) || 0) * (item.quantity || 1)).toFixed(2)}`
                  : formatPrice((Number(item.price) || 0) * (item.quantity || 1))
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
                <Typography variant="body2" color="text.primary">
                  {safeOrder.address.street || 'Não informado'}, {safeOrder.address.number || 'S/N'}
                  {safeOrder.address.complement && ` - ${safeOrder.address.complement}`}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {safeOrder.address.neighborhood || 'Não informado'}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {safeOrder.address.city || 'Não informado'} - {safeOrder.address.state || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  CEP: {safeOrder.address.zipCode || 'Não informado'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Informações de Contato e Pagamento
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Discord: {safeOrder.discord}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Forma de Pagamento: {getPaymentMethodLabel(safeOrder.paymentMethod)}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Moeda: {safeOrder.currency === 'USD' ? 'Dólar (USD)' : 'Real (BRL)'}
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
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        if (id) {
          // Buscar pedido específico
          const orderDoc = await getDoc(doc(db, 'orders', id));
          if (orderDoc.exists()) {
            const data = orderDoc.data();
            const orderData = {
              id: orderDoc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              items: data.items || [],
              total: data.total || 0,
              currency: data.currency || 'BRL',
              status: data.status || 'pending',
              paymentMethod: data.paymentMethod || 'pix'
            };
            setOrders([orderData]);
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
              createdAt: data.createdAt?.toDate() || new Date(),
              items: data.items || [],
              total: data.total || 0,
              currency: data.currency || 'BRL',
              status: data.status || 'pending',
              paymentMethod: data.paymentMethod || 'pix'
            };
          })
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

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