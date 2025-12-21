import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../contexto/AuthProvider';
import { useNavigate } from 'react-router-dom';
import './AdminPoli.css';

// URLs de la API
const API_URL = 'https://tfgv2-production.up.railway.app/api';

// ========== COMPONENTES MODALES MEMOIZADOS ==========

// Modal de confirmación de reserva
const ConfirmReservaModal = memo(({
  show,
  onClose,
  onConfirm,
  selectedReserva,
  colors,
  formatFecha,
  formatHora
}) => {
  if (!show || !selectedReserva) return null;

  return (
    <div className="modal-overlay" style={{ backgroundColor: colors.overlay }} onClick={onClose}>
      <div className="modal-content" style={{ backgroundColor: colors.modalBackground }} onClick={e => e.stopPropagation()}>
        <div className="modal-icon" style={{ color: colors.success }}>
          ✅
        </div>
        <h3 style={{ color: colors.text }}>Confirmar Reserva</h3>
        <p style={{ color: colors.textSecondary }}>
          ¿Confirmar la reserva de <strong>{selectedReserva.nombre_usuario}</strong> para {selectedReserva.pistas?.nombre}?
        </p>
        <div className="modal-details" style={{ backgroundColor: colors.surfaceLight, color: colors.textSecondary }}>
          <div><strong>Fecha:</strong> {formatFecha(selectedReserva.fecha)}</div>
          <div><strong>Hora:</strong> {formatHora(selectedReserva.hora_inicio)} - {formatHora(selectedReserva.hora_fin)}</div>
          <div><strong>Precio:</strong> ${selectedReserva.precio || '0'}</div>
        </div>
        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onClose}
            style={{ backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }}
          >
            Cancelar
          </button>
          <button
            className="modal-confirm"
            onClick={onConfirm}
            style={{ backgroundColor: colors.success, color: '#fff' }}
          >
            Confirmar Reserva
          </button>
        </div>
      </div>
    </div>
  );
});

// Modal de cancelación de reserva
const CancelReservaModal = memo(({
  show,
  onClose,
  onCancel,
  selectedReserva,
  colors,
  formatFecha,
  formatHora
}) => {
  if (!show || !selectedReserva) return null;

  return (
    <div className="modal-overlay" style={{ backgroundColor: colors.overlay }} onClick={onClose}>
      <div className="modal-content" style={{ backgroundColor: colors.modalBackground }} onClick={e => e.stopPropagation()}>
        <div className="modal-icon" style={{ color: colors.danger }}>
          ❌
        </div>
        <h3 style={{ color: colors.text }}>Cancelar Reserva</h3>
        <p style={{ color: colors.textSecondary }}>
          ¿Cancelar la reserva de <strong>{selectedReserva.nombre_usuario}</strong> para {selectedReserva.pistas?.nombre}?
        </p>
        <div className="modal-details" style={{ backgroundColor: colors.surfaceLight, color: colors.textSecondary }}>
          <div><strong>Fecha:</strong> {formatFecha(selectedReserva.fecha)}</div>
          <div><strong>Hora:</strong> {formatHora(selectedReserva.hora_inicio)} - {formatHora(selectedReserva.hora_fin)}</div>
          <div><strong>Precio:</strong> ${selectedReserva.precio || '0'}</div>
        </div>
        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onClose}
            style={{ backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }}
          >
            Cancelar
          </button>
          <button
            className="modal-confirm"
            onClick={onCancel}
            style={{ backgroundColor: colors.danger, color: '#fff' }}
          >
            Cancelar Reserva
          </button>
        </div>
      </div>
    </div>
  );
});

// Modal de cambio de precio
const PriceModal = memo(({
  show,
  onClose,
  onSubmit,
  selectedPista,
  colors,
  nuevoPrecio,
  setNuevoPrecio
}) => {
  if (!show || !selectedPista) return null;

  return (
    <div className="modal-overlay" style={{ backgroundColor: colors.overlay }} onClick={onClose}>
      <div className="modal-content" style={{ backgroundColor: colors.modalBackground }} onClick={e => e.stopPropagation()}>
        <div className="modal-icon" style={{ color: colors.primary }}>
          💰
        </div>
        <h3 style={{ color: colors.text }}>Cambiar Precio</h3>
        <p style={{ color: colors.textSecondary }}>
          Actualizar precio por hora de <strong>{selectedPista.nombre}</strong>
        </p>
        <div className="modal-input">
          <label style={{ color: colors.text }}>Nuevo precio por hora ($):</label>
          <input
            type="number"
            value={nuevoPrecio}
            onChange={(e) => setNuevoPrecio(e.target.value)}
            placeholder="Ej: 15.00"
            step="0.01"
            min="0"
            style={{
              backgroundColor: colors.surfaceLight,
              color: colors.text,
              borderColor: colors.border
            }}
          />
          <div className="modal-note" style={{ color: colors.textMuted }}>
            Precio actual: ${selectedPista.precio || '0'}
          </div>
        </div>
        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onClose}
            style={{ backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }}
          >
            Cancelar
          </button>
          <button
            className="modal-confirm"
            onClick={onSubmit}
            style={{ backgroundColor: colors.primary, color: '#fff' }}
          >
            Actualizar Precio
          </button>
        </div>
      </div>
    </div>
  );
});

// Modal de detalles/edición de pista (actualizado para incluir precio)
const PistaModal = memo(({
  show,
  onClose,
  onSubmit,
  editingPista,
  colors,
  tiposPista,
  nuevoNombrePista,
  setNuevoNombrePista,
  nuevoTipoPista,
  setNuevoTipoPista,
  nuevoPrecio,
  setNuevoPrecio,
  nuevaDescripcion,
  setNuevaDescripcion,
  errorNombreRepetido,
  setErrorNombreRepetido
}) => {
  if (!show || !editingPista) return null;

  return (
    <div className="modal-overlay" style={{ backgroundColor: colors.overlay }} onClick={onClose}>
      <div className="modal-content pista-modal" style={{ backgroundColor: colors.modalBackground }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ color: colors.text }}>Editar Pista</h3>
          <button
            onClick={onClose}
            style={{ color: colors.textSecondary }}
          >
            ✕
          </button>
        </div>

        <div className="pista-form">
          <div className="form-group">
            <label style={{ color: colors.text }}>Nombre:</label>
            <input
              type="text"
              value={nuevoNombrePista}
              onChange={(e) => {
                setNuevoNombrePista(e.target.value);
                setErrorNombreRepetido('');
              }}
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            />
            {errorNombreRepetido && (
              <div className="error-message" style={{ color: colors.danger, fontSize: '14px', marginTop: '5px' }}>
                {errorNombreRepetido}
              </div>
            )}
          </div>

          <div className="form-group">
            <label style={{ color: colors.text }}>Tipo:</label>
            <select
              value={nuevoTipoPista}
              onChange={(e) => setNuevoTipoPista(e.target.value)}
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              {tiposPista.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: colors.text }}>Precio por hora ($):</label>
            <input
              type="number"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              placeholder="Ej: 15.00"
              step="0.01"
              min="0"
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            />
            <div className="modal-note" style={{ color: colors.textMuted, fontSize: '12px', marginTop: '5px' }}>
              Precio actual: ${editingPista.precio || '0'}
            </div>
          </div>

          <div className="form-group">
            <label style={{ color: colors.text }}>Descripción:</label>
            <textarea
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              rows="3"
              placeholder="Descripción de la pista..."
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onClose}
            style={{ backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }}
          >
            Cancelar
          </button>
          <button
            className="modal-confirm"
            onClick={onSubmit}
            style={{ backgroundColor: colors.primary, color: '#fff' }}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
});

// Modal para agregar nueva pista
const AddPistaModal = memo(({
  show,
  onClose,
  onSubmit,
  colors,
  tiposPista,
  nuevaPistaNombre,
  setNuevaPistaNombre,
  nuevaPistaTipo,
  setNuevaPistaTipo,
  nuevaPistaPrecio,
  setNuevaPistaPrecio,
  nuevaPistaDescripcion,
  setNuevaPistaDescripcion,
  errorNombreRepetido,
  setErrorNombreRepetido,
  polideportivo,
  userRole
}) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ backgroundColor: colors.overlay }} onClick={onClose}>
      <div className="modal-content add-pista-modal" style={{ backgroundColor: colors.modalBackground }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ color: colors.text }}>🎾 Agregar Nueva Pista</h3>
          <button
            onClick={onClose}
            style={{ color: colors.textSecondary }}
          >
            ✕
          </button>
        </div>

        <div className="pista-form">
          <div className="form-group">
            <label style={{ color: colors.text }}>Nombre de la pista:</label>
            <input
              type="text"
              value={nuevaPistaNombre}
              onChange={(e) => {
                setNuevaPistaNombre(e.target.value);
                setErrorNombreRepetido('');
              }}
              placeholder="Ej: Cancha Central, Pista 1..."
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            />
            {errorNombreRepetido && (
              <div className="error-message" style={{ color: colors.danger, fontSize: '14px', marginTop: '5px' }}>
                {errorNombreRepetido}
              </div>
            )}
          </div>

          <div className="form-group">
            <label style={{ color: colors.text }}>Tipo de pista:</label>
            <select
              value={nuevaPistaTipo}
              onChange={(e) => setNuevaPistaTipo(e.target.value)}
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              {tiposPista.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ color: colors.text }}>Precio por hora ($):</label>
            <input
              type="number"
              value={nuevaPistaPrecio}
              onChange={(e) => setNuevaPistaPrecio(e.target.value)}
              placeholder="Ej: 15.00"
              step="0.01"
              min="0"
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ color: colors.text }}>Descripción (opcional):</label>
            <textarea
              value={nuevaPistaDescripcion}
              onChange={(e) => setNuevaPistaDescripcion(e.target.value)}
              rows="3"
              placeholder="Descripción de la pista..."
              style={{
                backgroundColor: colors.surfaceLight,
                color: colors.text,
                borderColor: colors.border
              }}
            />
          </div>

          <div className="form-info" style={{ color: colors.textMuted, fontSize: '14px', marginTop: '10px' }}>
            📍 Esta pista se agregará a: <strong>{polideportivo?.nombre}</strong>
            <br />
            👤 Usuario: <strong>{userRole === 'admin_poli' ? 'Administrador Polideportivo' : 'Super Administrador'}</strong>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={onClose}
            style={{ backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.border }}
          >
            Cancelar
          </button>
          <button
            className="modal-confirm"
            onClick={onSubmit}
            disabled={!nuevaPistaNombre.trim() || !nuevaPistaPrecio}
            style={{
              backgroundColor: !nuevaPistaNombre.trim() || !nuevaPistaPrecio ? colors.textMuted : colors.success,
              color: '#fff',
              opacity: !nuevaPistaNombre.trim() || !nuevaPistaPrecio ? 0.6 : 1,
              cursor: !nuevaPistaNombre.trim() || !nuevaPistaPrecio ? 'not-allowed' : 'pointer'
            }}
          >
            Agregar Pista
          </button>
        </div>
      </div>
    </div>
  );
});

// ========== COMPONENTE PRINCIPAL CORREGIDO ==========

export default function AdminPoli() {
  const { user, token, logout } = useAuth(); // Añadido logout
  const navigate = useNavigate();

  const [loading, setLoading] = useState({
    polideportivo: true,
    pistas: true,
    reservas: true,
    estadisticas: true
  });
  const [activeTab, setActiveTab] = useState('reservas');
  const [darkMode, setDarkMode] = useState(false);

  // Datos principales
  const [polideportivo, setPolideportivo] = useState(null);
  const [pistas, setPistas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  // Estados para modales
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPistaModal, setShowPistaModal] = useState(false);
  const [showAddPistaModal, setShowAddPistaModal] = useState(false);

  // Estados para selección
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [selectedPista, setSelectedPista] = useState(null);
  const [editingPista, setEditingPista] = useState(null);

  // Estados para formularios
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoNombrePista, setNuevoNombrePista] = useState('');
  const [nuevoTipoPista, setNuevoTipoPista] = useState('Fútbol');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');

  // Estados para agregar pista
  const [nuevaPistaNombre, setNuevaPistaNombre] = useState('');
  const [nuevaPistaTipo, setNuevaPistaTipo] = useState('Fútbol');
  const [nuevaPistaPrecio, setNuevaPistaPrecio] = useState('');
  const [nuevaPistaDescripcion, setNuevaPistaDescripcion] = useState('');
  const [errorNombreRepetido, setErrorNombreRepetido] = useState('');

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroTipoPista, setFiltroTipoPista] = useState('todos');

  // Estado para recargar datos automáticamente
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Obtener datos del usuario
  const idPolideportivo = user?.polideportivo_id;
  const nombreAdmin = user?.nombre || 'Administrador';
  const userRole = user?.rol || 'usuario';

  // Verificar que el usuario es admin_poli o super_admin
  useEffect(() => {
    if (userRole !== 'admin_poli' && userRole !== 'super_admin') {
      alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
      navigate('/reservas');
    }
  }, [userRole, navigate]);

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

  // Tipos de pistas disponibles
  const tiposPista = [
    { label: '⚽ Fútbol', value: 'Fútbol' },
    { label: '🏀 Baloncesto', value: 'Baloncesto' },
    { label: '🎾 Tenis', value: 'Tenis' },
    { label: '🎯 Pádel', value: 'Padel' },
    { label: '🏐 Voleibol', value: 'Voley' },
    { label: '👟 Fútbol Sala', value: 'Futbol Sala' }
  ];

  // Obtener icono según el tipo de pista
  const getIconoTipoPista = (tipo) => {
    switch (tipo) {
      case 'Fútbol': return '⚽';
      case 'Baloncesto': return '🏀';
      case 'Tenis': return '🎾';
      case 'Padel': return '🎯';
      case 'Voley': return '🏐';
      case 'Futbol Sala': return '👟';
      default: return '🏟️';
    }
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

  // ========== FUNCIONES UTILITARIAS ==========

  // Formatear fecha - memoizada
  const formatFecha = useCallback((fecha) => {
    if (!fecha) return 'N/A';
    try {
      const [year, month, day] = fecha.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return fecha;
    }
  }, []);

  // Formatear hora - memoizada
  const formatHora = useCallback((hora) => {
    if (!hora) return 'N/A';
    return hora.slice(0, 5);
  }, []);

  // ========== CARGA DE DATOS ==========

  // Función auxiliar para manejar errores de autenticación
  const handleAuthError = useCallback((errorMessage) => {
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      alert('🔐 Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      logout();
      navigate('/login');
      return true;
    }
    return false;
  }, [logout, navigate]);

  // Cargar datos del polideportivo
  const cargarPolideportivo = useCallback(async () => {
    if (!token) {
      console.error('❌ Faltan token para cargar polideportivo');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, polideportivo: true }));

      // Si es super_admin, puede que no tenga polideportivo asignado
      if (userRole === 'super_admin') {
        setPolideportivo(null);
        setLoading(prev => ({ ...prev, polideportivo: false }));
        return;
      }

      const response = await fetch(`${API_URL}/admin-poli/mi-polideportivo`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No se encontró información específica del polideportivo');
          setPolideportivo(null);
          return;
        }

        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }

        if (handleAuthError(errorMessage)) return;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setPolideportivo(data.data);
      }

    } catch (error) {
      console.error('❌ Error cargando polideportivo:', error.message);
      console.warn(`⚠️ Error al cargar datos del polideportivo: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, polideportivo: false }));
    }
  }, [token, userRole, handleAuthError]);

  // ✅ CORREGIDO: Cargar pistas del polideportivo
  const cargarPistas = useCallback(async () => {
    if (!token) {
      console.error('❌ Faltan token para cargar pistas');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, pistas: true }));

      let url;
      if (userRole === 'admin_poli') {
        url = `${API_URL}/pistas/mi-polideportivo/pistas`;
      } else if (userRole === 'super_admin') {
        url = `${API_URL}/pistas`;
      } else {
        console.error('❌ Rol no válido para cargar pistas');
        return;
      }

      const response = await fetch(url, {
        headers: getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No se encontraron pistas');
          setPistas([]);
          return;
        }

        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }

        if (handleAuthError(errorMessage)) return;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setPistas(data.data);
      } else {
        setPistas([]);
      }

    } catch (error) {
      console.error('❌ Error cargando pistas:', error.message);
      setPistas([]);
    } finally {
      setLoading(prev => ({ ...prev, pistas: false }));
    }
  }, [token, userRole, handleAuthError]);

  // ✅ CORREGIDO: Cargar reservas del polideportivo
  const cargarReservas = useCallback(async () => {
    if (!token) {
      console.error('❌ Faltan token para cargar reservas');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, reservas: true }));

      let url;
      if (userRole === 'admin_poli') {
        url = `${API_URL}/reservas/admin-poli/reservas`;
      } else if (userRole === 'super_admin') {
        url = `${API_URL}/reservas`;
      } else {
        console.error('❌ Rol no válido para cargar reservas');
        return;
      }

      const response = await fetch(url, {
        headers: getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No se encontraron reservas');
          setReservas([]);
          return;
        }

        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }

        if (handleAuthError(errorMessage)) return;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setReservas(data.data);
      } else {
        setReservas([]);
      }

    } catch (error) {
      console.error('❌ Error cargando reservas:', error.message);
      setReservas([]);
    } finally {
      setLoading(prev => ({ ...prev, reservas: false }));
    }
  }, [token, userRole, handleAuthError]);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    if (!token) {
      console.error('❌ Faltan token para cargar estadísticas');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, estadisticas: true }));

      if (userRole !== 'admin_poli') {
        setEstadisticas(null);
        setLoading(prev => ({ ...prev, estadisticas: false }));
        return;
      }

      const response = await fetch(`${API_URL}/admin-poli/estadisticas`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No se encontraron estadísticas');
          setEstadisticas(null);
          return;
        }

        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        }

        if (handleAuthError(errorMessage)) return;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setEstadisticas(data.data);
      }

    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error.message);
    } finally {
      setLoading(prev => ({ ...prev, estadisticas: false }));
    }
  }, [token, userRole, handleAuthError]);

  // Cargar todos los datos
  const cargarTodosLosDatos = useCallback(async () => {
    if (!token) {
      console.error('❌ Token inválido');
      alert('⚠️ Tu sesión ha expirado.');
      return;
    }

    try {
      await cargarPolideportivo();
      await cargarPistas();
      await cargarReservas();
      await cargarEstadisticas();

      console.log('✅ Todos los datos cargados correctamente');
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  }, [cargarPolideportivo, cargarPistas, cargarReservas, cargarEstadisticas, token]);

  // Efecto para cargar datos iniciales y recargar cuando cambie refreshTrigger
  useEffect(() => {
    if (token && (userRole === 'admin_poli' || userRole === 'super_admin')) {
      cargarTodosLosDatos();
    }
  }, [token, userRole, cargarTodosLosDatos, refreshTrigger]);

  // ========== FUNCIONES PARA RESERVAS (CORREGIDAS) ==========

  // Confirmar reserva - CORREGIDO
  const handleConfirmarReserva = useCallback((reserva) => {
    setSelectedReserva(reserva);
    setShowConfirmModal(true);
  }, []);

  const confirmarReserva = useCallback(async () => {
    if (!selectedReserva || !token) return;

    try {
      const response = await fetch(`${API_URL}/reservas/${selectedReserva.id}/confirmar`, {
        method: 'PUT',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al confirmar reserva');
      }

      const data = await response.json();

      if (data.success) {
        // ✅ ACTUALIZACIÓN INMEDIATA DEL ESTADO
        setReservas(prev => prev.map(r =>
          r.id === selectedReserva.id ? { ...r, estado: 'confirmada' } : r
        ));

        // ✅ ACTUALIZAR ESTADÍSTICAS DESPUÉS DE LA OPERACIÓN
        if (userRole === 'admin_poli') {
          cargarEstadisticas();
        }

        alert('✅ Reserva confirmada exitosamente');
      }

    } catch (error) {
      console.error('Error confirmando reserva:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setShowConfirmModal(false);
      setSelectedReserva(null);
    }
  }, [selectedReserva, token, userRole, cargarEstadisticas]);

  // Cancelar reserva - CORREGIDO
  const handleCancelarReserva = useCallback((reserva) => {
    setSelectedReserva(reserva);
    setShowCancelModal(true);
  }, []);

  const cancelarReserva = useCallback(async () => {
    if (!selectedReserva || !token) return;

    try {
      const response = await fetch(`${API_URL}/reservas/${selectedReserva.id}/cancelar`, {
        method: 'PUT',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar reserva');
      }

      const data = await response.json();

      if (data.success) {
        // ✅ ACTUALIZACIÓN INMEDIATA DEL ESTADO
        setReservas(prev => prev.map(r =>
          r.id === selectedReserva.id ? { ...r, estado: 'cancelada' } : r
        ));

        // ✅ ACTUALIZAR ESTADÍSTICAS DESPUÉS DE LA OPERACIÓN
        if (userRole === 'admin_poli') {
          cargarEstadisticas();
        }

        alert('✅ Reserva cancelada exitosamente');
      }

    } catch (error) {
      console.error('Error cancelando reserva:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setShowCancelModal(false);
      setSelectedReserva(null);
    }
  }, [selectedReserva, token, userRole, cargarEstadisticas]);

  // Reenviar email de confirmación
  const reenviarEmailReserva = useCallback(async (reservaId) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/reservas/${reservaId}/reenviar-email`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al reenviar email');
      }

      const data = await response.json();

      if (data.success) {
        alert('✅ Email reenviado exitosamente');
      }

    } catch (error) {
      console.error('Error reenviando email:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }, [token]);

  // ========== FUNCIONES PARA PISTAS (CORREGIDAS) ==========


  // ✅ CORREGIDO: Cambiar estado de mantenimiento - VERSIÓN FINAL
  const toggleMantenimiento = useCallback(async (pista) => {
    if (!pista || !token) return;

    // Lógica: Si disponible=true → poner en mantenimiento (enMantenimiento=true)
    //         Si disponible=false → quitar mantenimiento (enMantenimiento=false)
    const enMantenimiento = pista.disponible; // ¡ESTO ES CORRECTO!

    const confirmar = window.confirm(
      enMantenimiento
        ? `¿Poner la pista "${pista.nombre}" en mantenimiento?`
        : `¿Reactivar la pista "${pista.nombre}"?`
    );

    if (!confirmar) return;

    try {
      const response = await fetch(`${API_URL}/pistas/${pista.id}/mantenimiento`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          enMantenimiento: enMantenimiento  // ← ¡CORRECTO!
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado de mantenimiento');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const actualizado = data.data;
        // Actualizar estado localmente
        setPistas(prev => prev.map(p =>
          p.id === pista.id ? {
            ...p,
            disponible: actualizado.disponible
          } : p
        ));

        if (userRole === 'admin_poli') {
          cargarEstadisticas();
        }

        alert(`✅ Pista ${actualizado.disponible ? 'reactivada' : 'puesta en mantenimiento'} exitosamente`);
      }

    } catch (error) {
      console.error('Error cambiando mantenimiento:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }, [token, userRole, cargarEstadisticas]);

  // ✅ CORREGIDO: Cambiar precio de pista
  const handleCambiarPrecio = useCallback((pista) => {
    setSelectedPista(pista);
    setNuevoPrecio(pista.precio ? pista.precio.toString() : '0');
    setShowPriceModal(true);
  }, []);

  const actualizarPrecio = useCallback(async () => {
    if (!selectedPista || !nuevoPrecio || !token) return;

    try {
      const precioNum = parseFloat(nuevoPrecio);
      if (isNaN(precioNum) || precioNum <= 0) {
        alert('⚠️ Por favor ingresa un precio válido mayor que 0');
        return;
      }

      const response = await fetch(`${API_URL}/pistas/${selectedPista.id}/precio`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ precio: precioNum })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar precio');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // ✅ ACTUALIZACIÓN INMEDIATA DEL ESTADO
        setPistas(prev => prev.map(p =>
          p.id === selectedPista.id ? { ...p, precio: precioNum } : p
        ));

        alert('✅ Precio actualizado exitosamente');
      }

    } catch (error) {
      console.error('Error actualizando precio:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setShowPriceModal(false);
      setSelectedPista(null);
      setNuevoPrecio('');
    }
  }, [selectedPista, nuevoPrecio, token]);

  // ✅ CORREGIDO: Ver/editar detalles de pista
  const handleVerDetallesPista = useCallback((pista) => {
    setEditingPista({ ...pista });
    setNuevoNombrePista(pista.nombre || '');
    setNuevoTipoPista(pista.tipo || 'Fútbol');
    setNuevoPrecio(pista.precio ? pista.precio.toString() : '0');
    setNuevaDescripcion(pista.descripcion || '');
    setErrorNombreRepetido('');
    setShowPistaModal(true);
  }, []);

  const actualizarPista = useCallback(async () => {
    if (!editingPista || !token) return;

    // Validaciones
    if (!nuevoNombrePista.trim()) {
      alert('⚠️ El nombre de la pista es obligatorio');
      return;
    }

    if (!nuevoPrecio) {
      alert('⚠️ El precio es obligatorio');
      return;
    }

    const precioNum = parseFloat(nuevoPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      alert('⚠️ El precio debe ser un número mayor que 0');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/pistas/${editingPista.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          nombre: nuevoNombrePista.trim(),
          tipo: nuevoTipoPista,
          precio: precioNum,
          descripcion: nuevaDescripcion.trim() || null
        })
      });

      const responseData = await response.json();

      if (response.status === 409) {
        setErrorNombreRepetido('⚠️ Ya existe una pista con ese nombre en este polideportivo.');
        return;
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Error ${response.status}: No se pudo actualizar la pista`);
      }

      if (responseData.success && responseData.data) {
        // ✅ ACTUALIZACIÓN INMEDIATA DEL ESTADO CON DATOS COMPLETOS
        setPistas(prev => prev.map(p =>
          p.id === editingPista.id ? responseData.data : p
        ));

        alert('✅ Pista actualizada exitosamente');
        setShowPistaModal(false);
        setEditingPista(null);
        setNuevoNombrePista('');
        setNuevoTipoPista('Fútbol');
        setNuevoPrecio('');
        setNuevaDescripcion('');
        setErrorNombreRepetido('');
      }

    } catch (error) {
      console.error('Error actualizando pista:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }, [editingPista, token, nuevoNombrePista, nuevoTipoPista, nuevoPrecio, nuevaDescripcion]);

  // ✅ CORREGIDO: Eliminar pista (solo para super_admin)
  const handleEliminarPista = useCallback(async (pistaId) => {
    if (userRole !== 'super_admin') {
      alert('❌ Solo el super administrador puede eliminar pistas');
      return;
    }

    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar esta pista? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    try {
      const response = await fetch(`${API_URL}/pistas/${pistaId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar pista');
      }

      const data = await response.json();

      if (data.success) {
        // ✅ ACTUALIZACIÓN INMEDIATA DEL ESTADO
        setPistas(prev => prev.filter(p => p.id !== pistaId));
        alert('✅ Pista eliminada exitosamente');

        // ✅ RECARGAR DATOS PARA ACTUALIZAR ESTADÍSTICAS
        setRefreshTrigger(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error eliminando pista:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }, [token, userRole]);

  // ========== FUNCIONES PARA AGREGAR PISTA (CORREGIDAS) ==========

  // Abrir modal para agregar pista
  const handleAgregarPista = useCallback(() => {
    setNuevaPistaNombre('');
    setNuevaPistaTipo('Fútbol');
    setNuevaPistaPrecio('');
    setNuevaPistaDescripcion('');
    setErrorNombreRepetido('');
    setShowAddPistaModal(true);
  }, []);

  // ✅ CORREGIDO: Agregar nueva pista
  const agregarPista = useCallback(async () => {
    if (!token) {
      alert('No estás autenticado.');
      return;
    }

    setErrorNombreRepetido('');

    // Validaciones
    if (!nuevaPistaNombre.trim()) {
      alert('⚠️ El nombre de la pista es obligatorio');
      return;
    }

    if (!nuevaPistaTipo) {
      alert('⚠️ El tipo de pista es obligatorio');
      return;
    }

    if (!nuevaPistaPrecio) {
      alert('⚠️ El precio es obligatorio');
      return;
    }

    const precioNum = parseFloat(nuevaPistaPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      alert('⚠️ El precio debe ser un número válido mayor que 0');
      return;
    }

    try {
      // Preparar datos para la petición
      const pistaData = {
        nombre: nuevaPistaNombre.trim(),
        tipo: nuevaPistaTipo,
        precio: precioNum
      };

      // Agregar descripción si se proporciona
      if (nuevaPistaDescripcion.trim()) {
        pistaData.descripcion = nuevaPistaDescripcion.trim();
      }

      // Si es super_admin y quiere crear en un polideportivo específico
      if (userRole === 'super_admin' && idPolideportivo) {
        pistaData.polideportivo_id = idPolideportivo;
      }

      const response = await fetch(`${API_URL}/pistas`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(pistaData),
      });

      const responseData = await response.json();

      if (response.status === 409) {
        setErrorNombreRepetido('⚠️ Ya existe una pista con ese nombre en este polideportivo.');
        return;
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Error ${response.status}: No se pudo crear la pista`);
      }

      if (responseData.success && responseData.data) {
        // ✅ ACTUALIZACIÓN INMEDIATA DEL ESTADO
        setPistas(prev => [...prev, responseData.data]);

        setNuevaPistaNombre('');
        setNuevaPistaTipo('Fútbol');
        setNuevaPistaPrecio('');
        setNuevaPistaDescripcion('');
        setShowAddPistaModal(false);

        // ✅ RECARGAR DATOS PARA ACTUALIZAR ESTADÍSTICAS
        if (userRole === 'admin_poli') {
          cargarEstadisticas();
        }

        alert('✅ Pista agregada correctamente');
      }

    } catch (error) {
      console.error('Error al agregar pista:', error);
      alert(`❌ Error: ${error.message}`);
    }
  }, [token, userRole, idPolideportivo, nuevaPistaNombre, nuevaPistaTipo, nuevaPistaPrecio, nuevaPistaDescripcion, cargarEstadisticas]);

  // ========== FUNCIONES AUXILIARES ==========

  // Obtener color según estado
  const getEstadoColor = useCallback((estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada': return colors.success;
      case 'pendiente': return colors.warning;
      case 'cancelada': return colors.danger;
      default: return colors.textSecondary;
    }
  }, [colors]);

  // Obtener color según estado de pista
  const getPistaEstadoColor = useCallback((pista) => {
    if (!pista.disponible) return colors.danger;
    return colors.success;
  }, [colors]);

  // Exportar reservas a CSV
  const exportarReservas = useCallback(() => {
    if (reservas.length === 0) {
      alert('No hay reservas para exportar');
      return;
    }

    const csvContent = reservas.map(r =>
      `${r.id},${r.nombre_usuario || 'N/A'},${r.pistas?.nombre || 'N/A'},${r.fecha},${r.hora_inicio},${r.estado},${r.precio || '0'}`
    ).join('\n');

    const blob = new Blob([`ID,Usuario,Pista,Fecha,Hora,Estado,Precio\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas_${polideportivo?.nombre || 'polideportivo'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [reservas, polideportivo]);

  // Función para recargar todos los datos
  const recargarDatos = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Filtrar reservas
  const reservasFiltradas = reservas.filter(reserva => {
    if (filtroEstado !== 'todas' && reserva.estado !== filtroEstado) {
      return false;
    }

    if (filtroFecha && reserva.fecha !== filtroFecha) {
      return false;
    }

    if (searchTerm && activeTab === 'reservas') {
      const term = searchTerm.toLowerCase();
      return (
        (reserva.nombre_usuario && reserva.nombre_usuario.toLowerCase().includes(term)) ||
        (reserva.pistas?.nombre && reserva.pistas.nombre.toLowerCase().includes(term))
      );
    }

    return true;
  });

  // Filtrar pistas
  const pistasFiltradas = pistas.filter(pista => {
    if (filtroTipoPista !== 'todos' && pista.tipo !== filtroTipoPista) {
      return false;
    }

    if (searchTerm && activeTab === 'pistas') {
      const term = searchTerm.toLowerCase();
      return (
        pista.nombre.toLowerCase().includes(term) ||
        (pista.tipo && pista.tipo.toLowerCase().includes(term)) ||
        (pista.descripcion && pista.descripcion.toLowerCase().includes(term))
      );
    }

    return true;
  });

  // ========== RENDERIZADO PRINCIPAL ==========

  if (userRole !== 'admin_poli' && userRole !== 'super_admin') {
    return (
      <div className="error-container" style={{ backgroundColor: colors.background }}>
        <div className="error-icon" style={{ color: colors.danger }}>
          ⚠️
        </div>
        <h2 style={{ color: colors.text }}>Acceso Denegado</h2>
        <p style={{ color: colors.textSecondary }}>
          Solo los administradores pueden acceder a esta página.
        </p>
        <button
          onClick={() => navigate('/reservas')}
          style={{
            backgroundColor: colors.primary,
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  if (userRole === 'admin_poli' && !idPolideportivo) {
    return (
      <div className="error-container" style={{ backgroundColor: colors.background }}>
        <div className="error-icon" style={{ color: colors.danger }}>
          ⚠️
        </div>
        <h2 style={{ color: colors.text }}>No tienes un polideportivo asignado</h2>
        <p style={{ color: colors.textSecondary }}>
          Contacta con el super administrador para que te asigne un polideportivo.
        </p>
        <button
          onClick={() => navigate('/reservas')}
          style={{
            backgroundColor: colors.primary,
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  if (loading.polideportivo || loading.pistas || loading.reservas) {
    return (
      <div className="loading-container" style={{ backgroundColor: colors.background }}>
        <div className="loading-spinner">⏳</div>
        <div className="loading-text" style={{ color: colors.text }}>
          Cargando datos del polideportivo...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-poli-container" style={{ backgroundColor: colors.background }}>
      {/* Modales optimizados */}
      <ConfirmReservaModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmarReserva}
        selectedReserva={selectedReserva}
        colors={colors}
        formatFecha={formatFecha}
        formatHora={formatHora}
      />

      <CancelReservaModal
        show={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancel={cancelarReserva}
        selectedReserva={selectedReserva}
        colors={colors}
        formatFecha={formatFecha}
        formatHora={formatHora}
      />

      <PriceModal
        show={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        onSubmit={actualizarPrecio}
        selectedPista={selectedPista}
        colors={colors}
        nuevoPrecio={nuevoPrecio}
        setNuevoPrecio={setNuevoPrecio}
      />

      <PistaModal
        show={showPistaModal}
        onClose={() => setShowPistaModal(false)}
        onSubmit={actualizarPista}
        editingPista={editingPista}
        colors={colors}
        tiposPista={tiposPista}
        nuevoNombrePista={nuevoNombrePista}
        setNuevoNombrePista={setNuevoNombrePista}
        nuevoTipoPista={nuevoTipoPista}
        setNuevoTipoPista={setNuevoTipoPista}
        nuevoPrecio={nuevoPrecio}
        setNuevoPrecio={setNuevoPrecio}
        nuevaDescripcion={nuevaDescripcion}
        setNuevaDescripcion={setNuevaDescripcion}
        errorNombreRepetido={errorNombreRepetido}
        setErrorNombreRepetido={setErrorNombreRepetido}
      />

      <AddPistaModal
        show={showAddPistaModal}
        onClose={() => setShowAddPistaModal(false)}
        onSubmit={agregarPista}
        colors={colors}
        tiposPista={tiposPista}
        nuevaPistaNombre={nuevaPistaNombre}
        setNuevaPistaNombre={setNuevaPistaNombre}
        nuevaPistaTipo={nuevaPistaTipo}
        setNuevaPistaTipo={setNuevaPistaTipo}
        nuevaPistaPrecio={nuevaPistaPrecio}
        setNuevaPistaPrecio={setNuevaPistaPrecio}
        nuevaPistaDescripcion={nuevaPistaDescripcion}
        setNuevaPistaDescripcion={setNuevaPistaDescripcion}
        errorNombreRepetido={errorNombreRepetido}
        setErrorNombreRepetido={setErrorNombreRepetido}
        polideportivo={polideportivo}
        userRole={userRole}
      />

      {/* Header */}
      <header className="admin-poli-header" style={{ backgroundColor: colors.header, borderBottomColor: colors.border }}>
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate('/reservas')}
            style={{ color: colors.text }}
          >
            ← Volver
          </button>
          <div>
            <h1 style={{ color: colors.text }}>Panel de Administrador</h1>
            <div className="header-subtitle" style={{ color: colors.textSecondary }}>
              {userRole === 'admin_poli' ? (
                <>
                  🏟️ <strong>{polideportivo?.nombre || 'Sin polideportivo asignado'}</strong> • 👤 {nombreAdmin}
                </>
              ) : (
                <>
                  👑 <strong>Super Administrador</strong> • 🌍 Todos los polideportivos • 👤 {nombreAdmin}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="role-badge" style={{
            backgroundColor: userRole === 'super_admin' ? colors.warning + '20' : colors.primary + '20',
            color: userRole === 'super_admin' ? colors.warning : colors.primary
          }}>
            {userRole === 'super_admin' ? '👑 Super Admin' : '🏢 Admin Polideportivo'}
          </div>

          <button
            className="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            style={{ color: colors.textSecondary }}
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button
            className="refresh-button"
            onClick={recargarDatos}
            style={{
              backgroundColor: colors.surfaceLight,
              color: colors.text,
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              marginRight: '10px'
            }}
            title="Recargar datos"
          >
            🔄 Recargar
          </button>

          <button
            className="export-button"
            onClick={exportarReservas}
            style={{ backgroundColor: colors.primary, color: '#fff' }}
          >
            📥 Exportar CSV
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="admin-poli-main">
        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card" style={{ backgroundColor: colors.card }}>
            <div className="stat-icon">📅</div>
            <div className="stat-number" style={{ color: colors.text }}>{reservas.length}</div>
            <div className="stat-label" style={{ color: colors.textSecondary }}>Reservas Totales</div>
          </div>

          <div className="stat-card" style={{ backgroundColor: colors.card }}>
            <div className="stat-icon">✅</div>
            <div className="stat-number" style={{ color: colors.text }}>
              {reservas.filter(r => r.estado === 'confirmada').length}
            </div>
            <div className="stat-label" style={{ color: colors.textSecondary }}>Confirmadas</div>
          </div>

          <div className="stat-card" style={{ backgroundColor: colors.card }}>
            <div className="stat-icon">⏳</div>
            <div className="stat-number" style={{ color: colors.text }}>
              {reservas.filter(r => r.estado === 'pendiente').length}
            </div>
            <div className="stat-label" style={{ color: colors.textSecondary }}>Pendientes</div>
          </div>

          <div className="stat-card" style={{ backgroundColor: colors.card }}>
            <div className="stat-icon">💰</div>
            <div className="stat-number" style={{ color: colors.text }}>
              ${reservas
                .filter(r => r.estado === 'confirmada')
                .reduce((sum, r) => sum + (parseFloat(r.precio) || 0), 0)
                .toFixed(2)}
            </div>
            <div className="stat-label" style={{ color: colors.textSecondary }}>Ingresos</div>
          </div>
        </div>

        {/* Pestañas y controles */}
        <div className="tabs-section" style={{ backgroundColor: colors.card }}>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'reservas' ? 'active' : ''}`}
              onClick={() => setActiveTab('reservas')}
              style={{
                color: activeTab === 'reservas' ? colors.primary : colors.textSecondary,
                borderBottomColor: activeTab === 'reservas' ? colors.primary : 'transparent'
              }}
            >
              📅 Reservas ({reservas.length})
            </button>

            <button
              className={`tab ${activeTab === 'pistas' ? 'active' : ''}`}
              onClick={() => setActiveTab('pistas')}
              style={{
                color: activeTab === 'pistas' ? colors.primary : colors.textSecondary,
                borderBottomColor: activeTab === 'pistas' ? colors.primary : 'transparent'
              }}
            >
              🎾 Pistas ({pistas.length})
            </button>

            {userRole === 'admin_poli' && (
              <button
                className={`tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
                onClick={() => setActiveTab('estadisticas')}
                style={{
                  color: activeTab === 'estadisticas' ? colors.primary : colors.textSecondary,
                  borderBottomColor: activeTab === 'estadisticas' ? colors.primary : 'transparent'
                }}
              >
                📊 Estadísticas
              </button>
            )}
          </div>

          {/* Controles de filtro y búsqueda */}
          <div className="controls">
            <div className="search-box">
              🔍
              <input
                type="text"
                placeholder={`Buscar ${activeTab === 'reservas' ? 'reservas...' : 'pistas...'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: colors.surfaceLight,
                  color: colors.text,
                  borderColor: colors.border
                }}
              />
            </div>

            {activeTab === 'reservas' && (
              <div className="filters">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    backgroundColor: colors.surfaceLight,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                >
                  <option value="todas">Todas las reservas</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>

                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  style={{
                    backgroundColor: colors.surfaceLight,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                />
              </div>
            )}

            {activeTab === 'pistas' && (
              <div className="filters">
                <select
                  value={filtroTipoPista}
                  onChange={(e) => setFiltroTipoPista(e.target.value)}
                  style={{
                    backgroundColor: colors.surfaceLight,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                >
                  <option value="todos">Todos los tipos</option>
                  {tiposPista.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="content-area">
          {activeTab === 'reservas' ? (
            /* Tabla de Reservas */
            <div className="table-container" style={{ backgroundColor: colors.card }}>
              {reservasFiltradas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3 style={{ color: colors.text }}>No hay reservas</h3>
                  <p style={{ color: colors.textSecondary }}>
                    {searchTerm || filtroEstado !== 'todas' || filtroFecha
                      ? 'No se encontraron reservas con los filtros actuales'
                      : 'No hay reservas registradas'}
                  </p>
                  <button
                    className="refresh-button"
                    onClick={recargarDatos}
                    style={{
                      backgroundColor: colors.primary,
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '15px'
                    }}
                  >
                    🔄 Recargar Datos
                  </button>
                </div>
              ) : (
                <table className="reservas-table">
                  <thead>
                    <tr style={{ borderBottomColor: colors.border }}>
                      <th style={{ color: colors.text }}>ID</th>
                      <th style={{ color: colors.text }}>Usuario</th>
                      <th style={{ color: colors.text }}>Pista</th>
                      <th style={{ color: colors.text }}>Fecha</th>
                      <th style={{ color: colors.text }}>Hora</th>
                      <th style={{ color: colors.text }}>Estado</th>
                      <th style={{ color: colors.text }}>Precio</th>
                      <th style={{ color: colors.text }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservasFiltradas.map(reserva => (
                      <tr key={reserva.id} style={{ borderBottomColor: colors.border }}>
                        <td style={{ color: colors.textSecondary }}>#{reserva.id}</td>
                        <td>
                          <div className="user-info">
                            <div style={{ color: colors.text }}>👤 {reserva.nombre_usuario || 'N/A'}</div>
                            {reserva.email_usuario && (
                              <div className="user-email" style={{ color: colors.textMuted }}>
                                ✉️ {reserva.email_usuario}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ color: colors.text }}>{reserva.pistas?.nombre || 'N/A'}</td>
                        <td style={{ color: colors.text }}>📅 {formatFecha(reserva.fecha)}</td>
                        <td style={{ color: colors.text }}>⏰ {formatHora(reserva.hora_inicio)} - {formatHora(reserva.hora_fin)}</td>
                        <td>
                          <span
                            className="estado-badge"
                            style={{
                              backgroundColor: getEstadoColor(reserva.estado) + '20',
                              color: getEstadoColor(reserva.estado)
                            }}
                          >
                            {reserva.estado === 'confirmada' ? '✅ ' :
                              reserva.estado === 'pendiente' ? '⏳ ' :
                                reserva.estado === 'cancelada' ? '❌ ' : ''}
                            {reserva.estado?.charAt(0).toUpperCase() + reserva.estado?.slice(1) || 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ color: colors.text, fontWeight: 'bold' }}>
                          💰 ${parseFloat(reserva.precio || 0).toFixed(2)}
                        </td>
                        <td>
                          <div className="acciones">
                            {reserva.estado === 'pendiente' && (
                              <>
                                <button
                                  className="accion-btn confirm"
                                  onClick={() => handleConfirmarReserva(reserva)}
                                  title="Confirmar reserva"
                                  style={{ backgroundColor: colors.success + '20' }}
                                >
                                  ✅
                                </button>
                                <button
                                  className="accion-btn cancel"
                                  onClick={() => handleCancelarReserva(reserva)}
                                  title="Cancelar reserva"
                                  style={{ backgroundColor: colors.danger + '20' }}
                                >
                                  ❌
                                </button>
                              </>
                            )}
                            {reserva.estado === 'confirmada' && (
                              <button
                                className="accion-btn email"
                                onClick={() => reenviarEmailReserva(reserva.id)}
                                title="Reenviar email de confirmación"
                                style={{ backgroundColor: colors.primary + '20' }}
                              >
                                ✉️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : activeTab === 'pistas' ? (
            /* Tabla de Pistas */
            <div className="table-container" style={{ backgroundColor: colors.card }}>
              <div className="table-header" style={{ borderBottomColor: colors.border }}>
                <div className="table-title" style={{ color: colors.text }}>
                  🎾 {userRole === 'admin_poli' ? 'Pistas del Polideportivo' : 'Todas las Pistas'} ({pistas.length})
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="refresh-button"
                    onClick={recargarDatos}
                    style={{
                      backgroundColor: colors.surfaceLight,
                      color: colors.text,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer'
                    }}
                    title="Recargar datos"
                  >
                    🔄
                  </button>
                  <button
                    className="add-pista-btn"
                    onClick={handleAgregarPista}
                    style={{
                      backgroundColor: colors.success,
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ➕ Agregar Pista
                  </button>
                </div>
              </div>

              {pistasFiltradas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎾</div>
                  <h3 style={{ color: colors.text }}>No hay pistas</h3>
                  <p style={{ color: colors.textSecondary }}>
                    {searchTerm || filtroTipoPista !== 'todos'
                      ? 'No se encontraron pistas con los filtros actuales'
                      : 'No hay pistas registradas'}
                  </p>
                  <button
                    className="add-pista-btn"
                    onClick={handleAgregarPista}
                    style={{
                      backgroundColor: colors.success,
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '15px'
                    }}
                  >
                    ➕ Agregar Primera Pista
                  </button>
                </div>
              ) : (
                <table className="pistas-table">
                  <thead>
                    <tr style={{ borderBottomColor: colors.border }}>
                      <th style={{ color: colors.text }}>Nombre</th>
                      <th style={{ color: colors.text }}>Tipo</th>
                      {userRole === 'super_admin' && <th style={{ color: colors.text }}>Polideportivo</th>}
                      <th style={{ color: colors.text }}>Estado</th>
                      <th style={{ color: colors.text }}>Precio/hora</th>
                      <th style={{ color: colors.text }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pistasFiltradas.map(pista => (
                      <tr key={pista.id} style={{ borderBottomColor: colors.border }}>
                        <td style={{ color: colors.text, fontWeight: '500' }}>
                          {getIconoTipoPista(pista.tipo)} {pista.nombre}
                          {pista.descripcion && (
                            <div className="pista-descripcion" style={{ color: colors.textMuted, fontSize: '12px' }}>
                              {pista.descripcion}
                            </div>
                          )}
                        </td>
                        <td style={{ color: colors.textSecondary }}>{pista.tipo}</td>
                        {userRole === 'super_admin' && (
                          <td style={{ color: colors.textSecondary }}>
                            {pista.polideportivo_nombre || 'N/A'}
                          </td>
                        )}
                        <td>
                          <span
                            className="estado-badge"
                            style={{
                              backgroundColor: getPistaEstadoColor(pista) + '20',
                              color: getPistaEstadoColor(pista)
                            }}
                          >
                            {!pista.disponible ? '🔧' : '✅'}
                            {!pista.disponible ? ' Mantenimiento' : ' Disponible'}
                          </span>
                        </td>
                        <td style={{ color: colors.text, fontWeight: 'bold' }}>
                          💰 ${parseFloat(pista.precio || 0).toFixed(2)}
                        </td>
                        <td>
                          <div className="acciones">
                            <button
                              className="accion-btn edit"
                              onClick={() => handleVerDetallesPista(pista)}
                              title="Editar pista (nombre, tipo, precio, descripción)"
                              style={{ backgroundColor: colors.primary + '20' }}
                            >
                              ✏️
                            </button>
                            <button
                              className="accion-btn price"
                              onClick={() => handleCambiarPrecio(pista)}
                              title="Cambiar solo precio"
                              style={{ backgroundColor: colors.success + '20' }}
                            >
                              💰
                            </button>
                            <button
                              className="accion-btn maintenance"
                              onClick={() => toggleMantenimiento(pista)}
                              title={pista.disponible ? 'Poner en mantenimiento' : 'Reactivar pista'}
                              style={{
                                backgroundColor: (pista.disponible ? colors.warning : colors.success) + '20',
                                color: pista.disponible ? colors.warning : colors.success
                              }}
                            >
                              {pista.disponible ? '⚠️' : '🔧'}
                            </button>
                            {userRole === 'super_admin' && (
                              <button
                                className="accion-btn delete"
                                onClick={() => handleEliminarPista(pista.id)}
                                title="Eliminar pista"
                                style={{ backgroundColor: colors.danger + '20' }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Estadísticas (solo para admin_poli) */
            <div className="estadisticas-container" style={{ backgroundColor: colors.card }}>
              <div className="estadisticas-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: colors.text }}>📊 Estadísticas del Polideportivo</h3>
                <button
                  className="refresh-button"
                  onClick={recargarDatos}
                  style={{
                    backgroundColor: colors.surfaceLight,
                    color: colors.text,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer'
                  }}
                  title="Recargar estadísticas"
                >
                  🔄 Actualizar
                </button>
              </div>

              {estadisticas ? (
                <>
                  <div style={{ color: colors.textSecondary, marginBottom: '20px' }}>
                    📅 Periodo: {estadisticas.periodo?.fecha_inicio ? formatFecha(estadisticas.periodo.fecha_inicio) : 'N/A'} - {estadisticas.periodo?.fecha_fin ? formatFecha(estadisticas.periodo.fecha_fin) : 'N/A'}
                  </div>

                  <div className="estadisticas-grid">
                    <div className="estadistica-card" style={{ backgroundColor: colors.surfaceLight }}>
                      <div className="estadistica-icon" style={{ color: colors.primary }}>
                        📅
                      </div>
                      <div className="estadistica-content">
                        <div className="estadistica-number" style={{ color: colors.text }}>
                          {estadisticas.reservas?.total || 0}
                        </div>
                        <div className="estadistica-label" style={{ color: colors.textSecondary }}>
                          Reservas totales
                        </div>
                      </div>
                    </div>

                    <div className="estadistica-card" style={{ backgroundColor: colors.surfaceLight }}>
                      <div className="estadistica-icon" style={{ color: colors.success }}>
                        ✅
                      </div>
                      <div className="estadistica-content">
                        <div className="estadistica-number" style={{ color: colors.text }}>
                          {estadisticas.reservas?.confirmadas || 0}
                        </div>
                        <div className="estadistica-label" style={{ color: colors.textSecondary }}>
                          Confirmadas
                        </div>
                      </div>
                    </div>

                    <div className="estadistica-card" style={{ backgroundColor: colors.surfaceLight }}>
                      <div className="estadistica-icon" style={{ color: colors.danger }}>
                        ❌
                      </div>
                      <div className="estadistica-content">
                        <div className="estadistica-number" style={{ color: colors.text }}>
                          {estadisticas.reservas?.canceladas || 0}
                        </div>
                        <div className="estadistica-label" style={{ color: colors.textSecondary }}>
                          Canceladas
                        </div>
                      </div>
                    </div>

                    <div className="estadistica-card" style={{ backgroundColor: colors.surfaceLight }}>
                      <div className="estadistica-icon" style={{ color: colors.success }}>
                        💰
                      </div>
                      <div className="estadistica-content">
                        <div className="estadistica-number" style={{ color: colors.text }}>
                          ${(estadisticas.ingresos?.total || 0).toFixed(2)}
                        </div>
                        <div className="estadistica-label" style={{ color: colors.textSecondary }}>
                          Ingresos totales
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de pistas */}
                  <div className="pistas-estadisticas">
                    <h4 style={{ color: colors.text }}>Distribución por tipo de pista</h4>
                    <div className="pistas-grid">
                      {Object.entries(estadisticas.pistas?.por_tipo || {}).map(([tipo, cantidad]) => (
                        <div key={tipo} className="pista-tipo-card" style={{ backgroundColor: colors.surfaceLight }}>
                          <div style={{ color: colors.primary, fontWeight: '500' }}>
                            {getIconoTipoPista(tipo)} {tipo}
                          </div>
                          <div className="pista-cantidad" style={{ color: colors.text }}>{cantidad} pistas</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasa de ocupación */}
                  <div className="ocupacion-card" style={{ backgroundColor: colors.surfaceLight }}>
                    <div className="ocupacion-header">
                      📊
                      <span style={{ color: colors.text, fontWeight: '500' }}>Tasa de Ocupación</span>
                    </div>
                    <div className="ocupacion-value" style={{ color: colors.primary }}>
                      {estadisticas.pistas?.tasa_disponibilidad || '0%'}
                    </div>
                    <div className="ocupacion-label" style={{ color: colors.textSecondary }}>
                      Pistas disponibles
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3 style={{ color: colors.text }}>No hay estadísticas disponibles</h3>
                  <p style={{ color: colors.textSecondary }}>
                    Las estadísticas se generarán automáticamente cuando haya actividad en el polideportivo.
                  </p>
                  <button
                    className="refresh-button"
                    onClick={recargarDatos}
                    style={{
                      backgroundColor: colors.primary,
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '15px'
                    }}
                  >
                    🔄 Intentar Recargar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}