import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthProvider';
import Ionicons from './Ionicons';
import './Selector.css';
import { jwtDecode } from 'jwt-decode';

export default function Selector() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [hoverStates, setHoverStates] = useState({
    reserve: false,
    admin: false,
    logout: false,
    myReservations: false
  });

  const [darkMode, setDarkMode] = useState(false);
  const [screenSize, setScreenSize] = useState('large');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [usuarioCompleto, setUsuarioCompleto] = useState(null);

  // DEBUG: Mostrar información del usuario
  useEffect(() => {
    console.log('🔍 DEBUG SELECTOR - Estado inicial:');
    
    // Intentar obtener datos del usuario desde localStorage primero
    try {
      const storedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('1. Usuario desde localStorage:', parsedUser);
        
        // Si hay token, decodificarlo para obtener información adicional
        if (token) {
          try {
            const decoded = jwtDecode(token);
            console.log('2. Token decodificado:', decoded);
            
            // Combinar datos del token con los de localStorage
            const combinedUser = {
              ...parsedUser,
              ...decoded, // Datos del token
              ...user // Datos del contexto como respaldo
            };
            
            console.log('3. Usuario combinado:', combinedUser);
            setUsuarioCompleto(combinedUser);
          } catch (e) {
            console.log('2. Error decodificando token:', e);
            setUsuarioCompleto({ ...parsedUser, ...user });
          }
        } else {
          setUsuarioCompleto({ ...parsedUser, ...user });
        }
      } else {
        console.log('1. No hay usuario en localStorage');
        setUsuarioCompleto(user);
      }
    } catch (error) {
      console.error('Error procesando datos:', error);
      setUsuarioCompleto(user);
    }
    
    console.log('4. User del AuthContext:', user);
  }, [user]);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 768) setScreenSize('mobile');
      else if (width <= 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('❌ Usuario no autenticado. Redirigiendo a login...');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Obtener datos del usuario de forma segura
  const obtenerDatosUsuario = () => {
    // Usar usuarioCompleto si está disponible, sino usar user
    const usuarioActual = usuarioCompleto || user;
    
    const nombre = usuarioActual?.nombre || usuarioActual?.usuario || 'Usuario';
    // Asegurarse de que el rol esté en minúsculas para comparaciones
    const rol = (usuarioActual?.rol || 'usuario').toLowerCase();
    const polideportivoId = usuarioActual?.polideportivo_id;
    
    console.log('🎯 Información del usuario para render:', {
      nombre,
      rol,
      polideportivoId,
      usuarioActual
    });
    
    return { nombre, rol, polideportivoId, usuarioActual };
  };

  const { nombre: usuario, rol, polideportivoId, usuarioActual } = obtenerDatosUsuario();

  // ✅ VERIFICACIÓN CORREGIDA DE ROLES - USANDO DATOS REALES
  const esSuperAdmin = rol === 'super_admin';
  const esAdminPoli = rol === 'admin_poli';
  const esAdminGeneral = rol === 'admin';
  const esAdmin = esSuperAdmin || esAdminPoli || esAdminGeneral;
  const tienePolideportivo = !!polideportivoId;

  // Debug de roles
  console.log('🔐 Verificación de roles:', {
    rol,
    esSuperAdmin,
    esAdminPoli,
    esAdminGeneral,
    esAdmin,
    tienePolideportivo,
    polideportivoId
  });

  // Colores para modo oscuro
  const colors = darkMode ? {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#334155',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    card: '#1E293B',
    header: '#1E293B',
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalBackground: '#1E293B'
  } : {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceLight: '#F1F5F9',
    primary: '#4F46E5',
    primaryLight: '#6366F1',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    card: '#FFFFFF',
    header: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#FFFFFF'
  };

  const handleHover = (key, value) => {
    setHoverStates(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    console.log('🚪 Cerrando sesión...');
    
    setShowLogoutConfirm(false);
    
    try {
      await logout();
      console.log('✅ Sesión cerrada exitosamente');
      
      setTimeout(() => {
        navigate('/login');
      }, 100);
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      navigate('/login');
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
    console.log('❌ Cierre de sesión cancelado');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const isMobile = screenSize === 'mobile';

  // 👇 FUNCIÓN MEJORADA PARA REDIRIGIR AL PANEL CORRECTO
  const handleAdminClick = () => {
    console.log('🎯 Click en admin. Datos completos:', {
      rol,
      esSuperAdmin,
      esAdminPoli,
      esAdminGeneral,
      polideportivoId,
      tienePolideportivo,
      usuarioCompleto
    });
    
    // Verificar datos del usuario desde múltiples fuentes
    const userDataSources = [
      usuarioCompleto,
      user,
      JSON.parse(localStorage.getItem('auth_user') || '{}')
    ];
    
    let rolFinal = rol;
    let polideportivoIdFinal = polideportivoId;
    
    // Buscar en todas las fuentes
    for (const source of userDataSources) {
      if (source?.rol) {
        rolFinal = source.rol.toLowerCase();
        if (source.polideportivo_id) {
          polideportivoIdFinal = source.polideportivo_id;
        }
        break;
      }
    }
    
    console.log('🔎 Datos finales para redirección:', {
      rolFinal,
      polideportivoIdFinal
    });
    
    // Lógica de redirección mejorada
    if (rolFinal === 'super_admin') {
      console.log('➡️  Redirigiendo a /admin (Super Admin)');
      navigate('/admin');
    } else if (rolFinal === 'admin_poli' && polideportivoIdFinal) {
      console.log('➡️  Redirigiendo a /admin-poli (Admin con polideportivo ID:', polideportivoIdFinal, ')');
      navigate('/admin-poli');
    } else if (rolFinal === 'admin_poli' && !polideportivoIdFinal) {
      console.log('⚠️  Admin_poli sin polideportivo asignado');
      // Si es admin_poli sin polideportivo, redirigir a admin general
      navigate('/admin');
    } else if (rolFinal === 'admin') {
      console.log('➡️  Redirigiendo a /admin (Admin General)');
      navigate('/admin');
    } else {
      console.log('⚠️  Usuario no tiene acceso admin');
      alert('No tienes permisos de administrador');
    }
  };

  // Obtener texto del rol para mostrar
  const obtenerTextoRol = () => {
    if (esSuperAdmin) return 'Super Administrador';
    if (esAdminPoli) {
      if (tienePolideportivo) {
        return 'Administrador Polideportivo';
      }
      return 'Administrador Polideportivo (sin asignar)';
    }
    if (esAdminGeneral) return 'Administrador';
    return 'Usuario';
  };

  // Obtener color del rol
  const obtenerColorRol = () => {
    if (esSuperAdmin) return colors.success;
    if (esAdminPoli) {
      if (tienePolideportivo) {
        return colors.warning;
      }
      return colors.textMuted;
    }
    if (esAdminGeneral) return colors.primary;
    return colors.textSecondary;
  };

  // Obtener icono según el tipo de admin
  const obtenerIconoAdmin = () => {
    if (esSuperAdmin) return "shield-checkmark-outline";
    if (esAdminPoli && tienePolideportivo) {
      return "business-outline";
    }
    if (esAdminPoli && !tienePolideportivo) {
      return "alert-circle-outline";
    }
    return "shield-outline";
  };

  // Obtener texto para el botón de admin
  const obtenerTextoBotonAdmin = () => {
    if (esSuperAdmin) return 'Panel Super Admin';
    if (esAdminPoli) {
      if (tienePolideportivo) {
        return 'Mi Polideportivo';
      }
      return 'Seleccionar Polideportivo';
    }
    return 'Panel Admin';
  };

  // Obtener subtítulo para el botón de admin
  const obtenerSubtituloBotonAdmin = () => {
    if (esSuperAdmin) return 'Gestión completa del sistema';
    if (esAdminPoli) {
      if (tienePolideportivo) {
        return `Gestionar polideportivo ID: ${polideportivoId}`;
      }
      return 'Selecciona un polideportivo para gestionar';
    }
    return 'Gestionar sistema';
  };

  // 👇 MODAL DE CONFIRMACIÓN DE LOGOUT
  const LogoutConfirmModal = () => {
    if (!showLogoutConfirm) return null;

    return (
      <div 
        className="modal-overlay" 
        style={{ backgroundColor: colors.overlay }}
        onClick={cancelLogout}
      >
        <div 
          className="logout-modal" 
          style={{ backgroundColor: colors.modalBackground }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-icon" style={{ color: colors.danger }}>
            <Ionicons name="log-out-outline" size={48} />
          </div>
          
          <h2 className="modal-title" style={{ color: colors.text }}>
            ¿Cerrar Sesión?
          </h2>
          
          <p className="modal-message" style={{ color: colors.textSecondary }}>
            ¿Estás seguro de que quieres salir de tu cuenta?
            {usuario && `\nSesión actual: ${usuario}`}
            {rol && `\nRol: ${obtenerTextoRol()}`}
            {polideportivoId && `\nPolideportivo asignado: ${polideportivoId}`}
          </p>
          
          <div className="modal-actions">
            <button 
              className="modal-cancel-btn"
              onClick={cancelLogout}
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              <Ionicons name="close-outline" size={18} />
              Cancelar
            </button>
            
            <button 
              className="modal-confirm-btn"
              onClick={confirmLogout}
              style={{
                backgroundColor: colors.danger,
                color: '#FFFFFF'
              }}
            >
              <Ionicons name="checkmark-outline" size={18} />
              Sí, Cerrar Sesión
            </button>
          </div>
          
          <div className="modal-note" style={{ color: colors.textMuted }}>
            ⚠️ Se perderá el acceso hasta que vuelvas a iniciar sesión
          </div>
        </div>
      </div>
    );
  };

  // ========== UI PARA MÓVIL ==========
  const MobileUI = () => (
    <div className="mobile-container" style={{ backgroundColor: colors.background }}>
      {/* MODAL DE CONFIRMACIÓN */}
      <LogoutConfirmModal />
      
      {/* Header Móvil */}
      <div className="mobile-header" style={{ backgroundColor: colors.primary }}>
        <div>
          <div className="mobile-welcome" style={{ color: colors.text }}>
            Hola, {usuario}
          </div>
          <div className="mobile-subtitle" style={{ color: obtenerColorRol() }}>
            {obtenerTextoRol()}
          </div>
        </div>
        <div className="mobile-header-right">
          <button 
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
          >
            <Ionicons 
              name={darkMode ? "sunny" : "moon"} 
              size={22} 
              color={colors.text} 
            />
          </button>
          <button 
            className="mobile-logout"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <Ionicons name="exit-outline" size={24} color={colors.text} />
          </button>
        </div>
      </div>

      <div className="mobile-scroll">
        <div className="mobile-scroll-content">
          {/* Tarjeta Principal Móvil */}
          <div className="mobile-main-card" style={{ backgroundColor: colors.card }}>
            <div className="mobile-card-title" style={{ color: colors.text }}>
              Acciones Disponibles
            </div>
            
            {/* ✅ BOTÓN ADMIN - SOLO PARA ADMIN */}
            {esAdmin && (
              <button 
                className="mobile-action-btn"
                style={{ 
                  backgroundColor: esSuperAdmin ? colors.success : 
                                  (tienePolideportivo ? colors.warning : colors.primary)
                }}
                onClick={handleAdminClick}
              >
                <Ionicons name={obtenerIconoAdmin()} size={28} color="#fff" />
                <div className="mobile-btn-text">
                  <div className="mobile-btn-title">
                    {obtenerTextoBotonAdmin()}
                  </div>
                  <div className="mobile-btn-subtitle">
                    {obtenerSubtituloBotonAdmin()}
                  </div>
                </div>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </button>
            )}

            <button 
              className="mobile-action-btn"
              style={{ backgroundColor: colors.primary }}
              onClick={() => navigate('/crear-reserva')}
            >
              <Ionicons name="calendar-outline" size={28} color="#fff" />
              <div className="mobile-btn-text">
                <div className="mobile-btn-title">Nueva Reserva</div>
                <div className="mobile-btn-subtitle">Reservar pista</div>
              </div>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </button>

            <button 
              className="mobile-action-btn"
              style={{ backgroundColor: '#8B5CF6' }}
              onClick={() => navigate('/mis-reservas')}
            >
              <Ionicons name="list-outline" size={28} color="#fff" />
              <div className="mobile-btn-text">
                <div className="mobile-btn-title">Mis Reservas</div>
                <div className="mobile-btn-subtitle">Ver mis reservas</div>
              </div>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </button>
          </div>

          {/* 👇 NUEVA SECCIÓN INFORMATIVA PARA MÓVIL */}
          <div className="info-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: colors.card, borderRadius: '10px' }}>
            <h3 style={{ color: colors.text, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              ¿Cómo hacer una reserva?
            </h3>
            
            <div style={{ color: colors.textSecondary, fontSize: '14px', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: colors.text }}>Paso 1:</strong> Selecciona "Nueva Reserva" para comenzar.
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: colors.text }}>Paso 2:</strong> Elige el polideportivo y la fecha deseada.
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: colors.text }}>Paso 3:</strong> Selecciona el tipo de pista y el horario.
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: colors.text }}>Paso 4:</strong> Confirma tu reserva y revisa el precio.
              </p>
              <p>
                <strong style={{ color: colors.text }}>Paso 5:</strong> Recibirás un email de confirmación.
              </p>
              
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: colors.surfaceLight, borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: colors.text }}>
                  💡 <strong>Consejo:</strong> Reserva con antelación para asegurar disponibilidad.
                </p>
              </div>
            </div>
          </div>

          {/* 👇 SECCIÓN DE ACTIVIDAD RECIENTE (ejemplo) */}
          <div className="info-section" style={{ marginTop: '15px', padding: '15px', backgroundColor: colors.card, borderRadius: '10px' }}>
            <h3 style={{ color: colors.text, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ionicons name="time-outline" size={24} color={colors.warning} />
              Tu actividad
            </h3>
            
            <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '8px', backgroundColor: colors.surfaceLight, borderRadius: '6px' }}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} style={{ marginRight: '10px' }} />
                <div>
                  <div style={{ color: colors.text, fontSize: '13px' }}>Sesión iniciada correctamente</div>
                  <div style={{ fontSize: '12px' }}>Hoy, {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              
              <p style={{ margin: 0, fontSize: '13px' }}>
                Bienvenido de nuevo. Puedes empezar a reservar pistas cuando quieras.
              </p>
            </div>
          </div>

          {/* Sección Debug para desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mobile-debug-card" style={{ backgroundColor: colors.card, marginTop: '15px' }}>
              <div className="mobile-card-title" style={{ color: colors.text }}>
                Información Debug
              </div>
              <div className="debug-info" style={{ color: colors.textSecondary, fontSize: '12px' }}>
                <div>Rol: <strong>{rol}</strong></div>
                <div>Es Admin: <strong>{esAdmin ? 'Sí' : 'No'}</strong></div>
                <div>Polideportivo ID: <strong>{polideportivoId || 'Ninguno'}</strong></div>
                <div>Botón Admin visible: <strong>{esAdmin ? 'Sí' : 'No'}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ========== UI PARA WEB ==========
  const WebUI = () => (
    <div className="web-container" style={{ backgroundColor: colors.background }}>
      {/* MODAL DE CONFIRMACIÓN */}
      <LogoutConfirmModal />
      
      {/* Header Web */}
      <header 
        className="web-header" 
        style={{ 
          backgroundColor: colors.header, 
          borderBottomColor: colors.border 
        }}
      >
        <div className="web-header-content">
          <div className="web-header-left">
            <div 
              className="avatar" 
              style={{ 
                backgroundColor: esSuperAdmin ? colors.success : 
                               (tienePolideportivo ? colors.warning : 
                               esAdmin ? colors.primary : colors.primary)
              }}
            >
              <div className="avatar-text">
                {usuario?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <div>
              <div className="web-welcome" style={{ color: colors.text }}>
                Hola, {usuario}
              </div>
              <div className="web-role" style={{ color: obtenerColorRol() }}>
                {obtenerTextoRol()}
              </div>
            </div>
          </div>
          
          <div className="web-header-right">
            {/* Toggle Modo Oscuro */}
            <button 
              className="web-dark-mode-toggle"
              onClick={toggleDarkMode}
              onMouseEnter={() => handleHover('darkMode', true)}
              onMouseLeave={() => handleHover('darkMode', false)}
            >
              <Ionicons 
                name={darkMode ? "sunny" : "moon"} 
                size={20} 
                color={colors.textSecondary} 
              />
              <div className="dark-mode-text" style={{ color: colors.textSecondary }}>
                {darkMode ? 'Claro' : 'Oscuro'}
              </div>
            </button>

            <button 
              className={`web-header-button ${hoverStates.reserve ? 'hovered' : ''}`}
              style={{ 
                backgroundColor: hoverStates.reserve ? colors.surfaceLight : 'transparent' 
              }}
              onClick={() => navigate('/crear-reserva')}
              onMouseEnter={() => handleHover('reserve', true)}
              onMouseLeave={() => handleHover('reserve', false)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <div className="web-header-button-text" style={{ color: colors.text }}>
                Nueva Reserva
              </div>
            </button>

            <button 
              className={`web-header-button ${hoverStates.myReservations ? 'hovered' : ''}`}
              style={{ 
                backgroundColor: hoverStates.myReservations ? colors.surfaceLight : 'transparent' 
              }}
              onClick={() => navigate('/mis-reservas')}
              onMouseEnter={() => handleHover('myReservations', true)}
              onMouseLeave={() => handleHover('myReservations', false)}
            >
              <Ionicons name="list-outline" size={20} color={colors.textSecondary} />
              <div className="web-header-button-text" style={{ color: colors.text }}>
                Mis Reservas
              </div>
            </button>

            {/* ✅ BOTÓN ADMIN - SOLO PARA ADMIN */}
            {esAdmin && (
              <button 
                className={`web-header-button ${hoverStates.admin ? 'hovered' : ''}`}
                style={{ 
                  backgroundColor: hoverStates.admin ? colors.surfaceLight : 'transparent' 
                }}
                onClick={handleAdminClick}
                onMouseEnter={() => handleHover('admin', true)}
                onMouseLeave={() => handleHover('admin', false)}
              >
                <Ionicons 
                  name={obtenerIconoAdmin()} 
                  size={20} 
                  color={esSuperAdmin ? colors.success : 
                         (tienePolideportivo ? colors.warning : colors.primary)} 
                />
                <div className="web-header-button-text" style={{ color: colors.text }}>
                  {obtenerTextoBotonAdmin()}
                </div>
              </button>
            )}

            <button 
              className="web-header-button logout-button"
              style={{ backgroundColor: colors.surfaceLight }}
              onClick={handleLogout}
              onMouseEnter={() => handleHover('logout', true)}
              onMouseLeave={() => handleHover('logout', false)}
            >
              <Ionicons name="exit-outline" size={20} color={colors.danger} />
              <div 
                className="web-header-button-text logout-button-text" 
                style={{ color: colors.danger }}
              >
                Cerrar Sesión
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Web */}
      <div className="web-content-wrapper">
        <main className="web-main">
          <div className="web-title-section">
            <h1 className="web-title" style={{ color: colors.text }}>
              Panel de Control
            </h1>
            <div className="web-subtitle" style={{ color: obtenerColorRol() }}>
              {obtenerTextoRol()}
            </div>
          </div>

          <div className="web-grid">
            {/* Card Reserva Rápida */}
            <div 
              className="web-card quick-reserve-card" 
              style={{ 
                backgroundColor: colors.card,
                borderTopColor: colors.primary 
              }}
            >
              <Ionicons name="calendar" size={48} color={colors.primary} />
              <div className="web-card-title" style={{ color: colors.text }}>
                Reserva Rápida
              </div>
              <div className="web-card-desc" style={{ color: colors.textSecondary }}>
                Reserva una pista en pocos clicks
              </div>
              <button 
                className="web-primary-btn"
                style={{ backgroundColor: colors.primary }}
                onClick={() => navigate('/crear-reserva')}
                onMouseEnter={() => handleHover('reserve', true)}
                onMouseLeave={() => handleHover('reserve', false)}
              >
                <div className="web-primary-btn-text">Nueva Reserva</div>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </button>
            </div>

            {/* Card Mis Reservas */}
            <div 
              className="web-card my-reservations-card" 
              style={{ 
                backgroundColor: colors.card,
                borderTopColor: '#8B5CF6'
              }}
            >
              <Ionicons name="list" size={48} color="#8B5CF6" />
              <div className="web-card-title" style={{ color: colors.text }}>
                Mis Reservas
              </div>
              <div className="web-card-desc" style={{ color: colors.textSecondary }}>
                Gestiona tus reservas activas
              </div>
              <button 
                className="web-secondary-btn"
                style={{ borderColor: colors.border }}
                onClick={() => navigate('/mis-reservas')}
              >
                <div 
                  className="web-secondary-btn-text" 
                  style={{ color: colors.textSecondary }}
                >
                  Ver Reservas
                </div>
              </button>
            </div>

            {/* ✅ CARD ADMIN - SOLO PARA ADMIN */}
            {esAdmin && (
              <div 
                className="web-card admin-card" 
                style={{ 
                  backgroundColor: colors.card,
                  borderTopColor: esSuperAdmin ? colors.success : 
                                 (tienePolideportivo ? colors.warning : colors.primary)
                }}
              >
                <Ionicons 
                  name={obtenerIconoAdmin()} 
                  size={48} 
                  color={esSuperAdmin ? colors.success : 
                         (tienePolideportivo ? colors.warning : colors.primary)} 
                />
                <div className="web-card-title" style={{ color: colors.text }}>
                  {obtenerTextoBotonAdmin()}
                </div>
                <div className="web-card-desc" style={{ color: colors.textSecondary }}>
                  {obtenerSubtituloBotonAdmin()}
                </div>
                <button 
                  className="web-secondary-btn"
                  style={{ borderColor: colors.border }}
                  onClick={handleAdminClick}
                >
                  <div 
                    className="web-secondary-btn-text" 
                    style={{ color: colors.textSecondary }}
                  >
                    Acceder
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 👇 NUEVA SECCIÓN INFORMATIVA PARA WEB - Debajo de las tarjetas */}
          <div style={{ 
            marginTop: '30px', 
            backgroundColor: colors.card, 
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              color: colors.text, 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Ionicons name="information-circle" size={28} color={colors.primary} />
              Guía para hacer una reserva
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px',
              marginBottom: '25px'
            }}>
              {/* Paso 1 */}
              <div style={{ 
                backgroundColor: colors.surfaceLight, 
                padding: '20px', 
                borderRadius: '8px',
                borderLeft: `4px solid ${colors.primary}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: colors.primary,
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}>
                    1
                  </div>
                  <h4 style={{ color: colors.text, margin: 0 }}>Inicia una nueva reserva</h4>
                </div>
                <p style={{ color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
                  Haz clic en "Nueva Reserva" para comenzar el proceso. Selecciona el polideportivo donde deseas jugar.
                </p>
              </div>

              {/* Paso 2 */}
              <div style={{ 
                backgroundColor: colors.surfaceLight, 
                padding: '20px', 
                borderRadius: '8px',
                borderLeft: `4px solid ${colors.primaryLight}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: colors.primaryLight,
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}>
                    2
                  </div>
                  <h4 style={{ color: colors.text, margin: 0 }}>Selecciona fecha y hora</h4>
                </div>
                <p style={{ color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
                  Elige el día y el horario que mejor se adapte a tus necesidades. Consulta la disponibilidad en tiempo real.
                </p>
              </div>

              {/* Paso 3 */}
              <div style={{ 
                backgroundColor: colors.surfaceLight, 
                padding: '20px', 
                borderRadius: '8px',
                borderLeft: `4px solid ${colors.success}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: colors.success,
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}>
                    3
                  </div>
                  <h4 style={{ color: colors.text, margin: 0 }}>Elige tu pista</h4>
                </div>
                <p style={{ color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
                  Selecciona el tipo de pista (tenis, pádel, fútbol, etc.) que deseas reservar según tus preferencias.
                </p>
              </div>

              {/* Paso 4 */}
              <div style={{ 
                backgroundColor: colors.surfaceLight, 
                padding: '20px', 
                borderRadius: '8px',
                borderLeft: `4px solid ${colors.warning}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: colors.warning,
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}>
                    4
                  </div>
                  <h4 style={{ color: colors.text, margin: 0 }}>Confirma y paga</h4>
                </div>
                <p style={{ color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
                  Revisa los detalles, confirma tu reserva y procede al pago. Recibirás un email de confirmación.
                </p>
              </div>
            </div>

            {/* 👇 SECCIÓN DE CONSEJOS */}
            <div style={{ 
              backgroundColor: colors.surfaceLight, 
              padding: '20px', 
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              marginTop: '20px'
            }}>
              <h3 style={{ 
                color: colors.text, 
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Ionicons name="bulb" size={24} color={colors.warning} />
                Consejos útiles
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <div>
                    <div style={{ color: colors.text, fontWeight: '500', marginBottom: '4px' }}>Reserva con tiempo</div>
                    <div style={{ color: colors.textSecondary, fontSize: '14px' }}>Planifica con antelación para asegurar disponibilidad</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <div>
                    <div style={{ color: colors.text, fontWeight: '500', marginBottom: '4px' }}>Horarios flexibles</div>
                    <div style={{ color: colors.textSecondary, fontSize: '14px' }}>Considera horas menos demandadas para mejores precios</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Ionicons name="mail" size={20} color={colors.warning} />
                  <div>
                    <div style={{ color: colors.text, fontWeight: '500', marginBottom: '4px' }}>Confirmación por email</div>
                    <div style={{ color: colors.textSecondary, fontSize: '14px' }}>Guarda el email de confirmación como comprobante</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Ionicons name="alert-circle" size={20} color={colors.danger} />
                  <div>
                    <div style={{ color: colors.text, fontWeight: '500', marginBottom: '4px' }}>Política de cancelación</div>
                    <div style={{ color: colors.textSecondary, fontSize: '14px' }}>Cancela hasta 24 horas antes sin costo adicional</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 👇 SECCIÓN DE ESTADÍSTICAS (ejemplo) */}
            <div style={{ 
              marginTop: '30px',
              padding: '20px',
              backgroundColor: colors.surfaceLight,
              borderRadius: '10px'
            }}>
              <h3 style={{ color: colors.text, marginBottom: '15px' }}>
                Tu actividad reciente
              </h3>
              
              <div style={{ 
                display: 'flex', 
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                <div style={{ 
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: colors.card,
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Ionicons name="calendar" size={32} color={colors.primary} />
                  <div style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>0</div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>Reservas activas</div>
                </div>
                
                <div style={{ 
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: colors.card,
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Ionicons name="checkmark-done" size={32} color={colors.success} />
                  <div style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>0</div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>Reservas completadas</div>
                </div>
                
                <div style={{ 
                  flex: '1',
                  minWidth: '200px',
                  backgroundColor: colors.card,
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Ionicons name="person" size={32} color={colors.warning} />
                  <div style={{ color: colors.text, fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>1</div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>Sesión activa</div>
                </div>
              </div>
              
           
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="selector-container" style={{ backgroundColor: colors.background }}>
      {isMobile ? <MobileUI /> : <WebUI />}
    </div>
  );
}