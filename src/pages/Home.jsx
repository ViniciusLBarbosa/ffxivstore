import { useState, useEffect } from 'react';
import { Container, Card, CardContent, CardMedia, Typography, Button, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatPrice } from '../utils/format';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export function Home() {
  const [newProducts, setNewProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Busca os Serviços mais recentes
        const newProductsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const newProductsSnapshot = await getDocs(newProductsQuery);
        const newProductsList = newProductsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNewProducts(newProductsList);

        // Busca os Serviços em destaque
        const featuredProductsQuery = query(
          collection(db, 'products'),
          where('featured', '==', true),
          limit(6)
        );
        const featuredProductsSnapshot = await getDocs(featuredProductsQuery);
        const featuredProductsList = featuredProductsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeaturedProducts(featuredProductsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const CarouselCard = ({ product }) => (
    <Card sx={{ 
      height: 450,
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      opacity: product.inStock ? 1 : 0.7
    }}>
      <Box sx={{ position: 'relative', height: 200 }}>
        <CardMedia
          component="img"
          height="200"
          image={product.image}
          alt={product.name}
          sx={{ 
            objectFit: 'cover',
            filter: !product.inStock ? 'grayscale(50%)' : 'none',
            width: '100%',
            height: '100%'
          }}
        />
        {!product.inStock && (
          <Chip
            label="Fora de Estoque"
            color="error"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8
            }}
          />
        )}
      </Box>
      <CardContent sx={{ 
        flexGrow: 1, 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Typography 
            gutterBottom 
            variant="h6" 
            component="div" 
            sx={{ 
              fontSize: '1.2rem', 
              mb: 1,
              minHeight: '3em',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.5em'
            }}
          >
            {product.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 2,
              fontSize: '0.95rem',
              height: '2.6em'
            }}
          >
            {product.description}
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            {formatPrice(product.priceBRL)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ${Number(product.priceUSD).toFixed(2)}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            size="medium"
            sx={{ 
              '&.Mui-disabled': {
                bgcolor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.5)'
              }
            }}
            onClick={() => navigate(`/products/${product.id}`)}
          >
            Ver Detalhes
            {!product.inStock && ' (Fora de Estoque)'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Serviços em Destaque
      </Typography>

      <Box sx={{ mb: 6 }}>
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          spaceBetween={32}
          slidesPerView={1}
          breakpoints={{
            600: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            960: {
              slidesPerView: 3,
              spaceBetween: 32,
            }
          }}
          style={{
            padding: '8px 4px 32px 4px'
          }}
        >
          {featuredProducts.map((product) => (
            <SwiperSlide key={product.id} style={{ height: 'auto' }}>
              <CarouselCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>

      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
        Novos Serviços
      </Typography>

      <Box sx={{ mb: 6 }}>
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          spaceBetween={32}
          slidesPerView={1}
          breakpoints={{
            600: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            960: {
              slidesPerView: 3,
              spaceBetween: 32,
            }
          }}
          style={{
            padding: '8px 4px 32px 4px'
          }}
        >
          {newProducts.map((product) => (
            <SwiperSlide key={product.id} style={{ height: 'auto' }}>
              <CarouselCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Container>
  );
} 