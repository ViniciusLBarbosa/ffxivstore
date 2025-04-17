import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyArD5xcxiNtGUIWWmMsox1LsS01ZOwqQ4U",
    authDomain: "site-vendas-ff.firebaseapp.com",
    projectId: "site-vendas-ff",
    storageBucket: "site-vendas-ff.firebasestorage.app",
    messagingSenderId: "1053932971622",
    appId: "1:1053932971622:web:953beee74034f6ccb42fa7",
    measurementId: "G-0NBZMW7QF2"
  };

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Funções auxiliares
export const timestamp = () => new Date();

// Coleções do Firestore
export const collections = {
  products: 'products',
  purchases: 'purchases',
  users: 'users'
}; 