import { Box, Container, Grid, Typography, Link, IconButton, Divider, Button } from '@mui/material';
import { Facebook, Twitter, Instagram, Chat } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

export function Footer() {
  const navigate = useNavigate();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#25034F',
        color: 'white',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Sobre */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              FFXIV Store
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Sua loja confiável para serviços de FFXIV. Oferecemos clears de Savage, Ultimate e muito mais!
            </Typography>
          </Grid>

          {/* Links Rápidos */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Links Rápidos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/" color="inherit" sx={{ textDecoration: 'none' }}>
                Home
              </Link>
              <Link component={RouterLink} to="/products" color="inherit" sx={{ textDecoration: 'none' }}>
                Produtos
              </Link>
              <Link component={RouterLink} to="/cart" color="inherit" sx={{ textDecoration: 'none' }}>
                Carrinho
              </Link>
              <Link component={RouterLink} to="/orders" color="inherit" sx={{ textDecoration: 'none' }}>
                Meus Pedidos
              </Link>
              <Link component={RouterLink} to="/terms" color="inherit" sx={{ textDecoration: 'none' }}>
                Termos de Uso
              </Link>
            </Box>
          </Grid>

          {/* Categorias */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Categorias
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/products?category=savage" color="inherit" sx={{ textDecoration: 'none' }}>
                Savage Clear
              </Link>
              <Link component={RouterLink} to="/products?category=ultimate" color="inherit" sx={{ textDecoration: 'none' }}>
                Ultimate Clear
              </Link>
              <Link component={RouterLink} to="/products?category=extreme" color="inherit" sx={{ textDecoration: 'none' }}>
                Extreme Clear
              </Link>
              <Link component={RouterLink} to="/products?category=leveling" color="inherit" sx={{ textDecoration: 'none' }}>
                Leveling
              </Link>
            </Box>
          </Grid>

          {/* Contato */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Redes Sociais
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="Discord">
                <Chat />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Contato: suporte@ffxivstore.com
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} FFXIV Store. Todos os direitos reservados.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link component={RouterLink} to="/terms" color="inherit" sx={{ textDecoration: 'none' }}>
              Termos de Uso
            </Link>
            <Link component={RouterLink} to="/privacy" color="inherit" sx={{ textDecoration: 'none' }}>
              Política de Privacidade
            </Link>
          </Box>
        </Box>

        
      </Container>
    </Box>
  );
} 