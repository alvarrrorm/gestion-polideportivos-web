import React, { useState, useRef, useEffect } from 'react';
import './Registro.css';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    usuario: '',
    dni: '',
    telefono: '',
    pass: '',
    pass_2: ''
  });
  const [mensajeError, setMensajeError] = useState('');
  const [aceptoPoliticas, setAceptoPoliticas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [screenSize, setScreenSize] = useState('medium');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Referencias
  const correoRef = useRef();
  const usuarioRef = useRef();
  const dniRef = useRef();
  const telefonoRef = useRef();
  const passRef = useRef();
  const pass2Ref = useRef();

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

  // Función para navegar al siguiente campo
  const focusNextField = (nextRef) => {
    if (nextRef && nextRef.current) {
      nextRef.current.focus();
    }
  };

  // Handler único para todos los campos
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler especial para teléfono
  const handleTelefonoChange = (value) => {
    const soloNumeros = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      telefono: soloNumeros
    }));
  };

  // Manejar submit con Enter
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef) {
        focusNextField(nextRef);
      } else {
        handleRegister();
      }
    }
  };

  // Manejar el registro del usuario
  const handleRegister = async () => {
    setCargando(true);
    setMensajeError('');

    const { nombre, correo, usuario, dni, pass, pass_2, telefono } = formData;
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validaciones
    if (!nombre || !correo || !usuario || !dni || !pass || !pass_2) {
      setMensajeError('Por favor, completa todos los campos');
      setCargando(false);
      return;
    }

    if (!correoValido.test(correo)) {
      setMensajeError('Correo electrónico no válido');
      setCargando(false);
      return;
    }

    if (pass !== pass_2) {
      setMensajeError('Las contraseñas no coinciden');
      setCargando(false);
      return;
    }

    if (!aceptoPoliticas) {
      setMensajeError('Debes aceptar las políticas de privacidad');
      setCargando(false);
      return;
    }

    try {
      const response = await fetch('https://tfgv2-production.up.railway.app/api/registro', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          nombre, 
          correo, 
          usuario, 
          dni, 
          pass,
          pass_2,  
          telefono
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMensajeError('');
        alert('Éxito: Usuario registrado con éxito');
        
        // Limpiar formulario
        setFormData({
          nombre: '',
          correo: '',
          usuario: '',
          dni: '',
          telefono: '',
          pass: '',
          pass_2: ''
        });
        setAceptoPoliticas(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
        
        // Navegar al login
        window.location.href = '/login';
      } else {
        setMensajeError(data.error || 'Error al registrar el usuario');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMensajeError('No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  // Navegar a las políticas de privacidad
  const navigateToPoliticas = () => {
    window.open('https://drive.google.com/file/d/1wJ_KyccZQE6VPjGLy8ThGCvXFj2OrhoC/view?usp=sharing', '_blank');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Toggle mostrar/ocultar contraseña
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
      className="registro-overlay" 
      style={{ backgroundColor: colors.background }}
    >
      <div className="registro-container">
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
              onClick={() => window.history.back()}
              style={{ color: colors.primary }}
            >
              ←
            </button>
            <div className="header-center">
              <h1 
                className={`title title-${screenSize}`}
                style={{ color: colors.text }}
              >
                Crear cuenta
              </h1>
            </div>
            <button 
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              style={{ color: colors.primary }}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <p 
            className={`subtitle subtitle-${screenSize}`}
            style={{ color: colors.textSecondary }}
          >
            Únete a Depo
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

          <form onSubmit={(e) => e.preventDefault()} className="registro-form">
            <input
              type="text"
              placeholder="Nombre completo"
              className={`input input-${screenSize}`}
              style={{ 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text
              }}
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, correoRef)}
              disabled={cargando}
              autoComplete="name"
              required
            />
            
            <input
              ref={correoRef}
              type="email"
              placeholder="Correo electrónico"
              className={`input input-${screenSize}`}
              style={{ 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text
              }}
              value={formData.correo}
              onChange={(e) => handleInputChange('correo', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, usuarioRef)}
              disabled={cargando}
              autoComplete="email"
              required
            />

            <input
              ref={usuarioRef}
              type="text"
              placeholder="Nombre de usuario"
              className={`input input-${screenSize}`}
              style={{ 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text
              }}
              value={formData.usuario}
              onChange={(e) => handleInputChange('usuario', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, dniRef)}
              disabled={cargando}
              autoComplete="username"
              required
            />
            
            <input
              ref={dniRef}
              type="text"
              placeholder="DNI (Ejemplo: 12345678Z)"
              className={`input input-${screenSize}`}
              style={{ 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text
              }}
              value={formData.dni}
              onChange={(e) => handleInputChange('dni', e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, telefonoRef)}
              disabled={cargando}
              autoComplete="off"
              required
            />
            
            <input
              ref={telefonoRef}
              type="tel"
              placeholder="Número de Teléfono"
              className={`input input-${screenSize}`}
              style={{ 
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text
              }}
              value={formData.telefono}
              onChange={(e) => handleTelefonoChange(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, passRef)}
              disabled={cargando}
              autoComplete="tel"
              maxLength="15"
            />

            {/* Contraseña con botón ojo */}
            <div className="password-input-container">
              <input
                ref={passRef}
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                className={`input input-${screenSize} password-input`}
                style={{ 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                  paddingRight: '45px'
                }}
                value={formData.pass}
                onChange={(e) => handleInputChange('pass', e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, pass2Ref)}
                disabled={cargando}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={toggleShowPassword}
                disabled={cargando}
                style={{ color: colors.textMuted }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {/* Confirmar Contraseña con botón ojo */}
            <div className="password-input-container">
              <input
                ref={pass2Ref}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repetir contraseña"
                className={`input input-${screenSize} password-input`}
                style={{ 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                  paddingRight: '45px'
                }}
                value={formData.pass_2}
                onChange={(e) => handleInputChange('pass_2', e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, null)}
                disabled={cargando}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={toggleShowConfirmPassword}
                disabled={cargando}
                style={{ color: colors.textMuted }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="checkbox-container">
              <button
                type="button"
                className="checkbox"
                onClick={() => !cargando && setAceptoPoliticas(!aceptoPoliticas)}
                disabled={cargando}
              >
                <div 
                  className={`checkbox-icon ${aceptoPoliticas ? 'checkbox-checked' : ''}`}
                  style={{ 
                    borderColor: colors.border,
                    backgroundColor: aceptoPoliticas ? colors.primary : 'transparent'
                  }}
                >
                  {aceptoPoliticas && (
                    <span className="checkbox-checkmark">✓</span>
                  )}
                </div>
                <span className="checkbox-text" style={{ color: colors.text }}>
                  Acepto las{' '}
                  <button
                    type="button"
                    className="politicas-link"
                    onClick={navigateToPoliticas}
                    style={{ color: colors.primary }}
                  >
                    políticas de privacidad
                  </button>
                </span>
              </button>
            </div>

            <button
              type="submit"
              className={`button button-${screenSize} ${cargando ? 'button-disabled' : ''}`}
              style={{ 
                backgroundColor: colors.primary,
                boxShadow: `0 4px 8px ${colors.primary}30`
              }}
              onClick={handleRegister}
              disabled={cargando}
            >
              {cargando ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <span className={`button-text button-text-${screenSize}`}>
                    Registrando...
                  </span>
                </div>
              ) : (
                <>
                  <span className="button-icon">👤</span>
                  <span className={`button-text button-text-${screenSize}`}>
                    Crear Cuenta
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
              ¿Ya tienes cuenta?{' '}
              <span style={{ color: colors.primary, fontWeight: '600' }}>Inicia sesión</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}