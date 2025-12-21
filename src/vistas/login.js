import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthProvider';
import './Login.css';

export default function Login() {
  const [formData, setFormData] = useState({
    usuario: '',
    password: ''
  });
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [screenSize, setScreenSize] = useState('medium');

  const { login: authLogin, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const passRef = useRef();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 375) setScreenSize('small');
      else if (width > 768) setScreenSize('large');
      else setScreenSize('medium');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Login.js: Usuario ya autenticado. Redirigiendo...');
      navigate('/reservas');
    }
  }, [isAuthenticated, user, navigate]);

  const focusNextField = (nextRef) => {
    if (nextRef && nextRef.current) {
      nextRef.current.focus();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (mensajeError) {
      setMensajeError('');
    }
  };

  // ✅ FUNCIÓN DE LOGIN CORREGIDA
  const handleLogin = async (e) => {
    if (e) e.preventDefault(); // Prevenir comportamiento por defecto
    
    setCargando(true);
    setMensajeError('');

    const { usuario, password } = formData;

    // Validaciones
    if (!usuario.trim() || !password.trim()) {
      setMensajeError('Por favor, completa todos los campos');
      setCargando(false);
      return;
    }

    try {
      console.log('🔐 Login.js: Iniciando login para usuario:', usuario.trim());
      
      // ✅ Llamar a la función login del AuthProvider
      const result = await authLogin(usuario.trim(), password.trim());

      console.log('📥 Login.js: Resultado de authLogin:', result);

      if (result.success) {
        console.log('✅ Login.js: Login exitoso. Usuario:', result.user);
        
        // Mostrar datos recibidos para debug
        console.log('📊 Login.js: Datos recibidos:', {
          id: result.user?.id,
          usuario: result.user?.usuario,
          rol: result.user?.rol,
          polideportivo_id: result.user?.polideportivo_id
        });

        // Limpiar formulario
        setFormData({
          usuario: '',
          password: ''
        });
        setMensajeError('');

        console.log('🎉 Login.js: Redirigiendo a /reservas...');
        
        // Redirigir al panel principal
        setTimeout(() => {
          navigate('/reservas', { replace: true });
        }, 100);
      } else {
        console.error('❌ Login.js: Error del authLogin:', result.error);
        throw new Error(result.error || 'Error en el login');
      }

    } catch (err) {
      console.error('❌ Login.js: Error en login:', err);
      let errorMessage = err.message || 'Error al iniciar sesión';
      
      // Mensajes de error específicos
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else if (err.message.includes('401') || err.message.toLowerCase().includes('incorrectos')) {
        errorMessage = 'Usuario o contraseña incorrectos.';
      } else if (err.message.includes('400')) {
        if (err.message.includes('requeridos')) {
          errorMessage = 'Usuario y contraseña requeridos.';
        } else {
          errorMessage = 'Datos de login inválidos.';
        }
      } else if (err.message.includes('404')) {
        errorMessage = 'Servicio no disponible. Intenta más tarde.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Error del servidor. Intenta más tarde.';
      }
      
      setMensajeError(errorMessage);
    } finally {
      setCargando(false);
    }
  };

  // Verificar datos al cargar la página
  useEffect(() => {
    console.log('🔍 Login.js: Página cargada. Estado auth:', {
      isAuthenticated: isAuthenticated,
      user: user ? {
        usuario: user.usuario,
        rol: user.rol,
        polideportivo_id: user.polideportivo_id
      } : 'No autenticado'
    });
  }, [isAuthenticated, user]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMostrarPassword = () => {
    setMostrarPassword(!mostrarPassword);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.target.name === 'usuario') {
        focusNextField(passRef);
      } else if (e.target.name === 'password') {
        handleLogin(e);
      }
    }
  };

  // Colores para modo oscuro
  const colors = darkMode ? {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#6366F1',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#334155',
    danger: '#EF4444',
    card: '#1E293B',
    inputBackground: '#334155',
  } : {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    primary: '#4F46E5',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#EF4444',
    card: '#FFFFFF',
    inputBackground: '#F9FAFB',
  };

  return (
    <div 
      className="login-overlay" 
      style={{ backgroundColor: colors.background }}
    >
      <div className="login-container">
        <div 
          className={`form-container form-container-${screenSize}`}
          style={{ 
            backgroundColor: colors.card,
            boxShadow: darkMode 
              ? '0 10px 25px rgba(0,0,0,0.3)' 
              : '0 10px 25px rgba(0,0,0,0.1)'
          }}
        >
          
          {/* Header */}
          <div className="header">
            <button 
              className="back-button"
              onClick={() => navigate('/')}
              style={{ color: colors.primary }}
              type="button"
            >
              ←
            </button>
            <div className="header-center">
              <h1 
                className={`title title-${screenSize}`}
                style={{ color: colors.text }}
              >
                Iniciar Sesión
              </h1>
            </div>
            <button 
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              style={{ color: colors.primary }}
              type="button"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <p 
            className={`subtitle subtitle-${screenSize}`}
            style={{ color: colors.textSecondary }}
          >
            Accede a tu cuenta
          </p>

          {/* Estado actual */}
          {isAuthenticated && user && (
            <div 
              className="estado-actual"
              style={{
                backgroundColor: colors.primary + '15',
                border: `1px solid ${colors.primary}30`,
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px'
              }}
            >
              <div style={{ color: colors.primary, fontWeight: 'bold', marginBottom: '6px' }}>
                ✅ Sesión activa detectada
              </div>
              <div style={{ color: colors.textSecondary, marginBottom: '4px' }}>
                Usuario: <strong>{user.nombre || user.usuario}</strong>
              </div>
              <div style={{ color: colors.textSecondary, marginBottom: '4px' }}>
                Rol: <strong style={{ 
                  color: user.rol === 'admin' ? '#10B981' : 
                         user.rol === 'admin_poli' ? '#3B82F6' : colors.text
                }}>{user.rol || 'No definido'}</strong>
              </div>
              {user.polideportivo_id && (
                <div style={{ color: colors.textSecondary, marginBottom: '4px' }}>
                  Polideportivo ID: <strong>{user.polideportivo_id}</strong>
                </div>
              )}
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => navigate('/reservas')}
                  style={{
                    background: colors.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginRight: '8px'
                  }}
                  type="button"
                >
                  Ir al panel
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  style={{
                    background: 'transparent',
                    color: colors.danger,
                    border: `1px solid ${colors.danger}`,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  type="button"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          {/* Mostrar formulario solo si no está autenticado */}
          {!isAuthenticated && (
            <>
              {mensajeError && (
                <div 
                  className="error-container" 
                  style={{ 
                    backgroundColor: `${colors.danger}15`,
                    border: `1px solid ${colors.danger}30`
                  }}
                >
                  <span className="error-icon">⚠️</span>
                  <span 
                    className="error-text" 
                    style={{ color: colors.danger }}
                  >
                    {mensajeError}
                  </span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <input
                    type="text"
                    name="usuario"
                    placeholder="Usuario"
                    className={`input input-${screenSize}`}
                    style={{ 
                      backgroundColor: colors.inputBackground,
                      borderColor: mensajeError ? colors.danger : colors.border,
                      color: colors.text
                    }}
                    value={formData.usuario}
                    onChange={(e) => handleInputChange('usuario', e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={cargando}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                
                <div className="input-group">
                  <div className="password-container">
                    <input
                      ref={passRef}
                      type={mostrarPassword ? "text" : "password"}
                      name="password"
                      placeholder="Contraseña"
                      className={`input password-input input-${screenSize}`}
                      style={{ 
                        backgroundColor: colors.inputBackground,
                        borderColor: mensajeError ? colors.danger : colors.border,
                        color: colors.text
                      }}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={cargando}
                      autoComplete="current-password"
                    />
                    <button
                      className="eye-button"
                      onClick={toggleMostrarPassword}
                      disabled={cargando}
                      type="button"
                      style={{ color: colors.textMuted }}
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Enlace para recuperar contraseña */}
                <div className="recuperar-container">
                  <button
                    className="recuperar-button"
                    onClick={() => navigate('/recuperar-password')}
                    disabled={cargando}
                    style={{ color: colors.primary }}
                    type="button"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Botón de login principal */}
                <button
                  className={`button button-${screenSize} ${cargando ? 'button-disabled' : ''}`}
                  style={{ 
                    backgroundColor: cargando ? colors.textMuted : colors.primary,
                    opacity: cargando ? 0.7 : 1
                  }}
                  onClick={handleLogin}
                  disabled={cargando}
                  type="submit"
                >
                  {cargando ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <span className={`button-text button-text-${screenSize}`}>
                        Iniciando sesión...
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="button-icon">🔑</span>
                      <span className={`button-text button-text-${screenSize}`}>
                        Entrar
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className={`divider divider-${screenSize}`}>
                <div 
                  className="divider-line" 
                  style={{ backgroundColor: colors.border }} 
                />
                <span 
                  className="divider-text" 
                  style={{ color: colors.textMuted }}
                >
                  o
                </span>
                <div 
                  className="divider-line" 
                  style={{ backgroundColor: colors.border }} 
                />
              </div>

              <button
                className={`secondary-button secondary-button-${screenSize}`}
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: 'transparent'
                }}
                onClick={() => navigate('/registro')}
                disabled={cargando}
                type="button"
              >
                <span 
                  className={`secondary-button-text secondary-button-text-${screenSize}`}
                  style={{ color: colors.text }}
                >
                  ¿No tienes cuenta?{' '}
                  <span style={{ color: colors.primary, fontWeight: '600' }}>Regístrate</span>
                </span>
              </button>
            </>
          )}

          {/* Información de debug */}
          {process.env.NODE_ENV !== 'production' && (
            <div 
              className="debug-info"
              style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '11px',
                color: colors.textSecondary
              }}
            >
              <div style={{ fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>
                🔧 Información del Sistema
              </div>
              <div><strong>Endpoint usado:</strong> 
                <div style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                  <code>POST /api/login</code>
                </div>
              </div>
              <div style={{ marginTop: '6px' }}>
                <strong>Estado:</strong> {isAuthenticated ? '✅ Autenticado' : '❌ No autenticado'}
              </div>
              {user && (
                <>
                  <div><strong>Usuario:</strong> {user.usuario}</div>
                  <div><strong>Rol:</strong> {user.rol}</div>
                  <div><strong>Polideportivo:</strong> {user.polideportivo_id || 'Ninguno'}</div>
                </>
              )}
              <div style={{ marginTop: '8px', fontSize: '10px', color: colors.textMuted }}>
                <strong>Nota:</strong> Usando endpoint /api/login con campo "pass"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}