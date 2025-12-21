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
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const { login: authLogin, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const passRef = useRef();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Usuario ya autenticado. Redirigiendo...');
      navigate('/reservas');
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (mensajeError) setMensajeError('');
  };

  const handleLogin = async () => {
    setCargando(true);
    setMensajeError('');

    const { usuario, password } = formData;

    if (!usuario.trim() || !password.trim()) {
      setMensajeError('Por favor, completa todos los campos');
      setCargando(false);
      return;
    }

    try {
      console.log('🔐 Login.js: Iniciando login para:', usuario.trim());
      
      const result = await authLogin(usuario.trim(), password);

      console.log('📥 Login.js: Resultado:', result.success ? 'Éxito' : 'Error');

      if (result.success) {
        console.log('✅ Login.js: Login exitoso');
        
        setFormData({
          usuario: '',
          password: ''
        });
        setMensajeError('');

        setTimeout(() => {
          navigate('/reservas');
        }, 100);
      } else {
        throw new Error(result.error || 'Error en el login');
      }

    } catch (err) {
      console.error('❌ Login.js: Error:', err);
      let errorMessage = err.message || 'Error al iniciar sesión';
      
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else if (err.message.includes('401') || err.message.toLowerCase().includes('incorrectos')) {
        errorMessage = 'Usuario o contraseña incorrectos.';
      } else if (err.message.includes('400')) {
        errorMessage = 'Datos incorrectos. Verifica usuario y contraseña.';
      }
      
      setMensajeError(errorMessage);
    } finally {
      setCargando(false);
    }
  };

  const toggleMostrarPassword = () => {
    setMostrarPassword(!mostrarPassword);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (e.target.name === 'usuario') {
        passRef.current.focus();
      } else if (e.target.name === 'password') {
        handleLogin();
      }
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-container">
        <div className="form-container">
          <h1>Iniciar Sesión</h1>
          <p>Accede a tu cuenta</p>

          {!isAuthenticated && (
            <>
              {mensajeError && (
                <div className="error-container">
                  <span>⚠️</span>
                  <span className="error-text">{mensajeError}</span>
                </div>
              )}

              <div className="input-group">
                <input
                  type="text"
                  name="usuario"
                  placeholder="Usuario"
                  className="input"
                  value={formData.usuario}
                  onChange={(e) => handleInputChange('usuario', e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={cargando}
                  autoComplete="username"
                />
              </div>
              
              <div className="input-group">
                <div className="password-container">
                  <input
                    ref={passRef}
                    type={mostrarPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    className="input password-input"
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
                  >
                    {mostrarPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                className={`button ${cargando ? 'button-disabled' : ''}`}
                onClick={handleLogin}
                disabled={cargando}
                type="button"
              >
                {cargando ? 'Iniciando sesión...' : 'Entrar'}
              </button>

              <button
                className="secondary-button"
                onClick={() => navigate('/registro')}
                disabled={cargando}
                type="button"
              >
                ¿No tienes cuenta? <span>Regístrate</span>
              </button>
            </>
          )}

          {isAuthenticated && user && (
            <div className="estado-actual">
              <div>✅ Sesión activa detectada</div>
              <div>Usuario: <strong>{user.nombre || user.usuario}</strong></div>
              <div>Rol: <strong>{user.rol || 'No definido'}</strong></div>
              <button onClick={() => navigate('/reservas')}>
                Ir al panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}