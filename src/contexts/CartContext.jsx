import { createContext, useContext, useState, useEffect } from 'react';
import { formatPrice } from '../utils/format';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const CartContext = createContext({});
const CART_STORAGE_KEY = '@FFXIVStore:cart';

// Função auxiliar para carregar o carrinho do localStorage
const loadStoredCart = () => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.error('Erro ao carregar carrinho do localStorage:', error);
    return [];
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Carrega os itens do carrinho quando o usuário muda (login/logout)
  useEffect(() => {
    const loadCartItems = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Se está logando, carrega do Firestore
          const cartDoc = await getDoc(doc(db, 'carts', user.uid));
          if (cartDoc.exists()) {
            const firestoreCart = cartDoc.data().items || [];
            setCartItems(firestoreCart);
          } else {
            // Se não existe carrinho no Firestore, inicia vazio
            setCartItems([]);
            await setDoc(doc(db, 'carts', user.uid), {
              items: [],
              updatedAt: new Date()
            });
          }
        } else {
          // Se está deslogando, limpa o carrinho
          setCartItems([]);
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCartItems();
  }, [user]);

  // Sincroniza com Firestore quando logado e o carrinho mudar
  useEffect(() => {
    const syncWithFirestore = async () => {
      if (user && !isLoading) {
        try {
          await setDoc(doc(db, 'carts', user.uid), {
            items: cartItems,
            updatedAt: new Date()
          });
        } catch (error) {
          console.error('Erro ao sincronizar com Firestore:', error);
        }
      }
    };

    syncWithFirestore();
  }, [cartItems, user, isLoading]);

  const addToCart = (product) => {
    // Para produtos de leveling, verifica se já existe um item com o mesmo job
    if (product.category === 'leveling') {
      const existingLevelingItem = cartItems.find(item => 
        item.id === product.id && 
        item.job === product.job
      );

      // Se já existe um item com o mesmo job, retorna erro
      if (existingLevelingItem) {
        return {
          success: false,
          message: 'Você já tem este produto com o mesmo job no carrinho'
        };
      }
    }

    setCartItems(prev => {
      // Para outros tipos de produtos, mantém a lógica original
      const existingItem = prev.find(item => item.id === product.id && !item.category === 'leveling');
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    return {
      success: true,
      message: 'Produto adicionado ao carrinho!'
    };
  };

  const removeFromCart = async (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = async () => {
    setCartItems([]);
    
    if (user) {
      try {
        await setDoc(doc(db, 'carts', user.uid), { 
          items: [],
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
      }
    }
  };

  const getCartTotal = () => {
    const total = cartItems.reduce((total, item) => {
      return total + (Number(item.priceBRL) * item.quantity);
    }, 0);
    return formatPrice(total);
  };

  if (isLoading) {
    return null;
  }

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
} 