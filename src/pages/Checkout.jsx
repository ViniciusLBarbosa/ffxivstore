import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Divider,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Alert,
  Grid,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/format';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const steps = ['Seu Endereço', 'Contato Discord', 'Forma de Pagamento', 'Revisão do Pedido'];

export function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, clearCart, finalizePurchase } = useCart();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState({
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    discord: '',
    payment: {
      method: 'pix',
      currency: 'BRL'
    }
  });

  // Carrega o endereço e discord do usuário quando a página é carregada
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData(prev => ({
            ...prev,
            address: userData.address || prev.address,
            discord: userData.discord || ''
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  const fetchAddressByCep = async (cep) => {
    setLoadingCep(true);
    try {
      // Remove caracteres não numéricos do CEP
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        return;
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          zipCode: cleanCep
        }
      }));
      setError('');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (event) => {
    const { value } = event.target;
    
    // Atualiza o CEP no estado
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        zipCode: value
      }
    }));

    // Se o CEP tiver 8 dígitos, busca o endereço
    if (value.replace(/\D/g, '').length === 8) {
      fetchAddressByCep(value);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      saveUserAddress();
    } else if (activeStep === 1) {
      saveUserDiscord();
    }
    
    if (activeStep === steps.length - 1) {
      handlePlaceOrder();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const saveUserAddress = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        address: formData.address
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
    }
  };

  const saveUserDiscord = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        discord: formData.discord
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar Discord:', error);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (section) => (event) => {
    const { name, value } = event.target;
    if (section === 'discord') {
      setFormData(prev => ({
        ...prev,
        discord: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    }
  };

  const calculateTotal = () => {
    if (formData.payment.currency === 'BRL') {
      return cartItems.reduce((sum, item) => sum + (Number(item.priceBRL) * item.quantity), 0);
    } else {
      return cartItems.reduce((sum, item) => sum + (Number(item.priceUSD) * item.quantity), 0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isStepValid()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderItems = cartItems.map(item => {
        const baseItem = {
          id: item.id,
          name: item.name,
          quantity: item.quantity || 1,
          price: formData.payment.currency === 'BRL' ? Number(item.priceBRL) : Number(item.priceUSD),
          category: item.category,
          image: item.image || ''
        };

        // Adiciona campos específicos para produtos de leveling
        if (item.category === 'leveling') {
          return {
            ...baseItem,
            selectedJob: item.selectedJob || null,
            startLevel: item.startLevel || null,
            endLevel: item.endLevel || null
          };
        }
        
        // Adiciona campos específicos para produtos de gil
        if (item.category === 'gil') {
          return {
            ...baseItem,
            gilAmount: Number(item.gilAmount) || 0,
            totalGil: Number(item.totalGil) || 0
          };
        }

        return baseItem;
      });

      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: orderItems,
        total: calculateTotal(),
        currency: formData.payment.currency,
        payment: {
          method: formData.payment.method
        },
        discordId: formData.discord,
        discordUsername: formData.discord,
        status: 'pending',
        createdAt: serverTimestamp(),
        address: formData.address || null
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Atualiza o estoque de gil e limpa o carrinho
      await finalizePurchase();
      
      navigate(`/order-confirmation/${orderRef.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Ocorreu um erro ao criar o pedido. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (activeStep === 0) {
      const { street, number, neighborhood, city, state, zipCode } = formData.address;
      return street && number && neighborhood && city && state && zipCode;
    }
    if (activeStep === 1) {
      return formData.discord && formData.discord.trim().length > 0;
    }
    if (activeStep === 2) {
      return formData.payment.method && formData.payment.currency;
    }
    return true;
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="CEP"
                name="zipCode"
                value={formData.address.zipCode}
                onChange={handleCepChange}
                InputProps={{
                  endAdornment: loadingCep && (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  )
                }}
                helperText="Digite o CEP para autocompletar o endereço"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Rua"
                name="street"
                value={formData.address.street}
                onChange={handleInputChange('address')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Número"
                name="number"
                value={formData.address.number}
                onChange={handleInputChange('address')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Complemento"
                name="complement"
                value={formData.address.complement}
                onChange={handleInputChange('address')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Bairro"
                name="neighborhood"
                value={formData.address.neighborhood}
                onChange={handleInputChange('address')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Cidade"
                name="city"
                value={formData.address.city}
                onChange={handleInputChange('address')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Estado"
                name="state"
                value={formData.address.state}
                onChange={handleInputChange('address')}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Contato Discord
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Precisamos do seu Discord para entrar em contato sobre a entrega do produto.
            </Typography>
            <TextField
              required
              fullWidth
              label="Usuário Discord"
              value={formData.discord}
              onChange={handleInputChange('discord')}
              placeholder="exemplo#0000"
              helperText="Digite seu usuário do Discord completo, incluindo o número"
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Forma de Pagamento
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Moeda
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                name="currency"
                value={formData.payment.currency}
                onChange={handleInputChange('payment')}
                row
              >
                <FormControlLabel
                  value="BRL"
                  control={<Radio />}
                  label="Real (BRL)"
                />
                <FormControlLabel
                  value="USD"
                  control={<Radio />}
                  label="Dólar (USD)"
                />
              </RadioGroup>
            </FormControl>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Método de Pagamento
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                name="method"
                value={formData.payment.method}
                onChange={handleInputChange('payment')}
              >
                <FormControlLabel
                  value="pix"
                  control={<Radio />}
                  label="PIX"
                />
                <FormControlLabel
                  value="credit"
                  control={<Radio />}
                  label="Cartão de Crédito"
                />
                <FormControlLabel
                  value="boleto"
                  control={<Radio />}
                  label="Boleto Bancário"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Resumo do Pedido
            </Typography>
            {cartItems.map((item) => (
              <Box key={item.id} sx={{ mb: 2 }}>
                <Typography>
                  {item.name} x {item.quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.payment.currency === 'BRL' 
                    ? formatPrice(Number(item.priceBRL) * item.quantity)
                    : `$${(Number(item.priceUSD) * item.quantity).toFixed(2)}`
                  }
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">
              Total: {formData.payment.currency === 'BRL' 
                ? formatPrice(calculateTotal())
                : `$${calculateTotal().toFixed(2)}`
              }
            </Typography>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Você precisa estar logado para finalizar a compra.</Typography>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Seu carrinho está vazio.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Finalizar Compra
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2, mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack}>
              Voltar
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || !isStepValid()}
          >
            {activeStep === steps.length - 1 ? 'Finalizar Pedido' : 'Próximo'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 