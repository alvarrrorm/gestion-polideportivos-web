import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        const tokenExpiry = localStorage.getItem('token_expiry');

        if (storedToken && storedUser && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry, 10);
          const now = Date.now();

          if (now < expiryTime) {
            try {
              const decoded = jwtDecode(storedToken);
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
            } catch (error) {
              console.error('Error decodificando token:', error);
              clearAuth();
            }
          } else {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ LOGIN SIMPLE Y FUNCIONAL
  const login = async (username, password) => {
    try {
      console.log('🔐 AuthProvider.login para:', username.trim());
      
      const response = await fetch('https://tfgv2-production.up.railway.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          usuario: username.trim(), 
          pass: password
        })
      });

      console.log('📥 Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Datos recibidos:', { success: data.success });

      if (!data.success) {
        throw new Error(data.error || 'Error en login');
      }

      if (!data.token || !data.user || !data.user.id) {
        throw new Error('Datos incompletos');
      }

      // Calcular tiempo de expiración (23 horas)
      const expiryTime = Date.now() + (23 * 60 * 60 * 1000);

      // Guardar en localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('token_expiry', expiryTime.toString());
      
      // Establecer estado
      setToken(data.token);
      setUser(data.user);

      console.log('✅ Login exitoso para:', data.user.usuario);
      
      return { success: true, user: data.user };

    } catch (error) {
      console.error('❌ AuthProvider.login error:', error);
      return { 
        success: false, 
        error: error.message || 'Error en autenticación' 
      };
    }
  };

  // Logout
  const logout = async (navigate = null) => {
    clearAuth();
    if (navigate) {
      navigate('/login');
    } else {
      window.location.href = '/login';
    }
  };

  // Limpiar autenticación
  const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token_expiry');
    setToken(null);
    setUser(null);
  };

  // Verificar token
  const isTokenValid = () => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!token && isTokenValid()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};