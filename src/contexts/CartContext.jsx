import { createContext, useContext, useState, useEffect } from 'react';
import { formatPrice } from '../utils/format';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
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

    // Para produtos de Gil, verifica se a quantidade está disponível
    if (product.category === 'gil') {
      console.log('Adicionando produto Gil ao carrinho:', {
        gilAmount: product.gilAmount,
        availableGil: product.availableGil,
        soldGil: product.soldGil
      });

      const existingGilItems = cartItems.filter(item => 
        item.id === product.id
      );

      const totalGilRequested = existingGilItems.reduce((total, item) => 
        total + (item.gilAmount || 0), 0
      ) + (product.gilAmount || 0);

      if (totalGilRequested > (product.availableGil - (product.soldGil || 0))) {
        return {
          success: false,
          message: 'Quantidade de Gil solicitada não está disponível'
        };
      }
    }

    setCartItems(prev => {
      // Para produtos de Gil ou Leveling, sempre adiciona como novo item
      if (['leveling', 'gil'].includes(product.category)) {
        return [...prev, { ...product, quantity: 1 }];
      }
      
      // Para outros tipos de produtos, mantém a lógica original
      const existingItem = prev.find(item => 
        item.id === product.id && 
        !['leveling', 'gil'].includes(item.category)
      );
      
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

  const updateGilStock = async (productId, gilAmount) => {
    try {
      // Primeiro, verifica se o produto ainda tem gil suficiente
      const productRef = doc(db, 'products', productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Produto não encontrado');
      }

      const productData = productDoc.data();
      const currentSoldGil = Number(productData.soldGil || 0);
      const availableGil = Number(productData.availableGil) - currentSoldGil;

      if (Number(gilAmount) > availableGil) {
        throw new Error('Quantidade de Gil solicitada não está mais disponível');
      }

      // Atualiza o estoque de Gil
      const newSoldGil = currentSoldGil + Number(gilAmount);
      await updateDoc(productRef, {
        soldGil: newSoldGil
      });

      // Emite um evento customizado para notificar que o estoque foi atualizado
      window.dispatchEvent(new CustomEvent('gilStockUpdated', {
        detail: {
          productId,
          newSoldGil,
          availableGil: productData.availableGil
        }
      }));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar estoque de Gil:', error);
      throw error;
    }
  };

  const finalizePurchase = async () => {
    try {
      // Atualiza o estoque de Gil para cada item do tipo gil no carrinho
      const gilItems = cartItems.filter(item => item.category === 'gil');
      
      console.log('Itens Gil no carrinho antes da finalização:', gilItems);
      
      for (const item of gilItems) {
        console.log('Processando item Gil:', {
          id: item.id,
          gilAmount: item.gilAmount,
          totalGil: item.totalGil
        });

        if (!item.gilAmount) {
          console.error('Item gil sem quantidade definida:', item);
          continue;
        }
        await updateGilStock(item.id, item.gilAmount);
      }
      
      // Limpa o carrinho
      await clearCart();
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      throw error;
    }
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
      getCartTotal,
      finalizePurchase
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
} 