import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  InputLabel,
  TextField
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
  const [selectedGilAmount, setSelectedGilAmount] = useState(1);
  const [availableGil, setAvailableGil] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productRef = doc(db, 'products', id);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const productData = productDoc.data();
          setProduct({ id: productDoc.id, ...productData });
          
          // If it's a leveling product, initialize the selected level
          if (productData.category === 'leveling') {
            setSelectedLevel([1, productData.maxLevel || 90]);
            calculatePrices(productData, [1, productData.maxLevel || 90]);
          } else if (productData.category === 'gil') {
            setSelectedGilAmount(1);
            calculateGilPrice(1);
            // Calculate available gil
            const available = productData.availableGil - (productData.soldGil || 0);
            setAvailableGil(available);
          } else {
            setCurrentPrice(Number(productData.priceBRL));
            setCurrentPriceUSD(Number(productData.priceUSD));
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Error loading product');
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    // Add listener for Gil stock updates
    const handleGilStockUpdate = (event) => {
      const { productId, inStock } = event.detail;
      if (productId === id) {
        setProduct(prev => ({ ...prev, inStock }));
      }
    };

    window.addEventListener('gilStockUpdated', handleGilStockUpdate);

    return () => {
      window.removeEventListener('gilStockUpdated', handleGilStockUpdate);
    };
  }, [id]);

  useEffect(() => {
    if (product?.category === 'leveling') {
      calculatePrices(product, selectedLevel);
    }
  }, [selectedLevel, product]);

  useEffect(() => {
    if (product?.category === 'gil') {
      calculateGilPrice(selectedGilAmount);
    }
  }, [selectedGilAmount, product]);

  const calculatePrices = (product, [startLevel, endLevel]) => {
    if (!product || product.category !== 'leveling') return;
    
    const levelDifference = endLevel - startLevel;
    
    // Calculate price in BRL
    const basePrice = Number(product.basePrice || 0);
    const multiplier = Number(product.levelMultiplier || 0);
    const finalPriceBRL = basePrice + (levelDifference * multiplier);
    
    // Calculate price in USD
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
      // Save current URL before redirecting
      sessionStorage.setItem('redirectUrl', window.location.pathname);
      navigate('/login');
      return;
    }

    if (product.category === 'leveling' && !selectedJob) {
      setNotification('Please select a job before continuing.');
      return;
    }

    let productToAdd = {
      ...product,
      quantity: 1
    };

    if (product.category === 'leveling') {
      productToAdd = {
        ...productToAdd,
        startLevel: selectedLevel[0],
        endLevel: selectedLevel[1],
        job: selectedJob,
        priceBRL: currentPrice.toFixed(2),
        priceUSD: currentPriceUSD.toFixed(2)
      };
    } else if (product.category === 'gil') {
      if (!selectedGilAmount || selectedGilAmount < 1) {
        setNotification('Please select a valid Gil amount.');
        return;
      }
      
      if (selectedGilAmount > availableGil) {
        setNotification('Selected Gil amount is not available.');
        return;
      }

      const gilPrice = Number(selectedGilAmount) * Number(product.pricePerMillion);
      const gilPriceUSD = Number(selectedGilAmount) * Number(product.pricePerMillionUSD);

      productToAdd = {
        ...productToAdd,
        gilAmount: Number(selectedGilAmount),
        totalGil: Number(selectedGilAmount) * 1000000, // Converting millions to Gil
        priceBRL: gilPrice.toFixed(2),
        priceUSD: gilPriceUSD.toFixed(2),
        availableGil: product.availableGil,
        soldGil: product.soldGil || 0
      };
    }

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
      setNotification('Please select a job before adding to cart.');
      return;
    }

    let productToAdd = {
      ...product,
      quantity: 1
    };

    if (product.category === 'leveling') {
      productToAdd = {
        ...productToAdd,
        startLevel: selectedLevel[0],
        endLevel: selectedLevel[1],
        job: selectedJob,
        priceBRL: currentPrice.toFixed(2),
        priceUSD: currentPriceUSD.toFixed(2)
      };
    } else if (product.category === 'gil') {
      if (!selectedGilAmount || selectedGilAmount < 1) {
        setNotification('Please select a valid Gil amount.');
        return;
      }
      
      if (selectedGilAmount > availableGil) {
        setNotification('Selected Gil amount is not available.');
        return;
      }

      const gilPrice = Number(selectedGilAmount) * Number(product.pricePerMillion);
      const gilPriceUSD = Number(selectedGilAmount) * Number(product.pricePerMillionUSD);

      productToAdd = {
        ...productToAdd,
        gilAmount: Number(selectedGilAmount),
        totalGil: Number(selectedGilAmount) * 1000000, // Converting millions to Gil
        priceBRL: gilPrice.toFixed(2),
        priceUSD: gilPriceUSD.toFixed(2),
        availableGil: product.availableGil,
        soldGil: product.soldGil || 0
      };
    } else {
      productToAdd = {
        ...productToAdd,
        priceBRL: Number(product.priceBRL).toFixed(2),
        priceUSD: Number(product.priceUSD).toFixed(2)
      };
    }

    const result = addToCart(productToAdd);
    setNotification(result.message);
    
    if (result.success) {
      setTimeout(() => setNotification(''), 10000);
    }
  };

  const calculateGilPrice = (amount) => {
    if (!product || product.category !== 'gil') return;
    
    // Calculate price in BRL
    const pricePerMillion = Number(product.pricePerMillion || 0);
    const finalPriceBRL = amount * pricePerMillion;
    
    // Calculate price in USD
    const pricePerMillionUSD = Number(product.pricePerMillionUSD || 0);
    const finalPriceUSD = amount * pricePerMillionUSD;
    
    setCurrentPrice(finalPriceBRL);
    setCurrentPriceUSD(finalPriceUSD);
  };

  if (loading) {
    return (
      <Typography sx={{ p: 2 }}>Loading...</Typography>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Container maxWidth="lg" disableGutters>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', width: '100%', maxWidth: 1200 }}>
          {/* Product image */}
          <Box sx={{ width: '65%' }}>
            <Box 
              sx={{ 
                position: 'relative',
                '&::before': {
                  content: '""',
                  display: 'block',
                  paddingTop: '56.25%' // 16:9 ratio
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

          {/* Purchase card */}
          <Box sx={{ width: '35%' }}>
            <Card sx={{ height: '100%', borderRadius: 0, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h5">
                  {product.name}
                </Typography>
                {!product.inStock && (
                  <Chip
                    label="Out of Stock"
                    color="error"
                    size="small"
                  />
                )}
              </Box>

              {product.category === 'leveling' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Level Range
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Start Level"
                        type="number"
                        value={selectedLevel[0]}
                        onChange={(e) => {
                          const newStartLevel = Math.max(1, Math.min(selectedLevel[1] - 1, Number(e.target.value)));
                          setSelectedLevel([newStartLevel, selectedLevel[1]]);
                        }}
                        inputProps={{
                          min: 1,
                          max: selectedLevel[1] - 1,
                          step: 1
                        }}
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            fontSize: '1.1rem',
                            padding: '12px 14px'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="End Level"
                        type="number"
                        value={selectedLevel[1]}
                        onChange={(e) => {
                          const newEndLevel = Math.min(product.maxLevel || 90, Math.max(selectedLevel[0] + 1, Number(e.target.value)));
                          setSelectedLevel([selectedLevel[0], newEndLevel]);
                        }}
                        inputProps={{
                          min: selectedLevel[0] + 1,
                          max: product.maxLevel || 90,
                          step: 1
                        }}
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            fontSize: '1.1rem',
                            padding: '12px 14px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Slider
                    value={selectedLevel}
                    onChange={handleLevelChange}
                    valueLabelDisplay="auto"
                    min={1}
                    max={product.maxLevel || 90}
                    sx={{ mb: 3 }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Job</InputLabel>
                    <Select
                      value={selectedJob}
                      onChange={handleJobChange}
                      label="Select Job"
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
                      Start Level: {selectedLevel[0]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      End Level: {selectedLevel[1]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Job: {selectedJob || 'Not selected'}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {product.category === 'gil' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Gil Amount
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Millions of Gil"
                        type="number"
                        value={selectedGilAmount}
                        onChange={(e) => {
                          const value = Math.max(1, Math.min(availableGil, Number(e.target.value)));
                          setSelectedGilAmount(value);
                          calculateGilPrice(value);
                        }}
                        inputProps={{
                          min: 1,
                          max: availableGil,
                          step: 1
                        }}
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            fontSize: '1.1rem',
                            padding: '12px 14px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Slider
                    value={selectedGilAmount}
                    onChange={(_, value) => {
                      setSelectedGilAmount(value);
                      calculateGilPrice(value);
                    }}
                    valueLabelDisplay="auto"
                    min={1}
                    max={availableGil}
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Amount: {selectedGilAmount} million Gil
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Available Gil: {availableGil} million
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
                {product.inStock ? 'Buy Now' : 'Product Unavailable'}
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
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>


              {notification && (
                <>
                  <Alert 
                    severity={notification.includes('already has') ? 'error' : 'success'}
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
                  {notification.includes('successfully') && (
                    <Button
                      component={Link}
                      to="/cart"
                      variant="outlined"
                      color="primary"
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Go to Cart
                    </Button>
                  )}
                </>
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
                  PAYMENT METHODS
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <span>• Pix</span>
                  <span>• Credit Card</span>
                  <span>• Bank Slip</span>
                </Typography>
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* Description section */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ 
          bgcolor: 'background.paper',
          p: 3,
          borderRadius: 1,
          boxShadow: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontWeight: 'bold' }}>
            DESCRIPTION
          </Typography>
          <Typography 
            variant="body1" 
            component="pre"
            color="text.primary"
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