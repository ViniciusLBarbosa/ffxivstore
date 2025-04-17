import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Buscar dados adicionais do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          // Criar um objeto plano com todas as propriedades necessárias
          const updatedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            // Adicionar dados do Firestore
            role: userData.role || 'user',
            isAdmin: userData.role === 'admin',
            // Dados adicionais do Firestore se necessário
            discord: userData.discord,
            name: userData.name
          };
          
          console.log('Final User Object:', updatedUser);
          setUser(updatedUser);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          // Em caso de erro, criar um objeto básico
          const basicUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: 'user',
            isAdmin: false
          };
          setUser(basicUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Adicionar um useEffect para monitorar mudanças no user
  useEffect(() => {
    if (user) {
      console.log('User state updated:', user);
      console.log('Is Admin?', user.isAdmin);
      console.log('Role:', user.role);
    }
  }, [user]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      if (!auth.currentUser) throw new Error('Nenhum usuário logado');
      
      await firebaseUpdateProfile(auth.currentUser, profileData);
      
      // Atualiza o estado do usuário com os novos dados
      setUser(prev => ({
        ...prev,
        displayName: profileData.displayName || prev.displayName,
        photoURL: profileData.photoURL || prev.photoURL
      }));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 