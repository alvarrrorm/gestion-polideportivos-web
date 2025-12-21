import React, { useState } from 'react';
import { useAuth } from '../contexto/AuthProvider';
import './Inicio.css';

export default function Inicio({ navigation }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [hoverStates, setHoverStates] = useState({
    login: false,
    register: false,
    reserve: false
  });

  const handleHover = (button, isHovered) => {
    setHoverStates(prev => ({ ...prev, [button]: isHovered }));
  };

  const handleReserva = () => {
    if (isAuthenticated && user) {
      // Usuario autenticado: va a reservas
      window.location.href = '/reservas';
    } else {
      // Usuario no autenticado: va a login
      window.location.href = '/login';
    }
  };

  const navigateTo = (path) => {
    window.location.href = path;
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleIrAlPanel = () => {
    window.location.href = '/reservas';
  };

  return (
    <div className="inicio-overlay">
      <div className="inicio-container">
        <div className="inicio-header">
          <h1 className="inicio-title">
            Bienvenido a <span className="title-highlight">Deppo</span>
          </h1>
          <p className="inicio-subtitle">Tu pasión, nuestro compromiso</p>

          <div className="button-group">
            {!isAuthenticated ? (
              <>
                {/* Botones para usuarios NO autenticados */}
                <button
                  className={`button login-button ${hoverStates.login ? 'button-hovered' : ''}`}
                  onClick={() => navigateTo('/login')}
                  onMouseEnter={() => handleHover('login', true)}
                  onMouseLeave={() => handleHover('login', false)}
                >
                  <span className="button-text">Iniciar Sesión</span>
                </button>

                <button
                  className={`button register-button ${hoverStates.register ? 'button-hovered' : ''}`}
                  onClick={() => navigateTo('/registro')}
                  onMouseEnter={() => handleHover('register', true)}
                  onMouseLeave={() => handleHover('register', false)}
                >
                  <span className="button-text">Registrarse</span>
                </button>
              </>
            ) : (
              <div className="user-welcome">
                <p className="welcome-message">
                  ¡Hola de nuevo, {user?.nombre || user?.usuario || 'Usuario'}!
                </p>
                <div className="user-buttons">
                  <button
                    className="button panel-button"
                    onClick={handleIrAlPanel}
                  >
                    <span className="button-text">Ir al Panel</span>
                  </button>
                  <button
                    className="button logout-button"
                    onClick={handleLogout}
                  >
                    <span className="button-text">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="content">
          <h2 className="content-title">¿Qué es Deppo?</h2>
          <p className="content-text">
            Deppo es tu plataforma premium para descubrir, organizar y disfrutar actividades deportivas.
            Conecta con otros apasionados del deporte, reserva instalaciones de primera calidad y participa
            en eventos exclusivos. ¡Transforma tu experiencia deportiva con nosotros!
          </p>

          <button
            className={`reserve-button ${hoverStates.reserve ? 'reserve-button-hovered' : ''}`}
            onClick={handleReserva}
            onMouseEnter={() => handleHover('reserve', true)}
            onMouseLeave={() => handleHover('reserve', false)}
          >
            <span className="reserve-button-text">
              {isAuthenticated ? 'Reserva Ahora' : 'Reserva tu Espacio'}
            </span>
            <span className="reserve-subtext">
              {isAuthenticated ? '¡No pierdas tu lugar!' : 'Inicia tu experiencia deportiva'}
            </span>
          </button>

          <h3 className="features-title">Beneficios Exclusivos</h3>
          <div className="features-container">
            <div className="feature-item">
              <span className="feature-icon">⏱️</span>
              <span className="feature-text">Reservas rápidas</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <span className="feature-text">Comunidad activa</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <span className="feature-text">Instalaciones premium</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">Eventos exclusivos</span>
            </div>
          </div>

          {/* Sección adicional para usuarios autenticados */}
          {isAuthenticated && (
            <div className="quick-access">
              <h3 className="quick-access-title">Acceso Rápido</h3>
              <div className="quick-access-buttons">
                <button 
                  className="quick-access-button"
                  onClick={() => window.location.href = '/crear-reserva'}
                >
                  <span className="quick-icon">📅</span>
                  <span>Nueva Reserva</span>
                </button>
                <button 
                  className="quick-access-button"
                  onClick={() => window.location.href = '/mis-reservas'}
                >
                  <span className="quick-icon">📋</span>
                  <span>Mis Reservas</span>
                </button>
                {user?.rol === 'admin' && (
                  <button 
                    className="quick-access-button admin-button"
                    onClick={() => window.location.href = '/admin'}
                  >
                    <span className="quick-icon">👑</span>
                    <span>Panel Admin</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}