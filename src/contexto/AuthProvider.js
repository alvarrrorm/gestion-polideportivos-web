import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimeout, setRefreshTimeout] = useState(null);

  // Inicializar: verificar si hay sesión válida
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
              scheduleTokenRefresh(expiryTime - now - 60000);
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

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, []);

  // ✅ LOGIN CORREGIDO - SOLO UN ENDPOINT
  const login = async (username, password) => {
    try {
      console.log('🔐 AuthProvider.login iniciando para:', username.trim());
      console.log('📤 Enviando a /api/login con:', { 
        usuario: username.trim(), 
        pass: password 
      });
      
      // ✅ SOLO USAR /api/login - EL ÚNICO ENDPOINT QUE FUNCIONA
      const response = await fetch('https://tfgv2-production.up.railway.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          usuario: username.trim(), 
          pass: password  // <-- IMPORTANTE: "pass" no "password"
        }),
        credentials: 'include'
      });

      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Datos recibidos del backend:', data);

      if (!data.success) {
        throw new Error(data.error || 'Error en login');
      }

      if (!data.token || !data.user || !data.user.id) {
        console.error('❌ Datos incompletos:', { token: !!data.token, user: !!data.user, userId: data.user?.id });
        throw new Error('Datos de autenticación incompletos');
      }

      // Asegurar que el rol esté presente
      const userData = {
        ...data.user,
        rol: data.user.rol || 'usuario'
      };

      console.log('👤 Usuario procesado:', {
        id: userData.id,
        usuario: userData.usuario,
        rol: userData.rol,
        polideportivo_id: userData.polideportivo_id
      });

      // Calcular tiempo de expiración (23 horas)
      const expiryTime = Date.now() + (23 * 60 * 60 * 1000);

      // Guardar en localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('token_expiry', expiryTime.toString());
      
      // Establecer estado
      setToken(data.token);
      setUser(userData);

      // Programar refresco automático
      scheduleTokenRefresh(22 * 60 * 60 * 1000);

      console.log('✅ AuthProvider.login exitoso para:', userData.usuario);
      
      return { success: true, user: userData };

    } catch (error) {
      console.error('❌ AuthProvider.login error:', error);
      return { 
        success: false, 
        error: error.message || 'Error en autenticación' 
      };
    }
  };

  // Función para programar refresco
  const scheduleTokenRefresh = (timeUntilExpiry) => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    
    if (timeUntilExpiry > 0) {
      const timeout = setTimeout(refreshToken, timeUntilExpiry);
      setRefreshTimeout(timeout);
    }
  };

  // Refrescar token
  const refreshToken = async () => {
    try {
      const currentToken = localStorage.getItem('auth_token');
      
      if (!currentToken) {
        logout();
        return;
      }

      const response = await fetch('https://tfgv2-production.up.railway.app/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.token) {
          const decoded = jwtDecode(data.token);
          const expiryTime = Date.now() + (23 * 60 * 60 * 1000);
          
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('token_expiry', expiryTime.toString());
          
          setToken(data.token);
          scheduleTokenRefresh(22 * 60 * 60 * 1000);
          
          console.log('✅ Token refrescado automáticamente');
        } else {
          throw new Error('Error refrescando token');
        }
      } else {
        throw new Error('Token no se pudo refrescar');
      }
    } catch (error) {
      console.error('Error refrescando token:', error);
      logout();
    }
  };

  // Logout
  const logout = async (navigate = null) => {
    try {
      if (token) {
        await fetch('https://tfgv2-production.up.railway.app/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearAuth();
      
      if (navigate) {
        navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }
  };

  // Limpiar autenticación
  const clearAuth = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token_expiry');
    
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(null);
    }
    
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

  // Verificar autenticación con backend
  const verifyAuth = async () => {
    try {
      const currentToken = localStorage.getItem('auth_token');
      
      if (!currentToken) return false;

      const response = await fetch('https://tfgv2-production.up.railway.app/api/auth/verify', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${currentToken}` },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.success === true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  };

  // Requerir autenticación
  const requireAuth = async () => {
    if (loading) return { authorized: false, loading: true };
    if (!user || !token) return { authorized: false, loading: false };
    
    if (!isTokenValid()) {
      await logout();
      return { authorized: false, loading: false };
    }

    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
      await logout();
      return { authorized: false, loading: false };
    }

    return { authorized: true, loading: false };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!token && isTokenValid(),
        requireAuth,    
        verifyAuth,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};