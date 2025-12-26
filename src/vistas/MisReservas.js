import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthProvider';
import './MisReservas.css';

export default function Reservas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [reservasActivas, setReservasActivas] = useState([]);
  const [reservasConfirmadas, setReservasConfirmadas] = useState([]);
  const [reservasHistorial, setReservasHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [cancelando, setCancelando] = useState({});

  // Obtener datos del usuario
  const usuario = user?.usuario || '';
  const dni = user?.dni || '';
  const userId = user?.id || 0;
  const token = localStorage.getItem('auth_token');

  // FUNCIÓN PARA VOLVER ATRÁS
  const handleGoBack = () => {
    navigate('/reservas');
  };

  // Función para obtener headers con autenticación
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Cargar reservas - VERSIÓN CORREGIDA
  useEffect(() => {
    const fetchReservas = async () => {
      if (!token) {
        console.log('⚠️ No hay token de autenticación');
        setError('No estás autenticado. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Buscando mis reservas para usuario ID:', userId);
        console.log('🔑 Token disponible:', token ? 'Sí' : 'No');
        
        // ✅ USAR SOLO EL ENDPOINT QUE FUNCIONA
        const endpoint = `https://tfgv2-production.up.railway.app/api/reservas/mis-reservas`;
        console.log('📡 Usando endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getHeaders()
        });
        
        const data = await response.json();
        
        console.log('📊 Respuesta del servidor:', data);
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
          throw new Error(data.error || `Error ${response.status}`);
        }
        
        if (!data.success) {
          throw new Error(data.error || 'Error al obtener reservas');
        }

        processReservas(data.data || []);

      } catch (error) {
        console.error('❌ Error cargando reservas:', error);
        setError(error.message || 'Error al cargar las reservas. Por favor, verifica tu conexión.');
      } finally {
        setLoading(false);
      }
    };

    // Función para procesar las reservas
    const processReservas = (todasReservas) => {
      console.log('📋 Total de reservas recibidas:', todasReservas.length);
      
      // Procesar reservas
      const ahora = new Date();
      
      // Reservas activas (futuras y no canceladas)
      const activas = todasReservas.filter(reserva => {
        const fechaReserva = new Date(reserva.fecha + 'T' + reserva.hora_inicio + ':00');
        return fechaReserva >= ahora && reserva.estado !== 'cancelada';
      });
      
      setReservasActivas(activas);

      // Reservas confirmadas
      const confirmadas = todasReservas.filter(reserva => 
        reserva.estado === 'confirmada' && new Date(reserva.fecha + 'T' + reserva.hora_inicio + ':00') >= ahora
      );
      setReservasConfirmadas(confirmadas);

      // Historial (pasadas o canceladas)
      const historial = todasReservas.filter(reserva => {
        const fechaReserva = new Date(reserva.fecha + 'T' + reserva.hora_inicio + ':00');
        return fechaReserva < ahora || reserva.estado === 'cancelada';
      });
      setReservasHistorial(historial);
    };

    if (token) {
      fetchReservas();
    } else {
      setLoading(false);
      setError('No estás autenticado. Por favor, inicia sesión.');
    }
  }, [userId, token, navigate]);

  // 🎯 FUNCIÓN CORREGIDA PARA FORMATO DE FECHA
  const formatearFecha = (fechaStr) => {
    try {
      // Separar fecha y hora
      const [anio, mes, dia] = fechaStr.split('-');
      
      // Crear fecha con tiempo 12:00 para evitar problemas de zona horaria
      const fecha = new Date(Date.UTC(parseInt(anio), parseInt(mes) - 1, parseInt(dia), 12, 0, 0));
      
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC' // Usar UTC para consistencia
      });
    } catch (e) {
      console.error('Error formateando fecha:', e, fechaStr);
      return fechaStr;
    }
  };

  // 🎯 FUNCIÓN CORREGIDA PARA FORMATO DE FECHA CON HORA
  const formatearFechaParaTarjeta = (fechaStr, horaInicio) => {
    try {
      // Separar fecha
      const [anio, mes, dia] = fechaStr.split('-');
      // Separar hora
      const [horas, minutos] = horaInicio.split(':');
      
      // Crear fecha con hora específica en UTC
      const fechaReserva = new Date(Date.UTC(
        parseInt(anio), 
        parseInt(mes) - 1, 
        parseInt(dia), 
        parseInt(horas), 
        parseInt(minutos), 
        0
      ));
      
      // Fecha actual en UTC
      const ahoraUTC = new Date();
      const ahora = new Date(Date.UTC(
        ahoraUTC.getUTCFullYear(),
        ahoraUTC.getUTCMonth(),
        ahoraUTC.getUTCDate(),
        ahoraUTC.getUTCHours(),
        ahoraUTC.getUTCMinutes(),
        ahoraUTC.getUTCSeconds()
      ));
      
      // Calcular diferencia en días (solo fecha, sin hora)
      const fechaReservaDia = new Date(Date.UTC(
        fechaReserva.getUTCFullYear(),
        fechaReserva.getUTCMonth(),
        fechaReserva.getUTCDate()
      ));
      
      const hoyDia = new Date(Date.UTC(
        ahora.getUTCFullYear(),
        ahora.getUTCMonth(),
        ahora.getUTCDate()
      ));
      
      const diferenciaMs = fechaReservaDia.getTime() - hoyDia.getTime();
      const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      
      // Formatear hora
      const horaFormateada = fechaReserva.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
      });
      
      if (diferenciaDias === 0) {
        return `Hoy, ${horaFormateada}`;
      } else if (diferenciaDias === 1) {
        return `Mañana, ${horaFormateada}`;
      } else {
        return fechaReserva.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC'
        });
      }
    } catch (e) {
      console.error('Error formateando fecha para tarjeta:', e, fechaStr, horaInicio);
      return `${fechaStr} ${horaInicio}`;
    }
  };

  // 🎯 FUNCIÓN AUXILIAR PARA OBTENER LA FECHA ACTUAL EN UTC
  const getHoyUTC = () => {
    const ahora = new Date();
    return new Date(Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate()
    ));
  };

  const irADetalles = (reserva) => {
    navigate(`/resumen-reserva?reserva=${encodeURIComponent(JSON.stringify(reserva))}`);
  };

  const irANuevaReserva = () => {
    navigate('/formulario-reserva');
  };

  const handlePagar = (reserva) => {
    navigate(`/resumen-reserva?reserva=${encodeURIComponent(JSON.stringify(reserva))}`);
  };

  // 👇 FUNCIÓN MEJORADA PARA CANCELAR RESERVAS - CORREGIDA
  const handleCancelar = async (reservaId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    setCancelando(prev => ({ ...prev, [reservaId]: true }));

    try {
      console.log(`❌ Intentando cancelar reserva ID: ${reservaId}`);
      
      // ✅ USAR LA RUTA CORRECTA DEL BACKEND
      const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${reservaId}/cancelar`, {
        method: 'PUT',
        headers: getHeaders()
      });

      const data = await response.json();
      
      console.log('📊 Respuesta de cancelación:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cancelar la reserva');
      }

      alert('✅ Reserva cancelada correctamente');
      
      // Actualizar la lista de reservas localmente
      setReservasActivas(prev => prev.filter(r => r.id !== reservaId));
      setReservasConfirmadas(prev => prev.filter(r => r.id !== reservaId));
      
      // Agregar al historial
      const reservaCancelada = [...reservasActivas, ...reservasConfirmadas].find(r => r.id === reservaId);
      if (reservaCancelada) {
        setReservasHistorial(prev => [{
          ...reservaCancelada,
          estado: 'cancelada'
        }, ...prev]);
      }

    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      alert(`❌ Error al cancelar: ${error.message}. Por favor, contacta con soporte.`);
    } finally {
      setCancelando(prev => ({ ...prev, [reservaId]: false }));
    }
  };

  // Filtrado de reservas - VERSIÓN CORREGIDA CON UTC
  const reservasFiltradas = useMemo(() => {
    let filtradas = [...reservasActivas];
    
    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(reserva => reserva.estado === filtroEstado);
    }
    
    // Filtrar por fecha - VERSIÓN CORREGIDA CON UTC
    if (filtroFecha !== 'todas') {
      const hoyUTC = getHoyUTC();
      const mañanaUTC = new Date(hoyUTC);
      mañanaUTC.setUTCDate(mañanaUTC.getUTCDate() + 1);
      const semanaSiguienteUTC = new Date(hoyUTC);
      semanaSiguienteUTC.setUTCDate(semanaSiguienteUTC.getUTCDate() + 7);
      
      filtradas = filtradas.filter(reserva => {
        try {
          const [anio, mes, dia] = reserva.fecha.split('-');
          const fechaReservaUTC = new Date(Date.UTC(
            parseInt(anio), 
            parseInt(mes) - 1, 
            parseInt(dia)
          ));
          
          switch(filtroFecha) {
            case 'hoy':
              return fechaReservaUTC.getTime() === hoyUTC.getTime();
            case 'mañana':
              return fechaReservaUTC.getTime() === mañanaUTC.getTime();
            case 'semana':
              return fechaReservaUTC >= hoyUTC && fechaReservaUTC < semanaSiguienteUTC;
            default:
              return true;
          }
        } catch (e) {
          console.error('Error filtrando por fecha:', e);
          return true;
        }
      });
    }
    
    // Filtrar por tipo de pista
    if (filtroTipo !== 'todos' && filtroTipo !== '') {
      filtradas = filtradas.filter(reserva => 
        reserva.pistaTipo && reserva.pistaTipo.toLowerCase().includes(filtroTipo.toLowerCase())
      );
    }
    
    return filtradas;
  }, [reservasActivas, filtroEstado, filtroFecha, filtroTipo]);

  // Si no hay token, mostrar mensaje
  if (!token) {
    return (
      <div className="error-container">
        <h2>No autenticado</h2>
        <p>Por favor, inicia sesión para ver tus reservas.</p>
        <button 
          className="btn-reintentar"
          onClick={() => navigate('/login')}
        >
          Ir al Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando reservas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error al cargar reservas</h2>
        <p>{error}</p>
        <div className="error-buttons">
          <button 
            className="btn-reintentar"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
          <button 
            className="btn-login"
            onClick={() => navigate('/login')}
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reservas-container">
      {/* HEADER CON FLECHA PARA VOLVER ATRÁS */}
      <div className="header-with-back">
        <button 
          className="back-button-header"
          onClick={handleGoBack}
          title="Volver al panel"
          aria-label="Volver al panel principal"
        >
          <span className="back-arrow">←</span>
          <span className="back-text">Volver</span>
        </button>
        
        <div className="header-content-main">
          <h1>Mis Reservas</h1>
          <p className="subtitulo">
            Gestiona tus próximas reservas y consulta el historial
          </p>
          <div className="user-info">
            <small>Bienvenido, {usuario}</small>
            <small>ID de usuario: {userId}</small>
          </div>
        </div>
      </div>

      {/* Contenedor principal de contenido */}
      <div className="content-container">
        {/* Acciones de header */}
        <div className="header-actions">
          <button 
            className="btn-filtros"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <span className="filter-icon">⚙️</span>
            <span className="btn-text">Filtros</span>
          </button>
          
          <button 
            className="btn-nueva-reserva"
            onClick={irANuevaReserva}
          >
            <span className="plus-icon">+</span>
            <span className="btn-text">Nueva Reserva</span>
          </button>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="filtros-container">
            <div className="filtro-group">
              <label htmlFor="filtro-estado">Estado:</label>
              <select 
                id="filtro-estado"
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmada">Confirmadas</option>
              </select>
            </div>
            
            <div className="filtro-group">
              <label htmlFor="filtro-fecha">Fecha:</label>
              <select 
                id="filtro-fecha"
                value={filtroFecha} 
                onChange={(e) => setFiltroFecha(e.target.value)}
              >
                <option value="todas">Todas las fechas</option>
                <option value="hoy">Hoy</option>
                <option value="mañana">Mañana</option>
                <option value="semana">Esta semana</option>
              </select>
            </div>
            
            <div className="filtro-group">
              <label htmlFor="filtro-tipo">Tipo de pista:</label>
              <select 
                id="filtro-tipo"
                value={filtroTipo} 
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos los tipos</option>
                <option value="padel">Pádel</option>
                <option value="tenis">Tenis</option>
                <option value="baloncesto">Baloncesto</option>
                <option value="futbol">Fútbol</option>
                <option value="piscina">Piscina</option>
              </select>
            </div>
            
            <button 
              className="btn-limpiar-filtros"
              onClick={() => {
                setFiltroEstado('todos');
                setFiltroFecha('todas');
                setFiltroTipo('todos');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Sección de reservas activas */}
        <div className="reservas-section">
          <div className="section-header">
            <h2>Reservas Activas</h2>
            <span className="badge-count">{reservasFiltradas.length}</span>
          </div>
          
          <p className="section-subtitle">
            Próximas reservas pendientes de confirmar o pagar
          </p>

          {reservasFiltradas.length === 0 && reservasConfirmadas.length === 0 && reservasHistorial.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>No tienes reservas todavía</p>
              <button 
                className="btn-nueva-reserva-empty"
                onClick={irANuevaReserva}
              >
                + Crear nueva reserva
              </button>
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>No tienes reservas activas</p>
              <p className="empty-subtext">Todas tus reservas están confirmadas o en el historial</p>
            </div>
          ) : (
            <div className="reservas-grid">
              {reservasFiltradas.map((reserva) => (
                <div 
                  key={reserva.id} 
                  className={`reserva-card ${reserva.estado}`}
                  onClick={() => irADetalles(reserva)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && irADetalles(reserva)}
                >
                  <div className="card-header">
                    <div className="card-badge">
                      {reserva.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Confirmada'}
                    </div>
                    <button 
                      className="btn-cancelar-card"
                      onClick={(e) => handleCancelar(reserva.id, e)}
                      title="Cancelar reserva"
                      aria-label="Cancelar reserva"
                      disabled={cancelando[reserva.id]}
                    >
                      {cancelando[reserva.id] ? '⏳' : '✕'}
                    </button>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="pista-nombre">{reserva.pistaNombre || `Pista ${reserva.pista_id}`}</h3>
                    <p className="pista-tipo">
                      {reserva.pistaTipo || 'Sin especificar'}
                      {reserva.ludoteca && <span className="ludoteca-badge"> 🧸 Ludoteca</span>}
                    </p>
                    
                    <div className="info-row">
                      <span className="info-icon">📍</span>
                      <span className="info-text">{reserva.polideportivo_nombre || `Polideportivo ${reserva.polideportivo_id}`}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-icon">📅</span>
                      <span className="info-text">{formatearFechaParaTarjeta(reserva.fecha, reserva.hora_inicio)}</span>
                    </div>
                    
                    <div className="info-row">
                      <span className="info-icon">🕒</span>
                      <span className="info-text">{reserva.hora_inicio} - {reserva.hora_fin}</span>
                    </div>
                    
                    <div className="precio-container">
                      <span className="precio-label">Precio:</span>
                      <span className="precio">€{parseFloat(reserva.precio || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    {reserva.estado === 'pendiente' ? (
                      <button 
                        className="btn-pagar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePagar(reserva);
                        }}
                      >
                        💳 Pagar Ahora
                      </button>
                    ) : (
                      <button 
                        className="btn-ver-detalles"
                        onClick={() => irADetalles(reserva)}
                      >
                        🔍 Ver Detalles
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de reservas confirmadas */}
        {reservasConfirmadas.length > 0 && (
          <div className="reservas-section">
            <div className="section-header">
              <h2>Reservas Confirmadas</h2>
              <span className="badge-count badge-confirmada">{reservasConfirmadas.length}</span>
            </div>
            
            <div className="confirmadas-container">
              {reservasConfirmadas.map((reserva) => (
                <div key={`conf-${reserva.id}`} className="confirmada-card">
                  <div className="confirmada-header">
                    <span className="confirmada-fecha">
                      {formatearFecha(reserva.fecha)}
                    </span>
                    <span className="confirmada-badge">✅ Confirmada</span>
                  </div>
                  
                  <div className="confirmada-content">
                    <h4>{reserva.pistaNombre || `Pista ${reserva.pista_id}`}</h4>
                    <p className="confirmada-lugar">
                      {reserva.polideportivo_nombre || `Polideportivo ${reserva.polideportivo_id}`}
                    </p>
                    <p className="confirmada-horario">
                      {reserva.hora_inicio} - {reserva.hora_fin} • €{parseFloat(reserva.precio || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  <button 
                    className="btn-ver-confirmada"
                    onClick={() => irADetalles(reserva)}
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial de reservas */}
        {reservasHistorial.length > 0 && (
          <div className="reservas-section historial-section">
            <div className="section-header">
              <h2>Historial</h2>
              <span className="badge-count badge-historial">{reservasHistorial.length}</span>
            </div>
            
            <div className="historial-container">
              {reservasHistorial.map((reserva) => (
                <div key={`hist-${reserva.id}`} className="historial-item">
                  <div className="historial-content">
                    <div className="historial-header">
                      <span className="historial-fecha">
                        {formatearFecha(reserva.fecha)}
                      </span>
                      <span className={`historial-estado ${reserva.estado}`}>
                        {reserva.estado === 'cancelada' ? '❌ Cancelada' : '📅 Pasada'}
                      </span>
                    </div>
                    
                    <div className="historial-info">
                      <span className="historial-pista">
                        {reserva.pistaNombre || `Pista ${reserva.pista_id}`}
                      </span>
                      <span className="historial-polideportivo">
                        • {reserva.polideportivo_nombre || `Polideportivo ${reserva.polideportivo_id}`}
                      </span>
                    </div>
                    
                    <div className="historial-detalles">
                      <span className="historial-horario">{reserva.hora_inicio} - {reserva.hora_fin}</span>
                      <span className="historial-precio">• €{parseFloat(reserva.precio || 0).toFixed(2)}</span>
                      {reserva.ludoteca && <span className="historial-ludoteca">• 🧸 Ludoteca</span>}
                    </div>
                  </div>
                  
                  <button 
                    className="btn-ver-historial"
                    onClick={() => irADetalles(reserva)}
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}