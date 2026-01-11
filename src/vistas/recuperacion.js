import React, { useState, useRef, useEffect } from 'react';
import './Recuperacion.css';

export default function RecuperarPassword() {
  const [formData, setFormData] = useState({
    email: '',
    codigo: '',
    nuevaPassword: '',
    confirmarPassword: ''
  });
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [pasoActual, setPasoActual] = useState(1);
  const [screenSize, setScreenSize] = useState('medium');
  const [tiempoReenvio, setTiempoReenvio] = useState(0);
  const [usuarioInfo, setUsuarioInfo] = useState(null);

  const codigoRef = useRef();
  const nuevaPasswordRef = useRef();
  const confirmarPasswordRef = useRef();

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

  // Temporizador para reenvío de código
  useEffect(() => {
    if (tiempoReenvio > 0) {
      const timer = setTimeout(() => setTiempoReenvio(tiempoReenvio - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tiempoReenvio]);

  // Limpiar mensajes automáticamente
  useEffect(() => {
    if (mensajeError || mensajeExito) {
      const timer = setTimeout(() => {
        setMensajeError('');
        setMensajeExito('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensajeError, mensajeExito]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar mensajes de error cuando el usuario empiece a escribir
    if (mensajeError) setMensajeError('');
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Manejar submit con Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch (pasoActual) {
        case 1:
          handleSolicitarCodigo();
          break;
        case 2:
          handleVerificarCodigo();
          break;
        case 3:
          handleCambiarPassword();
          break;
      }
    }
  };

  // Función mejorada para hacer fetch con manejo de errores
  const hacerFetch = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { response, data };
      } else {
        const text = await response.text();
        throw new Error(`Respuesta no JSON: ${text}`);
      }
    } catch (error) {
      console.error('❌ Error en fetch:', error);
      throw error;
    }
  };

  // Paso 1: Solicitar código de recuperación
  const handleSolicitarCodigo = async () => {
    setCargando(true);
    setMensajeError('');
    setMensajeExito('');

    const { email } = formData;

    if (!email.trim()) {
      setMensajeError('Por favor, ingresa tu correo electrónico');
      setCargando(false);
      return;
    }

    if (!validarEmail(email)) {
      setMensajeError('Por favor, ingresa un correo electrónico válido');
      setCargando(false);
      return;
    }

    try {
      console.log('📧 Enviando solicitud de recuperación para:', email);
      
      const { response, data } = await hacerFetch('https://tfgv2-production.up.railway.app/api/recupera/solicitar-recuperacion', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      console.log('📨 Respuesta del servidor:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.status === 404 || (data && data.emailNotFound)) {
        // CASO 1: Email no encontrado (404)
        setMensajeError(data?.error || 'El correo electrónico no está registrado en nuestro sistema');
      } else if (response.ok && data.success) {
        // CASO 2: Email encontrado, código enviado
        setMensajeExito(data.message || 'Se ha enviado un código de verificación a tu correo electrónico');
        setPasoActual(2);
        setTiempoReenvio(60); // 60 segundos para reenvío
        
        // Mostrar código en desarrollo para testing
        if (data.debug && data.debug.codigo) {
          console.log('🔐 Código de desarrollo:', data.debug.codigo);
        }
      } else if (!response.ok) {
        // CASO 3: Otro error del servidor
        setMensajeError(data?.error || `Error del servidor (${response.status})`);
      } else {
        // CASO 4: Respuesta inesperada
        setMensajeError('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setMensajeError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Verificar código
  const handleVerificarCodigo = async () => {
    setCargando(true);
    setMensajeError('');
    setMensajeExito('');

    const { email, codigo } = formData;

    if (!codigo.trim()) {
      setMensajeError('Por favor, ingresa el código de verificación');
      setCargando(false);
      return;
    }

    if (codigo.length !== 6) {
      setMensajeError('El código debe tener exactamente 6 dígitos');
      setCargando(false);
      return;
    }

    try {
      console.log('🔍 Verificando código:', codigo, 'para:', email);
      
      const { response, data } = await hacerFetch('https://tfgv2-production.up.railway.app/api/recupera/verificar-codigo', {
        method: 'POST',
        body: JSON.stringify({ email, codigo }),
      });

      console.log('✅ Respuesta verificación:', data);

      if (response.ok && data.success && data.valido) {
        setMensajeExito(data.message || 'Código verificado correctamente');
        setPasoActual(3);
        // Guardar información del usuario para mostrar en el siguiente paso
        if (data.usuario) {
          setUsuarioInfo(data.usuario);
        }
      } else {
        setMensajeError(data.error || 'Código incorrecto o expirado');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setMensajeError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  // Paso 3: Cambiar contraseña
  const handleCambiarPassword = async () => {
    setCargando(true);
    setMensajeError('');
    setMensajeExito('');

    const { email, codigo, nuevaPassword, confirmarPassword } = formData;

    // Validaciones
    if (!nuevaPassword.trim() || !confirmarPassword.trim()) {
      setMensajeError('Por favor, completa todos los campos');
      setCargando(false);
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setMensajeError('Las contraseñas no coinciden');
      setCargando(false);
      return;
    }

    if (nuevaPassword.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres');
      setCargando(false);
      return;
    }

    // Validar fortaleza de contraseña (opcional)
    if (nuevaPassword.length > 50) {
      setMensajeError('La contraseña es demasiado larga');
      setCargando(false);
      return;
    }

    try {
      console.log('🔄 Cambiando contraseña para:', email);
      
      const { response, data } = await hacerFetch('https://tfgv2-production.up.railway.app/api/recupera/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          codigo, 
          nuevaPassword 
        }),
      });

      console.log('🔐 Respuesta cambio contraseña:', data);

      if (response.ok && data.success) {
        setMensajeExito(data.message || '¡Contraseña cambiada exitosamente!');
        
        // Redirigir automáticamente después de 3 segundos
        setTimeout(() => {
          const confirmarRedireccion = window.confirm(
            'Tu contraseña ha sido cambiada correctamente. ¿Deseas ir al inicio de sesión?'
          );
          if (confirmarRedireccion) {
            window.location.href = '/login';
          }
        }, 3000);
        
      } else {
        setMensajeError(data.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setMensajeError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  // Reenviar código
  const handleReenviarCodigo = async () => {
    if (tiempoReenvio > 0) return;
    
    setCargando(true);
    setMensajeError('');
    
    try {
      console.log('🔄 Reenviando código para:', formData.email);
      
      const { response, data } = await hacerFetch('https://tfgv2-production.up.railway.app/api/recupera/reenviar-codigo', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email }),
      });

      console.log('📨 Respuesta reenvío:', data);

      if (response.status === 404 || (data && data.emailNotFound)) {
        // Email no encontrado
        setMensajeError(data?.error || 'El correo electrónico no está registrado en nuestro sistema');
        // Volver al paso 1
        setPasoActual(1);
      } else if (response.ok && data.success) {
        setMensajeExito(data.message || 'Se ha reenviado el código de verificación a tu correo electrónico');
        setTiempoReenvio(60); // Reiniciar temporizador
        
        // Mostrar código en desarrollo para testing
        if (data.debug && data.debug.codigo) {
          console.log('🔐 Nuevo código de desarrollo:', data.debug.codigo);
        }
      } else {
        setMensajeError(data.error || 'Error al reenviar el código');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setMensajeError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  // Volver al paso anterior
  const handleVolver = () => {
    if (pasoActual === 1) {
      window.history.back();
    } else {
      setPasoActual(pasoActual - 1);
      setMensajeError('');
      setMensajeExito('');
      // Limpiar información del usuario al volver
      if (pasoActual === 3) {
        setUsuarioInfo(null);
      }
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMostrarPassword = () => {
    setMostrarPassword(!mostrarPassword);
  };

  const toggleMostrarConfirmarPassword = () => {
    setMostrarConfirmarPassword(!mostrarConfirmarPassword);
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
    success: '#10B981',
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
    success: '#059669',
    card: '#FFFFFF',
    inputBackground: '#F9FAFB',
  };

  // Textos según el paso
  const getTitulo = () => {
    switch (pasoActual) {
      case 1: return 'Recuperar Contraseña';
      case 2: return 'Verificar Código';
      case 3: return 'Nueva Contraseña';
      default: return 'Recuperar Contraseña';
    }
  };

  const getSubtitulo = () => {
    switch (pasoActual) {
      case 1: return 'Ingresa tu correo para recibir un código de verificación';
      case 2: return `Ingresa el código de 6 dígitos enviado a ${formData.email}`;
      case 3: return usuarioInfo 
        ? `Creando nueva contraseña para ${usuarioInfo.nombre || usuarioInfo.username}`
        : 'Crea una nueva contraseña para tu cuenta';
      default: return 'Recupera el acceso a tu cuenta';
    }
  };

  return (
    <div 
      className="recuperacion-overlay" 
      style={{ backgroundColor: colors.background }}
    >
      <div className="recuperacion-container">
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
              onClick={handleVolver}
              style={{ color: colors.primary }}
              disabled={cargando}
            >
              ←
            </button>
            <div className="header-center">
              <h1 
                className={`title title-${screenSize}`}
                style={{ color: colors.text }}
              >
                {getTitulo()}
              </h1>
            </div>
            <button 
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              style={{ color: colors.primary }}
              disabled={cargando}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Indicador de pasos */}
          <div className="pasos-container">
            {[1, 2, 3].map((paso) => (
              <div key={paso} className="paso-linea">
                <div 
                  className="paso-circulo"
                  style={{ 
                    backgroundColor: paso <= pasoActual ? colors.primary : colors.border,
                    borderColor: paso <= pasoActual ? colors.primary : colors.border
                  }}
                >
                  <span 
                    className="paso-texto"
                    style={{ color: paso <= pasoActual ? '#FFFFFF' : colors.textMuted }}
                  >
                    {paso}
                  </span>
                </div>
                {paso < 3 && (
                  <div 
                    className="paso-conector"
                    style={{ backgroundColor: paso < pasoActual ? colors.primary : colors.border }}
                  />
                )}
              </div>
            ))}
          </div>

          <p 
            className={`subtitle subtitle-${screenSize}`}
            style={{ color: colors.textSecondary }}
          >
            {getSubtitulo()}
          </p>

          {mensajeError && (
            <div 
              className="error-container" 
              style={{ backgroundColor: colors.danger + '15' }}
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

          {mensajeExito && (
            <div 
              className="exito-container" 
              style={{ backgroundColor: colors.success + '15' }}
            >
              <span className="exito-icon">✅</span>
              <span 
                className="exito-text" 
                style={{ color: colors.success }}
              >
                {mensajeExito}
              </span>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className="recuperacion-form">
            {/* Paso 1: Email */}
            {pasoActual === 1 && (
              <input
                type="email"
                placeholder="Correo electrónico"
                className={`input input-${screenSize}`}
                style={{ 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={cargando}
                autoComplete="email"
                required
              />
            )}

            {/* Paso 2: Código */}
            {pasoActual === 2 && (
              <>
                <input
                  ref={codigoRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Código de 6 dígitos"
                  className={`input input-${screenSize}`}
                  style={{ 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  value={formData.codigo}
                  onChange={(e) => {
                    // Solo permitir números y máximo 6 dígitos
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    handleInputChange('codigo', value);
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={cargando}
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />
                
                <button
                  type="button"
                  className="reenviar-button"
                  onClick={handleReenviarCodigo}
                  disabled={cargando || tiempoReenvio > 0}
                  style={{ 
                    color: tiempoReenvio > 0 ? colors.textMuted : colors.primary,
                    cursor: tiempoReenvio > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {tiempoReenvio > 0 
                    ? `Reenviar en ${tiempoReenvio}s` 
                    : '¿No recibiste el código? Reenviar'
                  }
                </button>
              </>
            )}

            {/* Paso 3: Nueva contraseña */}
            {pasoActual === 3 && (
              <>
                <div className="password-strength-info" style={{ color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                  La contraseña debe tener al menos 6 caracteres
                </div>
                
                <div className="password-container">
                  <input
                    ref={nuevaPasswordRef}
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Nueva contraseña"
                    className={`input password-input input-${screenSize}`}
                    style={{ 
                      backgroundColor: colors.inputBackground,
                      borderColor: formData.nuevaPassword.length > 0 && formData.nuevaPassword.length < 6 ? colors.danger : colors.border,
                      color: colors.text
                    }}
                    value={formData.nuevaPassword}
                    onChange={(e) => handleInputChange('nuevaPassword', e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={cargando}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={toggleMostrarPassword}
                    disabled={cargando}
                    style={{ color: colors.textMuted }}
                  >
                    {mostrarPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                <div className="password-container">
                  <input
                    ref={confirmarPasswordRef}
                    type={mostrarConfirmarPassword ? "text" : "password"}
                    placeholder="Confirmar nueva contraseña"
                    className={`input password-input input-${screenSize}`}
                    style={{ 
                      backgroundColor: colors.inputBackground,
                      borderColor: formData.confirmarPassword.length > 0 && formData.nuevaPassword !== formData.confirmarPassword ? colors.danger : colors.border,
                      color: colors.text
                    }}
                    value={formData.confirmarPassword}
                    onChange={(e) => handleInputChange('confirmarPassword', e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={cargando}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={toggleMostrarConfirmarPassword}
                    disabled={cargando}
                    style={{ color: colors.textMuted }}
                  >
                    {mostrarConfirmarPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {formData.confirmarPassword.length > 0 && formData.nuevaPassword !== formData.confirmarPassword && (
                  <div style={{ color: colors.danger, fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Las contraseñas no coinciden
                  </div>
                )}
              </>
            )}

            {/* Botón principal */}
            <button
              type="button"
              className={`button button-${screenSize} ${cargando ? 'button-disabled' : ''}`}
              style={{ 
                backgroundColor: cargando ? colors.textMuted : colors.primary,
                boxShadow: cargando ? 'none' : `0 4px 8px ${colors.primary}30`
              }}
              onClick={
                pasoActual === 1 ? handleSolicitarCodigo :
                pasoActual === 2 ? handleVerificarCodigo :
                handleCambiarPassword
              }
              disabled={cargando || 
                (pasoActual === 3 && (
                  formData.nuevaPassword !== formData.confirmarPassword ||
                  formData.nuevaPassword.length < 6
                ))
              }
            >
              {cargando ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <span className={`button-text button-text-${screenSize}`}>
                    {pasoActual === 1 ? 'Enviando código...' :
                     pasoActual === 2 ? 'Verificando...' : 'Cambiando contraseña...'}
                  </span>
                </div>
              ) : (
                <>
                  <span className="button-icon">
                    {pasoActual === 1 ? '📧' :
                     pasoActual === 2 ? '🔑' : '🔒'}
                  </span>
                  <span className={`button-text button-text-${screenSize}`}>
                    {pasoActual === 1 ? 'Enviar Código' :
                     pasoActual === 2 ? 'Verificar Código' : 'Cambiar Contraseña'}
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
            style={{ borderColor: colors.primary }}
            onClick={() => window.location.href = '/login'}
            disabled={cargando}
          >
            <span 
              className={`secondary-button-text secondary-button-text-${screenSize}`}
              style={{ color: colors.text }}
            >
              Volver al inicio de sesión
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}