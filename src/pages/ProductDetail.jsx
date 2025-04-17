import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box, 
  Container, 
  Alert, 
  Chip,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/format';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { TermsDialog } from '../components/TermsDialog';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState([1, 90]);
  const [selectedJob, setSelectedJob] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentPriceUSD, setCurrentPriceUSD] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() };
          setProduct(productData);
          if (productData.category === 'leveling') {
            setSelectedLevel([1, productData.maxLevel || 90]);
            calculatePrices(productData, [1, productData.maxLevel || 90]);
          } else {
            setCurrentPrice(Number(productData.priceBRL));
            setCurrentPriceUSD(Number(productData.priceUSD));
          }
        } else {
          navigate('/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (product?.category === 'leveling') {
      calculatePrices(product, selectedLevel);
    }
  }, [selectedLevel, product]);

  const calculatePrices = (product, [startLevel, endLevel]) => {
    if (!product || product.category !== 'leveling') return;
    
    const levelDifference = endLevel - startLevel;
    
    // Cálculo do preço em Reais
    const basePrice = Number(product.basePrice || 0);
    const multiplier = Number(product.levelMultiplier || 0);
    const finalPriceBRL = basePrice + (levelDifference * multiplier);
    
    // Cálculo do preço em Dólar
    const basePriceUSD = Number(product.basePriceUSD || 0);
    const multiplierUSD = Number(product.levelMultiplierUSD || 0);
    const finalPriceUSD = basePriceUSD + (levelDifference * multiplierUSD);
    
    setCurrentPrice(finalPriceBRL);
    setCurrentPriceUSD(finalPriceUSD);
  };

  const handleLevelChange = (event, newValue) => {
    setSelectedLevel(newValue);
  };

  const handleJobChange = (event) => {
    setSelectedJob(event.target.value);
  };

  const handlePurchase = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (product.category === 'leveling' && !selectedJob) {
      setNotification('Por favor, selecione um job antes de continuar.');
      return;
    }

    const productToAdd = {
      ...product,
      priceBRL: currentPrice.toFixed(2),
      priceUSD: currentPriceUSD.toFixed(2),
      startLevel: selectedLevel[0],
      endLevel: selectedLevel[1],
      job: selectedJob
    };

    const result = addToCart(productToAdd);
    if (result.success) {
      setTermsDialogOpen(true);
    } else {
      setNotification(result.message);
    }
  };

  const handleTermsDialogClose = (accepted) => {
    setTermsDialogOpen(false);
    if (accepted) {
      navigate('/checkout');
    }
  };

  const handleAddToCart = () => {
    if (product.category === 'leveling' && !selectedJob) {
      setNotification('Por favor, selecione um job antes de adicionar ao carrinho.');
      return;
    }

    const productToAdd = {
      ...product,
      priceBRL: currentPrice.toFixed(2),
      priceUSD: currentPriceUSD.toFixed(2),
      startLevel: selectedLevel[0],
      endLevel: selectedLevel[1],
      job: selectedJob
    };

    const result = addToCart(productToAdd);
    setNotification(result.message);
    
    if (result.success) {
      setTimeout(() => setNotification(''), 3000);
    }
  };

  if (loading) {
    return (
      <Typography sx={{ p: 2 }}>Carregando...</Typography>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Container maxWidth="lg" disableGutters>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', width: '100%', maxWidth: 1200 }}>
          {/* Imagem do produto */}
          <Box sx={{ width: '65%' }}>
            <Box 
              sx={{ 
                position: 'relative',
                '&::before': {
                  content: '""',
                  display: 'block',
                  paddingTop: '56.25%' // Proporção 16:9
                }
              }}
            >
              <CardMedia
                component="img"
                image={product.image}
                alt={product.name}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          </Box>

          {/* Card de compra */}
          <Box sx={{ width: '35%' }}>
            <Card sx={{ height: '100%', borderRadius: 0, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h5">
                  {product.name}
                </Typography>
                {!product.inStock && (
                  <Chip
                    label="Fora de Estoque"
                    color="error"
                    size="small"
                  />
                )}
              </Box>

              {product.category === 'leveling' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selecione o Range de Level
                  </Typography>
                  <Slider
                    value={selectedLevel}
                    onChange={handleLevelChange}
                    valueLabelDisplay="auto"
                    min={1}
                    max={product.maxLevel || 90}
                    sx={{ mb: 3 }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Selecione o Job</InputLabel>
                    <Select
                      value={selectedJob}
                      onChange={handleJobChange}
                      label="Selecione o Job"
                    >
                      {product.availableJobs?.map((job) => (
                        <MenuItem key={job} value={job}>
                          {job}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Level Inicial: {selectedLevel[0]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Level Final: {selectedLevel[1]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Job: {selectedJob || 'Não selecionado'}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              <Box>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(currentPrice)}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  ${currentPriceUSD.toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handlePurchase}
                sx={{ mt: 2 }}
                disabled={!product.inStock || (product.category === 'leveling' && !selectedJob)}
              >
                {product.inStock ? 'Comprar Agora' : 'Produto Indisponível'}
              </Button>

              <Button
                variant="outlined"
                color="primary"
                size="large"
                fullWidth
                onClick={handleAddToCart}
                startIcon={<ShoppingCartIcon />}
                sx={{ mt: 2 }}
                disabled={!product.inStock || (product.category === 'leveling' && !selectedJob)}
              >
                {product.inStock ? 'Adicionar ao Carrinho' : 'Fora de Estoque'}
              </Button>

              {notification && (
                <Alert 
                  severity={notification.includes('já tem') ? 'error' : 'success'}
                  sx={{ 
                    mt: 1,
                    '& .MuiAlert-message': {
                      width: '100%',
                      textAlign: 'center'
                    }
                  }}
                >
                  {notification}
                </Alert>
              )}

              {!product.inStock && (
                <Alert 
                  severity="info" 
                  sx={{ mt: 2 }}
                >
                  Este produto está temporariamente indisponível. Por favor, volte mais tarde.
                </Alert>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold', mt: 3 }}>
                  FORMAS DE PAGAMENTO
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <span>• Pix</span>
                  <span>• Cartão de Crédito</span>
                  <span>• Boleto Bancário</span>
                </Typography>
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Seção de descrição */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ 
          bgcolor: '#fff', 
          p: 3,
          borderRadius: 1,
          boxShadow: 1
        }}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            DESCRIÇÃO
          </Typography>
          <Typography 
            variant="body1" 
            component="pre"
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              margin: 0,
              fontSize: 'inherit'
            }}
          >
            {product.description}
          </Typography>
        </Box>
      </Container>

      <TermsDialog
        open={termsDialogOpen}
        onClose={handleTermsDialogClose}
      />
    </Container>
  );
} 