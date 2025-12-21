import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// Contexto de autenticación
export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimeout, setRefreshTimeout] = useState(null);

  // DEBUG: Ver estado actual
  useEffect(() => {
    console.log('🔍 AuthProvider - Estado actual:', {
      user: user,
      token: token ? 'Sí (oculto por seguridad)' : 'No',
      loading: loading,
      isAuthenticated: !!user && !!token
    });
  }, [user, token, loading]);

  // Inicializar: verificar si hay sesión válida
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthProvider - Inicializando autenticación...');
        
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        const tokenExpiry = localStorage.getItem('token_expiry');

        console.log('🔍 Datos almacenados:', {
          storedToken: storedToken ? 'Sí' : 'No',
          storedUser: storedUser ? 'Sí' : 'No',
          tokenExpiry: tokenExpiry || 'No'
        });

        // Verificar si el token no ha expirado
        if (storedToken && storedUser && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry, 10);
          const now = Date.now();

          console.log('🔍 Tiempos:', {
            expiryTime: new Date(expiryTime).toLocaleString(),
            now: new Date(now).toLocaleString(),
            diferencia: expiryTime - now
          });

          if (now < expiryTime) {
            // Token válido, decodificar y establecer
            try {
              const decoded = jwtDecode(storedToken);
              console.log('✅ Token válido. Usuario decodificado:', {
                id: decoded.id,
                usuario: decoded.usuario,
                rol: decoded.rol,
                polideportivo_id: decoded.polideportivo_id
              });

              setToken(storedToken);
              setUser(JSON.parse(storedUser));
              
              // Programar refresco automático
              const timeUntilExpiry = expiryTime - now - 60000; // 1 minuto antes
              if (timeUntilExpiry > 0) {
                scheduleTokenRefresh(timeUntilExpiry);
                console.log(`⏰ Refresco programado en ${Math.round(timeUntilExpiry/1000/60)} minutos`);
              }
            } catch (error) {
              console.error('❌ Error decodificando token:', error);
              clearAuth();
            }
          } else {
            console.log('❌ Token expirado');
            clearAuth();
          }
        } else {
          console.log('❌ No hay datos de autenticación válidos');
          clearAuth();
        }
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        clearAuth();
      } finally {
        setLoading(false);
        console.log('✅ AuthProvider inicializado');
      }
    };

    initializeAuth();

    // Limpiar timeout al desmontar
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        console.log('🛑 Timeout de refresco limpiado');
      }
    };
  }, []);

  // Función para programar refresco automático del token
  const scheduleTokenRefresh = (timeUntilExpiry) => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    if (timeUntilExpiry > 0) {
      const timeout = setTimeout(() => {
        console.log('🔄 Ejecutando refresco automático del token...');
        refreshToken();
      }, timeUntilExpiry);
      
      setRefreshTimeout(timeout);
      console.log(`⏰ Refresco programado para ${Math.round(timeUntilExpiry/1000/60)} minutos`);
    }
  };

  // Refrescar token
  const refreshToken = async () => {
    try {
      console.log('🔄 Intentando refrescar token...');
      
      const currentToken = localStorage.getItem('auth_token');
      
      if (!currentToken) {
        console.log('❌ No hay token para refrescar');
        logout();
        return;
      }

      // NOTA: Tu backend probablemente no tiene /api/refresh
      // Usa /api/auth/refresh o comenta esto si no existe
      console.log('⚠️  Endpoint /api/refresh puede no existir. Verifica tu backend.');
      
      // Por ahora, solo renovamos localmente
      const decoded = jwtDecode(currentToken);
      const expiryTime = Date.now() + (23 * 60 * 60 * 1000);
      
      localStorage.setItem('token_expiry', expiryTime.toString());
      scheduleTokenRefresh(22 * 60 * 60 * 1000);
      
      console.log('✅ Token "refrescado" localmente');

    } catch (error) {
      console.error('❌ Error refrescando token:', error);
      logout();
    }
  };

  // Login seguro con verificación de sesión
  const login = async (username, password) => {
    try {
      console.log('🔐 Intentando login para usuario:', username);
      
      const response = await fetch('https://tfgv2-production.up.railway.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          usuario: username, 
          password: password 
        })
      });

      const data = await response.json();

      console.log('📨 Respuesta del servidor:', {
        success: data.success,
        error: data.error,
        tieneToken: !!data.token,
        tieneUser: !!data.user,
        userRol: data.user?.rol,
        userPolideportivoId: data.user?.polideportivo_id
      });

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error en login');
      }

      // Verificar que vengan datos críticos
      if (!data.token || !data.user || !data.user.id) {
        console.error('❌ Datos incompletos:', data);
        throw new Error('Datos de autenticación incompletos');
      }

      // DEBUG: Ver todos los datos del usuario
      console.log('✅ Datos completos del usuario:', data.user);

      // Decodificar token para verificar
      try {
        const decoded = jwtDecode(data.token);
        console.log('🔐 Token decodificado:', {
          id: decoded.id,
          usuario: decoded.usuario,
          rol: decoded.rol,
          polideportivo_id: decoded.polideportivo_id,
          exp: new Date(decoded.exp * 1000).toLocaleString()
        });
      } catch (decodeError) {
        console.error('⚠️  Error decodificando token (continuando):', decodeError);
      }

      // Calcular tiempo de expiración (24 horas desde ahora)
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);

      // Guardar datos de forma segura
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('token_expiry', expiryTime.toString());
      
      // Establecer en estado
      setToken(data.token);
      setUser(data.user);

      // Programar refresco automático (23 horas)
      scheduleTokenRefresh(23 * 60 * 60 * 1000);

      console.log('✅ Login exitoso. Usuario establecido:', {
        usuario: data.user.usuario,
        rol: data.user.rol,
        polideportivo_id: data.user.polideportivo_id
      });
      
      return { 
        success: true, 
        user: data.user,
        token: data.token
      };

    } catch (error) {
      console.error('❌ Error en login:', error);
      return { 
        success: false, 
        error: error.message || 'Error en autenticación' 
      };
    }
  };

  // Logout seguro
  const logout = async (navigate = null) => {
    try {
      console.log('🚪 Iniciando logout...');
      
      const currentToken = localStorage.getItem('auth_token');
      
      // Intentar llamar al backend para invalidar sesión
      if (currentToken) {
        try {
          // NOTA: Tu backend puede no tener /api/logout
          // Intenta con /api/auth/logout si existe
          await fetch('https://tfgv2-production.up.railway.app/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ Sesión invalidada en el backend');
        } catch (backendError) {
          console.warn('⚠️  No se pudo invalidar sesión en backend (puede ser normal):', backendError);
        }
      }
    } catch (error) {
      console.error('⚠️  Error en logout (continuando):', error);
    } finally {
      // Limpiar todo localmente
      clearAuth();
      
      console.log('✅ Sesión local limpiada');
      
      // Redirigir a login si se proporciona navigate
      if (navigate) {
        navigate('/login');
      } else {
        // Si no hay navigate, usar window.location
        window.location.href = '/login';
      }
    }
  };

  // Limpiar autenticación
  const clearAuth = () => {
    console.log('🧹 Limpiando datos de autenticación...');
    
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

  // Verificar si el token es válido
  const isTokenValid = () => {
    if (!token) {
      console.log('🔍 Token válido? No hay token');
      return false;
    }
    
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      const isValid = decoded.exp > now;
      
      console.log('🔍 Token válido?', {
        expiracion: new Date(decoded.exp * 1000).toLocaleString(),
        ahora: new Date(now * 1000).toLocaleString(),
        valido: isValid
      });
      
      return isValid;
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return false;
    }
  };

  // Verificar autenticación con el backend
  const verifyAuth = async () => {
    try {
      console.log('🔍 Verificando autenticación con backend...');
      
      const currentToken = localStorage.getItem('auth_token');
      
      if (!currentToken) {
        console.log('❌ No hay token para verificar');
        return false;
      }

      // NOTA: Tu backend puede no tener /api/verify
      // Intenta con /api/auth/verify si existe
      const response = await fetch('https://tfgv2-production.up.railway.app/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Verificación backend:', data);
        return data.success === true;
      } else {
        console.log('⚠️  Verificación backend falló, status:', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      return false;
    }
  };

  // Función para forzar verificación antes de acceder a rutas protegidas
  const requireAuth = async () => {
    console.log('🔒 Verificando acceso a ruta protegida...');
    
    if (loading) {
      console.log('⏳ Cargando...');
      return { authorized: false, loading: true };
    }

    if (!user || !token) {
      console.log('❌ No hay usuario o token');
      return { authorized: false, loading: false };
    }

    // Verificar validez local del token
    if (!isTokenValid()) {
      console.log('❌ Token no válido localmente');
      await logout();
      return { authorized: false, loading: false };
    }

    // Verificar con el backend
    const isAuthenticated = await verifyAuth();
    
    if (!isAuthenticated) {
      console.log('❌ Token no válido en backend');
      await logout();
      return { authorized: false, loading: false };
    }

    console.log('✅ Acceso autorizado');
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