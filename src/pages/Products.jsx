import { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, CardMedia, Typography, Button, TextField, Box, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatPrice } from '../utils/format';

const categories = [
  { value: 'all', label: 'All' },
  { value: 'savage', label: 'Savage Clear', color: 'warning' },
  { value: 'ultimate', label: 'Ultimate Clear', color: 'error' },
  { value: 'extreme', label: 'Extreme Clear', color: 'info' },
  { value: 'leveling', label: 'Leveling', color: 'success' },
  { value: 'quests', label: 'Quests', color: 'default' },
  { value: 'gil', label: 'Gil', color: 'warning' }
];

export function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

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
  }, []);

  const handleCategoryChange = (event, newCategory) => {
    setSelectedCategory(newCategory || 'all');
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // In-stock products appear first
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      return 0;
    });

  const getCategoryColor = (category) => {
    const categoryInfo = categories.find(cat => cat.value === category);
    return categoryInfo?.color || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Products
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={selectedCategory}
            exclusive
            onChange={handleCategoryChange}
            aria-label="product category"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              '& .MuiToggleButton-root': {
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '16px !important',
                px: 2,
                py: 1,
                textTransform: 'none',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }
              }
            }}
          >
            {categories.map((category) => (
              <ToggleButton 
                key={category.value} 
                value={category.value}
              >
                {category.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <TextField
          fullWidth
          label="Search products"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredProducts.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <Card sx={{ 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              maxWidth: 360,
              margin: '0 auto',
              opacity: product.inStock ? 1 : 0.7
            }}>
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.image}
                  alt={product.name}
                  sx={{ 
                    objectFit: 'cover',
                    filter: !product.inStock ? 'grayscale(50%)' : 'none'
                  }}
                />
                {!product.inStock && (
                  <Chip
                    label="Out of Stock"
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8
                    }}
                  />
                )}
                <Chip
                  label={categories.find(cat => cat.value === product.category)?.label || 'Others'}
                  color={getCategoryColor(product.category)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8
                  }}
                />
              </Box>
              <CardContent sx={{ 
                flexGrow: 1, 
                p: 2,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box>
                  <Typography gutterBottom variant="h6" component="div" sx={{ fontSize: '1.2rem', mb: 1 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 2,
                    fontSize: '0.95rem'
                  }}>
                    {product.description}
                  </Typography>
                </Box>
                <Box sx={{ mt: 'auto' }}>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {formatPrice(product.priceBRL)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${Number(product.priceUSD).toFixed(2)}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    size="medium"
                    sx={{ 
                      mt: 2,
                      '&.Mui-disabled': {
                        bgcolor: 'rgba(0, 0, 0, 0.12)',
                        color: 'rgba(0, 0, 0, 0.5)'
                      }
                    }}
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    View Details
                    {!product.inStock && ' (Out of Stock)'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
} 