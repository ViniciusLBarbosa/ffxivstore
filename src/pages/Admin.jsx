import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Box, 
  Alert, 
  Switch, 
  FormControlLabel,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Collapse,
  Menu,
  MenuItem,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  Paper,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from '../components/ImageUpload';
import { formatPrice } from '../utils/format';
import { KeyboardArrowDown, KeyboardArrowUp, MoreVert, Refresh, Visibility, Star, StarBorder, Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { InputAdornment, FormControl, InputLabel, ListItemText, Checkbox } from '@mui/material';

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'warning',
    'awaiting_payment': 'info',
    'payment_confirmed': 'info',
    'processing': 'primary',
    'completed': 'success',
    'cancelled': 'error'
  };
  return statusColors[status] || 'default';
};

const getStatusLabel = (status) => {
  const statusLabels = {
    'pending': 'Pending',
    'awaiting_payment': 'Awaiting Payment',
    'payment_confirmed': 'Payment Confirmed',
    'processing': 'Processing',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
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

const OrderCard = ({ order, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(order.id, newStatus);
    handleMenuClose();
  };

  // Verifica se o pedido e seus itens existem
  if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return null;
  }

  return (
    <Card sx={{ 
      mb: 2,
      bgcolor: 'background.paper',
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardContent>
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
                Order #{order.id?.slice(-6) || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.createdAt?.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) || 'Data não disponível'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
              {formatOrderPrice(order.total || 0, order.currency)}
            </Typography>
            <Chip
              label={getStatusLabel(order.status)}
              color={getStatusColor(order.status)}
            />
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ color: 'text.primary' }}
            >
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }
              }}
            >
              <MenuItem onClick={() => handleStatusChange('pending')}>Marcar como Pendente</MenuItem>
              <MenuItem onClick={() => handleStatusChange('awaiting_payment')}>Marcar como Aguardando Pagamento</MenuItem>
              <MenuItem onClick={() => handleStatusChange('payment_confirmed')}>Marcar como Pagamento Confirmado</MenuItem>
              <MenuItem onClick={() => handleStatusChange('processing')}>Marcar como Em Processamento</MenuItem>
              <MenuItem onClick={() => handleStatusChange('completed')}>Marcar como Concluído</MenuItem>
              <MenuItem onClick={() => handleStatusChange('cancelled')}>Marcar como Cancelado</MenuItem>
            </Menu>
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
        {!expanded && order.items[0] && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mt: 2,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box
              component="img"
              src={order.items[0].image || ''}
              alt={order.items[0].name || 'Produto'}
              sx={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 1
              }}
            />
            <Box>
              <Typography variant="body1" color="text.primary">
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
              {order.items[0].category === 'gil' && (
                <Typography variant="body2" color="text.secondary">
                  Quantidade de Gil: {order.items[0].gilAmount} milhões ({(order.items[0].totalGil || 0).toLocaleString()} Gil)
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Discord: {order.discordUsername || order.discordId || 'Não informado'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {order.userEmail || 'Não informado'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Forma de Pagamento: {getPaymentMethodLabel(order.paymentMethod)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Moeda: {order.currency === 'USD' ? 'Dólar (USD)' : 'Real (BRL)'}
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
            {order.items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  p: 2,
                  bgcolor: 'background.default',
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
                  <Typography variant="subtitle1" color="text.primary">{item.name || 'Produto sem nome'}</Typography>
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
                  {item.category === 'gil' && (
                    <Typography variant="body2" color="text.secondary">
                      Quantidade de Gil: {item.gilAmount} milhões ({(item.totalGil || 0).toLocaleString()} Gil)
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Quantidade: {item.quantity || 1}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="body2" color="primary.main">
                      {formatPrice(item.priceBRL || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${Number(item.priceUSD || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {order.currency === 'USD' 
                    ? `$${((Number(item.priceUSD) || 0) * (item.quantity || 1)).toFixed(2)}`
                    : formatPrice((Number(item.priceBRL) || 0) * (item.quantity || 1))
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
                  {order.address ? (
                    <>
                      <Typography variant="body2" color="text.primary">
                        {order.address.street || ''}{order.address.number ? `, ${order.address.number}` : ''}
                        {order.address.complement ? ` - ${order.address.complement}` : ''}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {order.address.neighborhood || ''}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {order.address.city || ''}{order.address.state ? ` - ${order.address.state}` : ''}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        CEP: {order.address.zipCode || 'Não informado'}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Endereço não disponível
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Informações de Contato e Pagamento
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Email: {order.userEmail || 'Não informado'}
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Discord: {order.discordUsername || order.discordId || 'Não informado'}
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Forma de Pagamento: {getPaymentMethodLabel(order.paymentMethod)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const EditProductDialog = ({ open, onClose, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    priceBRL: '',
    priceUSD: '',
    category: '',
    inStock: true,
    basePrice: '',
    basePriceUSD: '',
    levelMultiplier: '',
    levelMultiplierUSD: '',
    availableJobs: [],
    maxLevel: 100,
    // Campos para produtos do tipo Gil
    pricePerMillion: '',
    pricePerMillionUSD: '',
    availableGil: '',
    soldGil: 0
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        image: product.image || '',
        priceBRL: product.priceBRL || '',
        priceUSD: product.priceUSD || '',
        category: product.category || '',
        inStock: product.inStock ?? true,
        basePrice: product.basePrice || '',
        basePriceUSD: product.basePriceUSD || '',
        levelMultiplier: product.levelMultiplier || '',
        levelMultiplierUSD: product.levelMultiplierUSD || '',
        availableJobs: product.availableJobs || [],
        maxLevel: product.maxLevel || 100,
        // Campos para produtos do tipo Gil
        pricePerMillion: product.pricePerMillion || '',
        pricePerMillionUSD: product.pricePerMillionUSD || '',
        availableGil: product.availableGil || '',
        soldGil: product.soldGil || 0
      });
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productRef = doc(db, 'products', product.id);
      const updatedData = {
        ...formData,
        priceBRL: formData.category === 'leveling' ? formData.basePrice : formData.priceBRL,
        priceUSD: formData.category === 'leveling' ? formData.basePriceUSD : formData.priceUSD
      };

      await updateDoc(productRef, updatedData);
      onClose();
      toast.success('Produto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleEditFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleJobChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData(prev => ({
      ...prev,
      availableJobs: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const jobs = [
    'Paladin', 'Warrior', 'Dark Knight', 'Gunbreaker', // Tanks
    'White Mage', 'Scholar', 'Astrologian', 'Sage', // Healers
    'Monk', 'Dragoon', 'Ninja', 'Samurai', 'Reaper', // Melee DPS
    'Bard', 'Machinist', 'Dancer', // Ranged DPS
    'Black Mage', 'Summoner', 'Red Mage', // Magic DPS
    'Carpenter', 'Blacksmith', 'Armorer', 'Goldsmith', 'Leatherworker', 'Weaver', 'Alchemist', 'Culinarian', // Crafters
    'Miner', 'Botanist', 'Fisher', // Gatherers
    'Blue Mage' //fodase

  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Product</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleEditFormInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleEditFormInputChange}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL of Image"
                name="image"
                value={formData.image}
                onChange={handleEditFormInputChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleEditFormInputChange}
                  required
                >
                  <MenuItem value="mount">Mount</MenuItem>
                  <MenuItem value="leveling">Leveling</MenuItem>
                  <MenuItem value="clear">Clear</MenuItem>
                  <MenuItem value="gil">Gil</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.category === 'leveling' ? (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Base Price (BRL)"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleEditFormInputChange}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Base Price (USD)"
                    name="basePriceUSD"
                    value={formData.basePriceUSD}
                    onChange={handleEditFormInputChange}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Level Multiplier (BRL)"
                    name="levelMultiplier"
                    value={formData.levelMultiplier}
                    onChange={handleEditFormInputChange}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Level Multiplier (USD)"
                    name="levelMultiplierUSD"
                    value={formData.levelMultiplierUSD}
                    onChange={handleEditFormInputChange}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Available Jobs</InputLabel>
                    <Select
                      multiple
                      name="availableJobs"
                      value={formData.availableJobs}
                      onChange={handleJobChange}
                      renderValue={(selected) => selected.join(', ')}
                      required
                    >
                      {jobs.map((job) => (
                        <MenuItem key={job} value={job}>
                          <Checkbox checked={formData.availableJobs.indexOf(job) > -1} />
                          <ListItemText primary={job} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Max Level"
                    name="maxLevel"
                    value={formData.maxLevel}
                    onChange={handleEditFormInputChange}
                    type="number"
                    required
                    inputProps={{
                      min: 1,
                      max: 100,
                      step: 1
                    }}
                    helperText="Maximum level that the client can select"
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Price (BRL)"
                    name="priceBRL"
                    value={formData.priceBRL}
                    onChange={handleEditFormInputChange}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Price (USD)"
                    name="priceUSD"
                    value={formData.priceUSD}
                    onChange={handleEditFormInputChange}
                    type="number"
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
              </>
            )}

            {formData.category === 'gil' && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Gil Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price per Million (R$)"
                      name="pricePerMillion"
                      value={formData.pricePerMillion}
                      onChange={handleEditFormInputChange}
                      margin="normal"
                      required
                      type="number"
                      inputProps={{
                        min: 0,
                        step: 0.01
                      }}
                      helperText="Price in Reais per million of Gil"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price per Million ($)"
                      name="pricePerMillionUSD"
                      value={formData.pricePerMillionUSD}
                      onChange={handleEditFormInputChange}
                      margin="normal"
                      required
                      type="number"
                      inputProps={{
                        min: 0,
                        step: 0.01
                      }}
                      helperText="Price in Dollar per million of Gil"
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Add Gil (in millions)"
                      name="gilToAdd"
                      type="number"
                      inputProps={{
                        min: 1,
                        step: 1
                      }}
                      onChange={(e) => {
                        const value = Math.max(0, Number(e.target.value));
                        setFormData(prev => ({
                          ...prev,
                          availableGil: Number(product.availableGil || 0) + value
                        }));
                      }}
                      helperText="Quantity of Gil to be added to stock"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sold Gil (in millions)"
                      value={product.soldGil || 0}
                      disabled
                      margin="normal"
                      helperText="Quantity of Gil already sold"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Gil after addition: {Number(formData.availableGil).toLocaleString()} millions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Available Gil after addition: {(Number(formData.availableGil) - (product.soldGil || 0)).toLocaleString()} millions
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.inStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                    name="inStock"
                  />
                }
                label="In Stock"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export function Admin() {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const { user } = useAuth();
  const [newProduct, setNewProduct] = useState({
    name: '',
    priceBRL: '',
    priceUSD: '',
    description: '',
    image: '',
    featured: false,
    category: '',
    inStock: true,
    createdAt: null,
    basePrice: '',
    basePriceUSD: '',
    levelMultiplier: '',
    levelMultiplierUSD: '',
    availableJobs: [],
    maxLevel: 100,
    // Campos para produtos do tipo Gil
    pricePerMillion: '',
    pricePerMillionUSD: '',
    availableGil: '',
    soldGil: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setError('');
      const ordersCollection = collection(db, 'orders');
      const ordersQuery = query(ordersCollection, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Buscar os pedidos e os dados dos usuários
      const ordersList = await Promise.all(ordersSnapshot.docs.map(async orderDoc => {
        const data = orderDoc.data();
        
        try {
          // Buscar os dados do usuário que fez o pedido
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          return {
            id: orderDoc.id,
            ...data,
            userEmail: userData.email || data.userEmail || 'Não informado',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          };
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          return {
            id: orderDoc.id,
            ...data,
            userEmail: data.userEmail || 'Não informado',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          };
        }
      }));

      setOrders(ordersList);
      setSuccess('Pedidos atualizados com sucesso!');
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Erro ao carregar pedidos.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);
      setSuccess('Produtos atualizados com sucesso!');
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Erro ao carregar produtos.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'priceBRL' || name === 'priceUSD') {
      const numericValue = value.replace(/[^0-9]/g, '');
      const price = (Number(numericValue) / 100).toFixed(2);
      
      setNewProduct(prev => ({
        ...prev,
        [name]: price
      }));
    } else if (name === 'featured') {
      setNewProduct(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'basePrice' || name === 'basePriceUSD') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const price = Number(numericValue);
      
      setNewProduct(prev => ({
        ...prev,
        [name]: price
      }));
    } else if (name === 'levelMultiplier' || name === 'levelMultiplierUSD') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const multiplier = Number(numericValue);
      
      setNewProduct(prev => ({
        ...prev,
        [name]: multiplier
      }));
    } else if (name === 'maxLevel') {
      const maxLevel = Math.max(1, Math.min(100, Number(value)));
      setNewProduct(prev => ({
        ...prev,
        maxLevel
      }));
    } else if (name === 'availableJobs') {
      const jobs = value.split(',');
      setNewProduct(prev => ({
        ...prev,
        availableJobs: jobs
      }));
    } else {
      setNewProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (imageUrl) => {
    setNewProduct(prev => ({
      ...prev,
      image: imageUrl
    }));
    setSuccess('Imagem enviada com sucesso!');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newProduct.image) {
      setError('Por favor, faça upload de uma imagem para o produto.');
      return;
    }

    try {
      const productToSave = {
        ...newProduct,
        priceBRL: Number(newProduct.priceBRL).toFixed(2),
        priceUSD: Number(newProduct.priceUSD).toFixed(2),
        basePrice: Number(newProduct.basePrice || 0).toFixed(2),
        basePriceUSD: Number(newProduct.basePriceUSD || 0).toFixed(2),
        levelMultiplier: Number(newProduct.levelMultiplier || 0).toFixed(2),
        levelMultiplierUSD: Number(newProduct.levelMultiplierUSD || 0).toFixed(2),
        inStock: true,
        createdAt: new Date().toISOString()
      };

      // Adiciona campos específicos para produtos de Gil
      if (newProduct.category === 'gil') {
        productToSave.availableGil = Number(newProduct.availableGil);
        productToSave.soldGil = 0;
        productToSave.pricePerMillion = Number(newProduct.pricePerMillion);
        productToSave.pricePerMillionUSD = Number(newProduct.pricePerMillionUSD);
      }

      const docRef = await addDoc(collection(db, 'products'), productToSave);
      setProducts(prev => [...prev, { id: docRef.id, ...productToSave }]);
      setNewProduct({
        name: '',
        priceBRL: '',
        priceUSD: '',
        description: '',
        image: '',
        featured: false,
        category: '',
        inStock: true,
        createdAt: null,
        basePrice: '',
        basePriceUSD: '',
        levelMultiplier: '',
        levelMultiplierUSD: '',
        availableJobs: [],
        maxLevel: 100,
        pricePerMillion: '',
        pricePerMillionUSD: '',
        availableGil: '',
        soldGil: 0
      });
      setSuccess('Produto adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Erro ao adicionar produto. Tente novamente.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(product => product.id !== productId));
      setSuccess('Produto removido com sucesso!');
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Erro ao remover produto. Tente novamente.');
    }
  };

  const handleToggleFeatured = async (productId, currentFeatured) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        featured: !currentFeatured
      });
      
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, featured: !currentFeatured }
          : product
      ));
      
      setSuccess('Status de destaque atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating featured status:', error);
      setError('Erro ao atualizar status de destaque. Tente novamente.');
    }
  };

  const handleToggleStock = async (productId, currentInStock) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        inStock: !currentInStock
      });
      
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, inStock: !currentInStock }
          : product
      ));
      
      toast.success(`Produto ${!currentInStock ? 'disponível' : 'indisponível'} em estoque`);
    } catch (error) {
      console.error('Error updating stock status:', error);
      toast.error('Erro ao atualizar status do estoque');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      
      setSuccess('Status do pedido atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Erro ao atualizar status do pedido. Tente novamente.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDetails = (order) => {
    // Implemente a lógica para abrir os detalhes do pedido
   
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      ...product,
      priceBRL: Number(product.priceBRL).toFixed(2),
      priceUSD: Number(product.priceUSD).toFixed(2)
    });
    setEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'priceBRL' || name === 'priceUSD') {
      const numericValue = value.replace(/[^0-9]/g, '');
      const price = (Number(numericValue) / 100).toFixed(2);
      
      setEditingProduct(prev => ({
        ...prev,
        [name]: price
      }));
    } else if (name === 'featured' || name === 'inStock') {
      setEditingProduct(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setEditingProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditImageUpload = (imageUrl) => {
    setEditingProduct(prev => ({
      ...prev,
      image: imageUrl
    }));
    setSuccess('Imagem atualizada com sucesso!');
  };

  const handleSaveEdit = async () => {
    try {
      const productRef = doc(db, 'products', editingProduct.id);
      const productToUpdate = {
        ...editingProduct,
        priceBRL: Number(editingProduct.priceBRL).toFixed(2),
        priceUSD: Number(editingProduct.priceUSD).toFixed(2)
      };

      await updateDoc(productRef, productToUpdate);
      
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id 
          ? productToUpdate
          : product
      ));
      
      setSuccess('Produto atualizado com sucesso!');
      setEditModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Erro ao atualizar produto. Tente novamente.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color="text.primary">
        Admin Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <Tab label="Add Product" />
          <Tab label="Products" />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}

      {/* Aba de Cadastro de Produto */}
      {tabValue === 0 && (
        <Card sx={{ 
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="text.primary">
              New Product
            </Typography>

            <Box component="form" onSubmit={handleAddProduct}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
              
              <TextField
                fullWidth
                label="Price in Reais"
                name="priceBRL"
                value={`R$ ${newProduct.priceBRL}`}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="R$ 0,00"
                inputProps={{
                  inputMode: 'numeric'
                }}
              />
              
              <TextField
                fullWidth
                label="Price in Dollar"
                name="priceUSD"
                value={`$ ${newProduct.priceUSD}`}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="$ 0.00"
                inputProps={{
                  inputMode: 'numeric'
                }}
              />
              
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
                margin="normal"
                required
                multiline
                rows={4}
              />
              
              <TextField
                select
                fullWidth
                label="Category"
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                margin="normal"
                required
              >
                <MenuItem value="savage">Savage Clear</MenuItem>
                <MenuItem value="leveling">Leveling</MenuItem>
                <MenuItem value="quests">Quests</MenuItem>
                <MenuItem value="extreme">Extreme Clear</MenuItem>
                <MenuItem value="ultimate">Ultimate Clear</MenuItem>
                <MenuItem value="gil">Gil</MenuItem>
              </TextField>
              
              {newProduct.category === 'leveling' && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Price Configuration in Reais (R$)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Base Price (R$)"
                        name="basePrice"
                        value={newProduct.basePrice}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        type="number"
                        inputProps={{
                          min: 0,
                          step: 0.01
                        }}
                        helperText="Initial Price in Reais"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Level Multiplier (R$)"
                        name="levelMultiplier"
                        value={newProduct.levelMultiplier}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        type="number"
                        inputProps={{
                          min: 0,
                          step: 0.01
                        }}
                        helperText="Additional value per level in Reais"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                    Price Configuration in Dollar ($)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Base Price ($)"
                        name="basePriceUSD"
                        value={newProduct.basePriceUSD}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        type="number"
                        inputProps={{
                          min: 0,
                          step: 0.01
                        }}
                        helperText="Initial Price in Dollar"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Level Multiplier ($)"
                        name="levelMultiplierUSD"
                        value={newProduct.levelMultiplierUSD}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        type="number"
                        inputProps={{
                          min: 0,
                          step: 0.01
                        }}
                        helperText="Additional value per level in Dollar"
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Max Level"
                        name="maxLevel"
                        value={newProduct.maxLevel}
                        onChange={handleInputChange}
                        type="number"
                        required
                        inputProps={{
                          min: 1,
                          max: 100,
                          step: 1
                        }}
                        helperText="Maximum level that the client can select"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Available Jobs
                    </Typography>
                    <Grid container spacing={1}>
                      {[
                        'Paladin', 'Warrior', 'Dark Knight', 'Gunbreaker', // Tanks
                        'White Mage', 'Scholar', 'Astrologian', 'Sage', // Healers
                        'Monk', 'Dragoon', 'Ninja', 'Samurai', 'Reaper', // Melee DPS
                        'Bard', 'Machinist', 'Dancer', // Ranged DPS
                        'Black Mage', 'Summoner', 'Red Mage', // Magic DPS
                        'Carpenter', 'Blacksmith', 'Armorer', 'Goldsmith', 'Leatherworker', 'Weaver', 'Alchemist', 'Culinarian', // Crafters
                        'Miner', 'Botanist', 'Fisher', // Gatherers
                        'Blue Mage' //fodase
                      ].map((job) => (
                        <Grid item key={job}>
                          <Chip
                            label={job}
                            onClick={() => {
                              const jobs = newProduct.availableJobs || [];
                              const newJobs = jobs.includes(job)
                                ? jobs.filter(j => j !== job)
                                : [...jobs, job];
                              setNewProduct(prev => ({
                                ...prev,
                                availableJobs: newJobs
                              }));
                            }}
                            color={newProduct.availableJobs?.includes(job) ? "primary" : "default"}
                            sx={{ m: 0.5 }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              )}

              {newProduct.category === 'gil' && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Gil Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Price per Million (R$)"
                        name="pricePerMillion"
                        value={newProduct.pricePerMillion}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        type="number"
                        inputProps={{
                          min: 0,
                          step: 0.01
                        }}
                        helperText="Price in Reais per million of Gil"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Price per Million ($)"
                        name="pricePerMillionUSD"
                        value={newProduct.pricePerMillionUSD}
                        onChange={handleInputChange}
                        margin="normal"
                        required
                        type="number"
                        inputProps={{
                          min: 0,
                          step: 0.01
                        }}
                        helperText="Price in Dollar per million of Gil"
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Add Gil (in millions)"
                        name="gilToAdd"
                        type="number"
                        inputProps={{
                          min: 1,
                          step: 1
                        }}
                        onChange={(e) => {
                          const value = Math.max(0, Number(e.target.value));
                          setNewProduct(prev => ({
                            ...prev,
                            availableGil: Number(newProduct.availableGil || 0) + value
                          }));
                        }}
                        helperText="Quantity of Gil to be added to stock"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Sold Gil (in millions)"
                        value={newProduct.soldGil || 0}
                        disabled
                        margin="normal"
                        helperText="Quantity of Gil already sold"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Gil after addition: {Number(newProduct.availableGil).toLocaleString()} millions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available Gil after addition: {(Number(newProduct.availableGil) - (newProduct.soldGil || 0)).toLocaleString()} millions
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={newProduct.featured}
                    onChange={handleInputChange}
                    name="featured"
                  />
                }
                label="Product in Highlight"
                sx={{ mt: 2 }}
              />

              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary">
                  Product Image
                </Typography>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <ImageUpload 
                    onImageUpload={handleImageUpload} 
                    disableCrop={false}
                    aspectRatio={16/9}
                  />
                </Paper>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Add Product
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Aba de Produtos Cadastrados */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" color="text.primary">
              Products
            </Typography>
            <Button
              variant="outlined"
              startIcon={isLoadingProducts ? <CircularProgress size={16} /> : <Refresh />}
              onClick={fetchProducts}
              disabled={isLoadingProducts}
            >
              Update List
            </Button>
          </Box>

          {products.map((product) => (
            <Card key={product.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    component="img"
                    src={product.image}
                    alt={product.name}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                  />
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        size="small" 
                        label={product.category === 'savage' ? 'Savage Clear' :
                               product.category === 'leveling' ? 'Leveling' :
                               product.category === 'quests' ? 'Quests' :
                               product.category === 'extreme' ? 'Extreme Clear' :
                               product.category === 'ultimate' ? 'Ultimate Clear' :
                               product.category === 'gil' ? 'Gil' : ''}
                        color={product.category === 'ultimate' ? 'error' :
                              product.category === 'savage' ? 'warning' :
                              product.category === 'extreme' ? 'info' : 'default'}
                      />
                      <Chip
                        size="small"
                        label={product.inStock ? 'In Stock' : 'Out of Stock'}
                        color={product.inStock ? 'success' : 'default'}
                        onClick={() => handleToggleStock(product.id, product.inStock)}
                        sx={{ cursor: 'pointer' }}
                      />
                      {product.featured && (
                        <Chip
                          size="small"
                          label="Highlight"
                          color="primary"
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(product.priceBRL)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${Number(product.priceUSD).toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handleToggleFeatured(product.id, product.featured)}
                        color="primary"
                        size="small"
                      >
                        {product.featured ? <Star /> : <StarBorder />}
                      </IconButton>
                      <IconButton
                        onClick={() => handleEditProduct(product)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteProduct(product.id)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Aba de Pedidos */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" color="text.primary">
              Manage Orders ({orders.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={isLoadingOrders ? <CircularProgress size={20} /> : <Refresh />}
              onClick={fetchOrders}
              disabled={isLoadingOrders}
            >
              {isLoadingOrders ? 'Updating...' : 'Update Orders'}
            </Button>
          </Box>
          
          {orders.length === 0 ? (
            <Alert severity="info">
              No orders found.
            </Alert>
          ) : (
            <Box>
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleUpdateOrderStatus}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Edit Product Modal */}
      <EditProductDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        product={editingProduct}
      />
    </Container>
  );
} 