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
import { KeyboardArrowDown, KeyboardArrowUp, MoreVert, Refresh, Visibility, Star, StarBorder } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { InputAdornment, FormControl, InputLabel, ListItemText, Checkbox } from '@mui/material';

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
    <Card sx={{ mb: 2 }}>
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
                Pedido #{order.id?.slice(-6) || 'N/A'}
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
            >
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleStatusChange('pending')}>Marcar como Pendente</MenuItem>
              <MenuItem onClick={() => handleStatusChange('processing')}>Marcar como Em Processamento</MenuItem>
              <MenuItem onClick={() => handleStatusChange('completed')}>Marcar como Concluído</MenuItem>
              <MenuItem onClick={() => handleStatusChange('cancelled')}>Marcar como Cancelado</MenuItem>
            </Menu>
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
                Discord: {order.discord || 'Não informado'}
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
          <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
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
                  bgcolor: 'grey.50',
                  borderRadius: 1
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
                  <Typography variant="subtitle1">{item.name || 'Produto sem nome'}</Typography>
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
                    Quantidade: {item.quantity || 1}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="body2" color="primary">
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
                      <Typography variant="body2">
                        {order.address.street || ''}{order.address.number ? `, ${order.address.number}` : ''}
                        {order.address.complement ? ` - ${order.address.complement}` : ''}
                      </Typography>
                      <Typography variant="body2">
                        {order.address.neighborhood || ''}
                      </Typography>
                      <Typography variant="body2">
                        {order.address.city || ''}{order.address.state ? ` - ${order.address.state}` : ''}
                      </Typography>
                      <Typography variant="body2">
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
                  <Typography variant="body2">
                    Email: {order.userEmail || 'Não informado'}
                  </Typography>
                  <Typography variant="body2">
                    Discord: {order.discord || 'Não informado'}
                  </Typography>
                  <Typography variant="body2">
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
    // Campos específicos para produtos de leveling
    basePrice: '',
    basePriceUSD: '',
    levelMultiplier: '',
    levelMultiplierUSD: '',
    availableJobs: [],
    maxLevel: 100
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
        // Campos específicos para produtos de leveling
        basePrice: product.basePrice || '',
        basePriceUSD: product.basePriceUSD || '',
        levelMultiplier: product.levelMultiplier || '',
        levelMultiplierUSD: product.levelMultiplierUSD || '',
        availableJobs: product.availableJobs || [],
        maxLevel: product.maxLevel || 100
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
      <DialogTitle>Editar Produto</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                name="name"
                value={formData.name}
                onChange={handleEditFormInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
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
                label="URL da Imagem"
                name="image"
                value={formData.image}
                onChange={handleEditFormInputChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleEditFormInputChange}
                  required
                >
                  <MenuItem value="mount">Mount</MenuItem>
                  <MenuItem value="leveling">Leveling</MenuItem>
                  <MenuItem value="clear">Clear</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.category === 'leveling' ? (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Preço Base (BRL)"
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
                    label="Preço Base (USD)"
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
                    label="Multiplicador por Level (BRL)"
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
                    label="Multiplicador por Level (USD)"
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
                    <InputLabel>Jobs Disponíveis</InputLabel>
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
                    label="Nível Máximo"
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
                    helperText="Nível máximo que o cliente poderá selecionar"
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Preço (BRL)"
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
                    label="Preço (USD)"
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

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.inStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                    name="inStock"
                  />
                }
                label="Em Estoque"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            Salvar
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
    maxLevel: 100
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
            createdAt: data.createdAt?.toDate()
          };
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          return {
            id: orderDoc.id,
            ...data,
            userEmail: data.userEmail || 'Não informado',
            createdAt: data.createdAt?.toDate()
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

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsList);
    };

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
        maxLevel: 100
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
      
      setSuccess(`Produto ${!currentInStock ? 'disponível' : 'indisponível'} em estoque`);
    } catch (error) {
      console.error('Error updating stock status:', error);
      setError('Erro ao atualizar status do estoque. Tente novamente.');
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
    console.log('Detalhes do pedido:', order);
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
      <Typography variant="h4" component="h1" gutterBottom>
        Painel Administrativo
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Produtos" />
          <Tab label="Pedidos" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {tabValue === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Adicionar Novo Produto
                </Typography>
                <Box component="form" onSubmit={handleAddProduct}>
                  <TextField
                    fullWidth
                    label="Nome do Produto"
                    name="name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Preço em Reais"
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
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Preço em Dólar"
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
                    </Grid>
                  </Grid>
                  <TextField
                    fullWidth
                    label="Descrição"
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
                    label="Categoria"
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
                  </TextField>
                  
                  {newProduct.category === 'leveling' && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Configuração de Preços em Reais (R$)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Preço Base (R$)"
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
                            helperText="Preço inicial em Reais"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Multiplicador por Level (R$)"
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
                            helperText="Valor adicional por level em Reais"
                          />
                        </Grid>
                      </Grid>

                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                        Configuração de Preços em Dólar ($)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Preço Base ($)"
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
                            helperText="Preço inicial em Dólar"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Multiplicador por Level ($)"
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
                            helperText="Valor adicional por level em Dólar"
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Nível Máximo"
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
                            helperText="Nível máximo que o cliente poderá selecionar"
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Jobs Disponíveis
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

                  <FormControlLabel
                    control={
                      <Switch
                        checked={newProduct.featured}
                        onChange={handleInputChange}
                        name="featured"
                      />
                    }
                    label="Produto em Destaque"
                    sx={{ mt: 2 }}
                  />

                  <Box sx={{ my: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Imagem do Produto
                    </Typography>
                    <ImageUpload 
                      onImageUpload={handleImageUpload} 
                      disableCrop={false}
                      aspectRatio={16/9}
                    />
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Adicionar Produto
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Produtos Cadastrados
                </Typography>
                {products.map((product) => (
                  <Box
                    key={product.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      bgcolor: product.inStock ? 'background.paper' : '#f5f5f5',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {product.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            size="small" 
                            label={product.category === 'savage' ? 'Savage Clear' :
                                   product.category === 'leveling' ? 'Leveling' :
                                   product.category === 'quests' ? 'Quests' :
                                   product.category === 'extreme' ? 'Extreme Clear' :
                                   product.category === 'ultimate' ? 'Ultimate Clear' : ''}
                            color={product.category === 'ultimate' ? 'error' :
                                  product.category === 'savage' ? 'warning' :
                                  product.category === 'extreme' ? 'info' : 'default'}
                          />
                          <Chip
                            size="small"
                            label={product.inStock ? 'Em Estoque' : 'Fora de Estoque'}
                            color={product.inStock ? 'success' : 'default'}
                          />
                          {product.featured && (
                            <Chip
                              size="small"
                              label="Destaque"
                              color="primary"
                            />
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                            {formatPrice(product.priceBRL)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${Number(product.priceUSD).toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleEditProduct(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant={product.featured ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => handleToggleFeatured(product.id, product.featured)}
                            startIcon={product.featured ? <Star /> : <StarBorder />}
                          >
                            {product.featured ? 'Destacado' : 'Destacar'}
                          </Button>
                          <Button
                            size="small"
                            variant={product.inStock ? "outlined" : "contained"}
                            color={product.inStock ? "error" : "primary"}
                            onClick={() => handleToggleStock(product.id, product.inStock)}
                          >
                            {product.inStock ? 'Remover do Estoque' : 'Adicionar ao Estoque'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Remover
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Gerenciar Pedidos ({orders.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={isLoadingOrders ? <CircularProgress size={20} /> : <Refresh />}
              onClick={fetchOrders}
              disabled={isLoadingOrders}
            >
              {isLoadingOrders ? 'Atualizando...' : 'Atualizar Pedidos'}
            </Button>
          </Box>
          
          {orders.length === 0 ? (
            <Alert severity="info">
              Nenhum pedido encontrado.
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