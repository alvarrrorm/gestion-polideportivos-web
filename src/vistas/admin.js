import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexto/AuthProvider';
import './AdminPanel.css';

// URLs de la API - CORREGIDAS
const API_BASE = 'https://tfgv2-production.up.railway.app/api';
const PISTAS_URL = `${API_BASE}/pistas`;
const RESERVAS_URL = `${API_BASE}/reservas`;
const POLIDEPORTIVOS_URL = `${API_BASE}/polideportivos`;
const USUARIOS_URL = `${API_BASE}/usuarios`;

export default function AdminPanel({ navigation }) {
  const { user, logout } = useAuth();
  const [pistas, setPistas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [polideportivos, setPolideportivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  const [error, setError] = useState(null);
  
  // Estados para agregar pista
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoPolideportivo, setNuevoPolideportivo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [errorNombreRepetido, setErrorNombreRepetido] = useState('');
  
  // Estados para interfaces
  const [activeTab, setActiveTab] = useState('polideportivos');
  const [modalVisible, setModalVisible] = useState(false);
  const [pistaEditando, setPistaEditando] = useState(null);
  const [precioEditando, setPrecioEditando] = useState('');
  const [modalPolideportivoVisible, setModalPolideportivoVisible] = useState(false);
  const [nuevoPolideportivoNombre, setNuevoPolideportivoNombre] = useState('');
  const [nuevoPolideportivoDireccion, setNuevoPolideportivoDireccion] = useState('');
  const [nuevoPolideportivoTelefono, setNuevoPolideportivoTelefono] = useState('');
  const [modalPistaVisible, setModalPistaVisible] = useState(false);
  const [modalPistaEdicionVisible, setModalPistaEdicionVisible] = useState(false);
  const [filtroPolideportivo, setFiltroPolideportivo] = useState('todos');
  
  // Estados para edición completa de pista
  const [editarNombrePista, setEditarNombrePista] = useState('');
  const [editarTipoPista, setEditarTipoPista] = useState('');
  const [editarPrecioPista, setEditarPrecioPista] = useState('');
  const [editarDescripcionPista, setEditarDescripcionPista] = useState('');
  
  // Estados para gestión de usuarios
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [accionSeleccionada, setAccionSeleccionada] = useState('');
  const [polideportivoSeleccionado, setPolideportivoSeleccionado] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [cambiandoRol, setCambiandoRol] = useState(false);

  // Obtener el nombre del usuario desde el contexto de autenticación
  const usuarioNombre = user?.nombre || user?.usuario || 'Administrador';
  const userRole = user?.rol || 'usuario';
  const token = localStorage.getItem('auth_token');

  // Verificar que el usuario es super_admin
  useEffect(() => {
    if (userRole !== 'super_admin') {
      alert('Acceso denegado. Solo super administradores pueden acceder a esta página.');
      window.location.href = '/reservas';
    }
  }, [userRole]);

  // Tipos de pistas disponibles
  const tiposPista = [
    { label: 'Fútbol', value: 'Fútbol' },
    { label: 'Baloncesto', value: 'Baloncesto' },
    { label: 'Tenis', value: 'Tenis' },
    { label: 'Padel', value: 'Padel' },
    { label: 'Voley', value: 'Voley' },
    { label: 'Futbol Sala', value: 'Futbol Sala' }
  ];

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

  // Función auxiliar para manejar errores de autenticación
  const handleAuthError = useCallback((errorMessage) => {
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      alert('🔐 Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      logout();
      window.location.href = '/login';
      return true;
    }
    return false;
  }, [logout]);

  // Cargar pistas, reservas, polideportivos y usuarios desde la API
  const fetchData = useCallback(async () => {
    if (!token) {
      console.error('❌ No hay token de autenticación');
      setError('No estás autenticado. Por favor, inicia sesión.');
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      setError(null);
      
      const headers = getHeaders();
      
      // Cargar polideportivos primero
      const polideportivosResponse = await fetch(POLIDEPORTIVOS_URL, {
        headers: headers
      });
      
      if (!polideportivosResponse.ok) {
        if (handleAuthError(`Error ${polideportivosResponse.status}: ${await polideportivosResponse.text()}`)) return;
        throw new Error(`Error ${polideportivosResponse.status}: ${await polideportivosResponse.text()}`);
      }
      
      const polideportivosData = await polideportivosResponse.json();
      
      if (!polideportivosData.success || !Array.isArray(polideportivosData.data)) {
        throw new Error('Formato de respuesta inválido para polideportivos');
      }
      
      setPolideportivos(polideportivosData.data);
      
      // Cargar pistas
      const pistasResponse = await fetch(PISTAS_URL, {
        headers: headers
      });
      
      if (!pistasResponse.ok) {
        if (handleAuthError(`Error ${pistasResponse.status}: ${await pistasResponse.text()}`)) return;
        throw new Error(`Error ${pistasResponse.status}: ${await pistasResponse.text()}`);
      }
      
      const pistasData = await pistasResponse.json();
      
      if (!pistasData.success || !Array.isArray(pistasData.data)) {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Asegurarnos de que cada pista tiene el campo 'disponible' procesado correctamente
      const pistasConEstado = pistasData.data.map(pista => ({
        ...pista,
        disponible: pista.disponible === true || pista.disponible === 1
      }));
      
      setPistas(pistasConEstado); 
      
      // Cargar reservas (todas las reservas para super_admin)
      const reservasResponse = await fetch(RESERVAS_URL, {
        headers: headers
      });
      
      if (!reservasResponse.ok) {
        if (handleAuthError(`Error ${reservasResponse.status}: ${await reservasResponse.text()}`)) return;
        throw new Error(`Error ${reservasResponse.status}: ${await reservasResponse.text()}`);
      }
      
      const reservasData = await reservasResponse.json();
      
      if (!reservasData.success || !Array.isArray(reservasData.data)) {
        throw new Error('Formato de respuesta inválido para reservas');
      }
      
      setReservas(reservasData.data);
      
      // Cargar usuarios (solo super_admin puede ver todos) - USAR ENDPOINT ESPECIAL
      try {
        const usuariosResponse = await fetch(`${USUARIOS_URL}/con-poli`, {
          headers: headers
        });
        
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          if (usuariosData.success && Array.isArray(usuariosData.data)) {
            setUsuarios(usuariosData.data);
          }
        } else {
          // Intentar con el endpoint normal
          const usuariosResponseNormal = await fetch(USUARIOS_URL, {
            headers: headers
          });
          
          if (usuariosResponseNormal.ok) {
            const usuariosDataNormal = await usuariosResponseNormal.json();
            if (usuariosDataNormal.success && Array.isArray(usuariosDataNormal.data)) {
              setUsuarios(usuariosDataNormal.data);
            }
          }
        }
      } catch (usuariosError) {
        console.error('Error al cargar usuarios:', usuariosError);
      }
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('No se pudieron cargar los datos: ' + error.message);
      setPistas([]); 
      setReservas([]);
      setPolideportivos([]);
      setUsuarios([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar pistas por polideportivo
  const pistasFiltradas = filtroPolideportivo === 'todos' 
    ? pistas 
    : pistas.filter(pista => pista.polideportivo_id.toString() === filtroPolideportivo);

  // Agrupar pistas por tipo
  const pistasPorTipo = pistasFiltradas.reduce((acc, pista) => {
    const tipo = pista.tipo;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(pista);
    return acc;
  }, {});

  const sections = Object.keys(pistasPorTipo).map(tipo => ({
    title: tipo,
    data: pistasPorTipo[tipo]
  }));

  // Obtener icono según el tipo de pista
  const getIconoTipoPista = (tipo) => {
    switch (tipo) {
      case 'Fútbol':
        return '⚽';
      case 'Baloncesto':
        return '🏀';
      case 'Tenis':
        return '🎾';
      case 'Padel':
        return '🎯';
      case 'Voley':
        return '🏐';
      case 'Futbol Sala':
        return '👟';
      default:
        return '🏟️';
    }
  };

  // ========== FUNCIONES PARA GESTIÓN DE PISTAS ==========

  // ✅ CORREGIDA: Función para cambiar estado de mantenimiento (usa 'disponible' directamente)
  const toggleMantenimiento = async (pista) => {
    if (!pista || !token) return;
    
    // Calcular el nuevo estado: invertir el estado actual
    const nuevoDisponible = !pista.disponible;
    
    const confirmar = window.confirm(
      nuevoDisponible
        ? `¿Reactivar la pista "${pista.nombre}"?`
        : `¿Poner la pista "${pista.nombre}" en mantenimiento?`
    );
    
    if (!confirmar) return;
    
    try {
      console.log(`🛠️ Cambiando estado de pista ${pista.id}:`, {
        actual: pista.disponible,
        nuevo: nuevoDisponible
      });

      // ✅ ENVIAR DIRECTAMENTE EL CAMPO 'disponible'
      const response = await fetch(`${PISTAS_URL}/${pista.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          disponible: nuevoDisponible
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar estado de mantenimiento');
      }
      
      if (data.success && data.data) {
        const actualizado = data.data;
        setPistas(prev => prev.map(p => 
          p.id === pista.id ? { 
            ...p, 
            disponible: actualizado.disponible === true || actualizado.disponible === 1
          } : p
        ));
        
        alert(`✅ Pista ${actualizado.disponible ? 'reactivada' : 'puesta en mantenimiento'} exitosamente`);
      }
      
    } catch (error) {
      console.error('Error cambiando mantenimiento:', error);
      
      if (error.message.includes('403')) {
        alert('❌ Error: No tienes permisos para modificar esta pista');
      } else if (error.message.includes('404')) {
        alert('❌ Error: Pista no encontrada');
      } else if (error.message.includes('401')) {
        alert('❌ Error: Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        window.location.href = '/login';
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    }
  };

  // ✅ FUNCIÓN PARA ELIMINAR PISTA
  const eliminarPista = async (pista) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar la pista "${pista.nombre}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmar) return;
    
    try {
      const response = await fetch(`${PISTAS_URL}/${pista.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          if (data.detalles && data.detalles.reservas) {
            const reservasInfo = data.detalles.reservas
              .map(r => `- ${r.nombre_usuario || 'Usuario'} (${r.fecha} ${r.hora_inicio}) - ${r.estado}`)
              .join('\n');
            
            alert(`❌ No se puede eliminar la pista porque tiene ${data.detalles.total_reservas} reserva(s) activa(s):\n\n${reservasInfo}\n\nCancela primero las reservas o espera a que pasen.`);
          } else {
            alert(`❌ No se puede eliminar la pista porque tiene reservas activas.\n\n${data.error || 'Cancela primero las reservas o espera a que pasen.'}`);
          }
          return;
        }
        
        throw new Error(data.error || 'Error al eliminar la pista');
      }

      if (data.success) {
        setPistas((prevPistas) => prevPistas.filter((p) => p.id !== pista.id));
        alert('✅ Pista eliminada correctamente');
      }
      
    } catch (error) {
      console.error('Error al eliminar pista:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo eliminar la pista'));
    }
  };

  // AGREGAR NUEVA PISTA
  const agregarPista = async () => {
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión.');
      return;
    }

    setErrorNombreRepetido('');
    
    if (!nuevoNombre.trim() || !nuevoTipo || !nuevoPrecio || !nuevoPolideportivo) {
      alert('Error: Nombre, tipo, precio y polideportivo son obligatorios');
      return;
    }

    const precioNumerico = parseFloat(nuevoPrecio);
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      alert('Error: El precio debe ser un número válido mayor a 0');
      return;
    }

    try {
      const pistaData = {
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo,
        precio: precioNumerico,
        polideportivo_id: parseInt(nuevoPolideportivo),
        disponible: true  // Nueva pista siempre disponible
      };

      if (nuevaDescripcion.trim()) {
        pistaData.descripcion = nuevaDescripcion.trim();
      }

      const response = await fetch(PISTAS_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(pistaData),
      });

      const responseData = await response.json();

      if (response.status === 409) {
        setErrorNombreRepetido(responseData.error || 'Ya existe una pista con ese nombre en este polideportivo.');
        return;
      }

      if (!response.ok) {
        throw new Error(responseData.error || `Error ${response.status}: No se pudo crear la pista`);
      }

      if (responseData.success && responseData.data) {
        const nuevaPista = {
          ...responseData.data,
          disponible: responseData.data.disponible === true || responseData.data.disponible === 1
        };
        
        setPistas((prevPistas) => [...prevPistas, nuevaPista]);
        setNuevoNombre('');
        setNuevoTipo('');
        setNuevoPrecio('');
        setNuevaDescripcion('');
        setNuevoPolideportivo('');
        setModalPistaVisible(false);
        alert('✅ Pista agregada correctamente');
      }
      
    } catch (error) {
      console.error('Error al agregar pista:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo agregar la pista'));
    }
  };

  // ABRIR MODAL PARA EDITAR PISTA COMPLETA
  const abrirModalEditarPista = (pista) => {
    setPistaEditando(pista);
    setEditarNombrePista(pista.nombre || '');
    setEditarTipoPista(pista.tipo || '');
    setEditarPrecioPista(pista.precio ? pista.precio.toString() : '');
    setEditarDescripcionPista(pista.descripcion || '');
    setErrorNombreRepetido('');
    setModalPistaEdicionVisible(true);
  };

  // GUARDAR CAMBIOS DE PISTA
  const guardarCambiosPista = async () => {
    if (!pistaEditando || !token) return;
    
    if (!editarNombrePista.trim()) {
      alert('⚠️ El nombre de la pista es obligatorio');
      return;
    }

    if (!editarPrecioPista) {
      alert('⚠️ El precio es obligatorio');
      return;
    }

    const precioNum = parseFloat(editarPrecioPista);
    if (isNaN(precioNum) || precioNum <= 0) {
      alert('⚠️ El precio debe ser un número mayor que 0');
      return;
    }
    
    try {
      const response = await fetch(`${PISTAS_URL}/${pistaEditando.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          nombre: editarNombrePista.trim(),
          tipo: editarTipoPista,
          precio: precioNum,
          descripcion: editarDescripcionPista.trim() || null,
          // Mantener el estado disponible actual
          disponible: pistaEditando.disponible
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
        setPistas(prev => prev.map(p => 
          p.id === pistaEditando.id ? {
            ...responseData.data,
            disponible: responseData.data.disponible === true || responseData.data.disponible === 1
          } : p
        ));
        
        alert('✅ Pista actualizada exitosamente');
        setModalPistaEdicionVisible(false);
        setPistaEditando(null);
        setEditarNombrePista('');
        setEditarTipoPista('');
        setEditarPrecioPista('');
        setEditarDescripcionPista('');
        setErrorNombreRepetido('');
      }
      
    } catch (error) {
      console.error('Error actualizando pista:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // ========== FUNCIONES PARA GESTIÓN DE PRECIO ==========
  const abrirModalEditarPrecio = (pista) => {
    setPistaEditando(pista);
    setPrecioEditando(pista.precio.toString());
    setModalVisible(true);
  };

  const guardarPrecio = async () => {
    if (!pistaEditando || !precioEditando) {
      alert('Error: El precio no puede estar vacío');
      return;
    }

    const precioNumerico = parseFloat(precioEditando);
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      alert('Error: El precio debe ser un número válido mayor a 0');
      return;
    }

    try {
      const response = await fetch(`${PISTAS_URL}/${pistaEditando.id}/precio`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          precio: precioNumerico,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el precio');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setPistas(pistas.map(p => p.id === pistaEditando.id ? {
          ...data.data,
          disponible: data.data.disponible === true || data.data.disponible === 1
        } : p));
        
        setModalVisible(false);
        alert('✅ Precio actualizado correctamente');
      }
      
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo actualizar el precio'));
    }
  };

  // ========== FUNCIONES PARA GESTIÓN DE POLIDEPORTIVOS ==========

  const agregarPolideportivo = async () => {
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión.');
      return;
    }

    if (!nuevoPolideportivoNombre.trim() || !nuevoPolideportivoDireccion.trim()) {
      alert('Error: Nombre y dirección son obligatorios');
      return;
    }

    try {
      const response = await fetch(POLIDEPORTIVOS_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          nombre: nuevoPolideportivoNombre.trim(),
          direccion: nuevoPolideportivoDireccion.trim(),
          telefono: nuevoPolideportivoTelefono.trim() || null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Error ${response.status}`);
      }

      setPolideportivos((prevPolideportivos) => [...prevPolideportivos, responseData.data]);
      
      setNuevoPolideportivoNombre('');
      setNuevoPolideportivoDireccion('');
      setNuevoPolideportivoTelefono('');
      setModalPolideportivoVisible(false);
      alert('✅ Polideportivo agregado correctamente');
    } catch (error) {
      console.error('Error al agregar polideportivo:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo agregar el polideportivo'));
    }
  };

  const eliminarPolideportivo = async (id) => {
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión.');
      return;
    }

    const pistasAsociadas = pistas.filter(pista => pista.polideportivo_id === id);
    
    if (pistasAsociadas.length > 0) {
      alert(`❌ No se puede eliminar: Este polideportivo tiene ${pistasAsociadas.length} pista(s) asociada(s). Elimina primero todas las pistas antes de eliminar el polideportivo.`);
      return;
    }

    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar este polideportivo?');
    if (!confirmar) return;
    
    try {
      const response = await fetch(`${POLIDEPORTIVOS_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el polideportivo');
      }

      setPolideportivos((prevPolideportivos) => prevPolideportivos.filter((polideportivo) => polideportivo.id !== id));
      alert('✅ Polideportivo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar polideportivo:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo eliminar el polideportivo'));
    }
  };

  // ========== FUNCIONES PARA GESTIÓN DE RESERVAS ==========

  const cancelarReserva = async (id) => {
    const confirmar = window.confirm('¿Estás seguro de que deseas cancelar esta reserva?');
    if (!confirmar) return;
    
    try {
      const response = await fetch(`${RESERVAS_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al cancelar la reserva');
      }

      setReservas((prevReservas) => prevReservas.filter((reserva) => reserva.id !== id));
      alert('✅ Reserva cancelada correctamente');
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      alert('❌ Error: No se pudo cancelar la reserva');
    }
  };

  // ========== FUNCIONES PARA GESTIÓN DE USUARIOS ==========

  const abrirModalCambioRol = (usuario, accion, polideportivoId = null) => {
    setUsuarioEditando(usuario);
    setAccionSeleccionada(accion);
    setPolideportivoSeleccionado(polideportivoId || '');
    setPasswordConfirmacion('');
    setModalPasswordVisible(true);
  };

  const cambiarRolUsuario = async () => {
    if (!usuarioEditando || !passwordConfirmacion) {
      alert('❌ Error: Debes ingresar tu contraseña para confirmar');
      return;
    }

    let nuevoRol = '';
    let polideportivoId = null;
    
    switch(accionSeleccionada) {
      case 'admin_global':
        nuevoRol = 'super_admin';
        break;
      case 'admin_poli':
        if (!polideportivoSeleccionado) {
          alert('❌ Error: Debes seleccionar un polideportivo');
          return;
        }
        nuevoRol = 'admin_poli';
        polideportivoId = parseInt(polideportivoSeleccionado);
        break;
      case 'quitar_admin':
        nuevoRol = 'usuario';
        break;
      default:
        alert('❌ Error: Acción no válida');
        return;
    }

    setCambiandoRol(true);
    
    try {
      const response = await fetch(`${USUARIOS_URL}/cambiar-rol/${usuarioEditando.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          nuevoRol: nuevoRol,
          passwordConfirmacion: passwordConfirmacion,
          polideportivo_id: polideportivoId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar rol');
      }

      setUsuarios(prev => prev.map(usuario => 
        usuario.id === usuarioEditando.id 
          ? { 
              ...usuario, 
              rol: nuevoRol,
              polideportivo_id: polideportivoId
            } 
          : usuario
      ));

      setModalPasswordVisible(false);
      setUsuarioEditando(null);
      setPasswordConfirmacion('');
      setAccionSeleccionada('');
      setPolideportivoSeleccionado('');
      
      let mensaje = '';
      if (nuevoRol === 'super_admin') {
        mensaje = `✅ Usuario ${usuarioEditando.nombre} ahora es Super Administrador`;
      } else if (nuevoRol === 'admin_poli') {
        const poliNombre = polideportivos.find(p => p.id === polideportivoId)?.nombre || 'polideportivo';
        mensaje = `✅ Usuario ${usuarioEditando.nombre} ahora es Administrador del ${poliNombre}`;
      } else {
        mensaje = `✅ Usuario ${usuarioEditando.nombre} ahora es Usuario Normal`;
      }
      
      alert(mensaje);
      
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setCambiandoRol(false);
    }
  };

  // ========== FUNCIONES AUXILIARES ==========

  const obtenerNombrePolideportivo = (polideportivoId) => {
    const polideportivo = polideportivos.find(p => p.id === polideportivoId);
    return polideportivo ? polideportivo.nombre : 'Desconocido';
  };

  const obtenerPolideportivoUsuario = (usuario) => {
    if (usuario.polideportivo_id) {
      return obtenerNombrePolideportivo(usuario.polideportivo_id);
    }
    return 'No asignado';
  };

  const obtenerNombreRol = (rol) => {
    switch(rol) {
      case 'super_admin':
        return '👑 Super Admin';
      case 'admin_poli':
        return '🏢 Admin Poli';
      case 'usuario':
        return '👤 Usuario';
      default:
        return rol;
    }
  };

  // ========== RENDERIZADO DE COMPONENTES ==========

  const renderPolideportivoItem = (item) => (
    <div className="polideportivo-card">
      <div className="polideportivo-header">
        <div className="polideportivo-info">
          <div className="polideportivo-nombre">🏟️ {item.nombre}</div>
          <div className="polideportivo-direccion">📍 {item.direccion}</div>
          {item.telefono && (
            <div className="polideportivo-telefono">📞 Tel: {item.telefono}</div>
          )}
        </div>
        <div className="pistas-count-container">
          <span className="pistas-count">
            {pistas.filter(p => p.polideportivo_id === item.id).length} pistas
          </span>
        </div>
      </div>

      <button
        className="boton-accion boton-eliminar"
        onClick={() => eliminarPolideportivo(item.id)}
      >
        🗑️ Eliminar
      </button>
    </div>
  );

  const renderPistaItem = (item) => {
    return (
      <div className="pista-card">
        <div className="pista-header">
          <div className="pista-info">
            <div className="pista-nombre">
              {getIconoTipoPista(item.tipo)} {item.nombre}
              {item.descripcion && (
                <div className="pista-descripcion">{item.descripcion}</div>
              )}
            </div>
            <div className="pista-detalles">
              🏟️ {obtenerNombrePolideportivo(item.polideportivo_id)} • 💰 {item.precio} €/hora
            </div>
          </div>
          <div className="estado-container">
            <div 
              className="estado-indicator"
              style={{ backgroundColor: !item.disponible ? '#FFA500' : '#4CAF50' }}
            />
            <span className="estado-texto">
              {!item.disponible ? '🛠️ En mantenimiento' : '✅ Disponible'}
            </span>
          </div>
        </div>

        <div className="acciones-container">
          <button
            className="boton-accion"
            onClick={() => toggleMantenimiento(item)}
            title={item.disponible ? 'Poner en mantenimiento' : 'Reactivar pista'}
          >
            {item.disponible ? '🔧 Mantenimiento' : '🛠️ Reactivar'}
          </button>

          <button
            className="boton-accion"
            onClick={() => abrirModalEditarPista(item)}
            title="Editar pista completa (nombre, tipo, precio, descripción)"
          >
            ✏️ Editar Pista
          </button>

          <button
            className="boton-accion"
            onClick={() => abrirModalEditarPrecio(item)}
            title="Cambiar solo precio"
          >
            💰 Cambiar Precio
          </button>

          <button
            className="boton-accion boton-eliminar"
            onClick={() => eliminarPista(item)}
            title="Eliminar pista"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>
    );
  };

  const renderReservaItem = (item) => (
    <div className="reserva-card">
      <div className="reserva-header">
        <div className="reserva-info-principal">
          <div className="reserva-nombre-pista">
            {item.pistaNombre || item.pista}
          </div>
          <div className="reserva-tipo">
            {item.pistaTipo || 'Pista'}
          </div>
        </div>
        <div 
          className="estado-reserva"
          style={{ 
            backgroundColor: 
              item.estado === 'confirmada' ? '#4CAF50' : 
              item.estado === 'cancelada' ? '#F44336' : 
              '#FFA500'
          }}
        >
          <span className="estado-reserva-texto">
            {item.estado?.charAt(0).toUpperCase() + item.estado?.slice(1) || 'Pendiente'}
          </span>
        </div>
      </div>
      
      <div className="reserva-info">
        <div className="reserva-texto">👤 Usuario: {item.nombre_usuario || 'Desconocido'}</div>
        <div className="reserva-texto">📅 Fecha: {new Date(item.fecha).toLocaleDateString('es-ES')}</div>
        <div className="reserva-texto">⏰ Hora: {item.hora_inicio} - {item.hora_fin}</div>
        <div className="reserva-texto">
          💰 Precio: {(() => {
            const precioNum = Number(item.precio);
            return isNaN(precioNum) ? '--' : precioNum.toFixed(2);
          })()} €
        </div>
        {item.ludoteca && (
          <div className="reserva-texto reserva-ludoteca">🎯 Incluye ludoteca</div>
        )}
      </div>
      
      <button
        className="boton-accion boton-cancelar"
        onClick={() => cancelarReserva(item.id)}
      >
        ❌ Cancelar
      </button>
    </div>
  );

  const renderSectionHeader = (section) => (
    <div className="section-header">
      <div className="section-header-text">
        {getIconoTipoPista(section.title)} {section.title} ({section.data.length})
      </div>
    </div>
  );

  // FUNCIÓN PARA RENDERIZAR EL CONTENIDO
  const renderContent = () => {
    switch (activeTab) {
      case 'polideportivos':
        return (
          <div className="tab-content">
            <div className="list-header">
              <div className="seccion-header">
                <div className="seccion-titulo">
                  🏟️ Polideportivos ({polideportivos.length})
                </div>
                <button
                  className="boton-agregar"
                  onClick={() => setModalPolideportivoVisible(true)}
                >
                  ➕ Agregar
                </button>
              </div>
            </div>
            
            {polideportivos.length === 0 ? (
              <div className="lista-vacia-container">
                <div className="lista-vacia">
                  No hay polideportivos registrados
                </div>
                <button
                  className="boton-agregar"
                  onClick={() => setModalPolideportivoVisible(true)}
                >
                  ➕ Agregar Primer Polideportivo
                </button>
              </div>
            ) : (
              <div className="list-content polideportivos-grid">
                {polideportivos.map((item) => (
                  <div key={item.id.toString()}>
                    {renderPolideportivoItem(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'pistas':
        return (
          <div className="tab-content">
            <div className="list-header">
              <div className="seccion-header">
                <div className="seccion-titulo">
                  🎾 Pistas ({pistasFiltradas.length})
                </div>
                <button
                  className="boton-agregar"
                  onClick={() => setModalPistaVisible(true)}
                >
                  ➕ Agregar Pista
                </button>
              </div>

              <div className="filtro-container">
                <div className="filtro-label">
                  Filtrar por polideportivo:
                </div>
                <div className="filtro-botones">
                  <button
                    className={`filtro-boton ${filtroPolideportivo === 'todos' ? 'filtro-boton-activo' : ''}`}
                    onClick={() => setFiltroPolideportivo('todos')}
                  >
                    Todos
                  </button>
                  {polideportivos.map(polideportivo => (
                    <button
                      key={polideportivo.id}
                      className={`filtro-boton ${filtroPolideportivo === polideportivo.id.toString() ? 'filtro-boton-activo' : ''}`}
                      onClick={() => setFiltroPolideportivo(polideportivo.id.toString())}
                    >
                      {polideportivo.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {pistasFiltradas.length === 0 ? (
              <div className="lista-vacia-container">
                <div className="lista-vacia">
                  {filtroPolideportivo === 'todos' 
                    ? 'No hay pistas registradas' 
                    : 'No hay pistas en este polideportivo'
                  }
                </div>
                <div className="lista-vacia-subtexto">
                  {filtroPolideportivo === 'todos' 
                    ? 'Agrega tu primera pista usando el botón superior' 
                    : 'Cambia el filtro o agrega pistas a este polideportivo'
                  }
                </div>
              </div>
            ) : (
              <div className="list-content">
                {sections.map((section, index) => (
                  <div key={`section-${index}`}>
                    {renderSectionHeader(section)}
                    {section.data.map((pista) => (
                      <div key={pista.id}>
                        {renderPistaItem(pista)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'reservas':
        return (
          <div className="tab-content">
            <div className="list-header">
              <div className="seccion-titulo">
                📋 Reservas Activas ({reservas.length})
              </div>
            </div>
            
            {reservas.length === 0 ? (
              <div className="lista-vacia-container">
                <div className="lista-vacia">
                  No hay reservas activas
                </div>
                <div className="lista-vacia-subtexto">
                  Las reservas aparecerán aquí cuando los usuarios realicen reservas
                </div>
              </div>
            ) : (
              <div className="list-content">
                {reservas.map((item) => (
                  <div key={item.id.toString()}>
                    {renderReservaItem(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'usuarios':
        return (
          <div className="tab-content">
            <div className="list-header">
              <div className="seccion-header">
                <div className="seccion-titulo">
                  👥 Gestión de Usuarios ({usuarios.length})
                </div>
              </div>
            </div>

            {usuarios.length === 0 ? (
              <div className="lista-vacia-container">
                <div className="lista-vacia">
                  No hay usuarios registrados
                </div>
              </div>
            ) : (
              <div className="usuarios-table-container">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>DNI</th>
                      <th>Teléfono</th>
                      <th>Fecha Registro</th>
                      <th>Rol</th>
                      <th>Polideportivo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(usuario => (
                      <tr key={usuario.id} className="usuario-row">
                        <td>{usuario.nombre}</td>
                        <td>{usuario.usuario}</td>
                        <td>{usuario.correo}</td>
                        <td>{usuario.dni}</td>
                        <td>{usuario.telefono || 'No'}</td>
                        <td>
                          {usuario.fecha_creacion 
                            ? new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')
                            : 'N/A'
                          }
                        </td>
                        <td>
                          <span className={`rol-badge ${usuario.rol === 'super_admin' ? 'rol-admin' : 
                                            usuario.rol === 'admin_poli' ? 'rol-admin-poli' : 'rol-user'}`}>
                            {obtenerNombreRol(usuario.rol)}
                          </span>
                        </td>
                        <td>
                          {usuario.rol === 'admin_poli' ? (
                            <span className="polideportivo-info">
                              {obtenerPolideportivoUsuario(usuario)}
                            </span>
                          ) : (
                            <span className="polideportivo-info">-</span>
                          )}
                        </td>
                        <td>
                          <div className="acciones-usuario">
                            {usuario.rol === 'usuario' ? (
                              <>
                                <button
                                  className="boton-accion boton-hacer-admin"
                                  onClick={() => abrirModalCambioRol(usuario, 'admin_global')}
                                  title="Hacer Super Administrador"
                                >
                                  👑 Super Admin
                                </button>
                                <button
                                  className="boton-accion boton-admin-poli"
                                  onClick={() => abrirModalCambioRol(usuario, 'admin_poli')}
                                  title="Hacer Administrador de Polideportivo"
                                >
                                  🏢 Admin Poli
                                </button>
                              </>
                            ) : usuario.rol === 'admin_poli' ? (
                              <>
                                <button
                                  className="boton-accion boton-hacer-admin"
                                  onClick={() => abrirModalCambioRol(usuario, 'admin_global')}
                                  title="Hacer Super Administrador"
                                >
                                  👑 Super Admin
                                </button>
                                <button
                                  className="boton-accion boton-quitar-admin"
                                  onClick={() => abrirModalCambioRol(usuario, 'quitar_admin')}
                                  disabled={usuario.id === user?.id}
                                  title={usuario.id === user?.id ? "No puedes quitarte a ti mismo los privilegios" : "Quitar administrador de polideportivo"}
                                >
                                  👤 Quitar Admin
                                </button>
                              </>
                            ) : usuario.rol === 'super_admin' ? (
                              <button
                                className="boton-accion boton-quitar-admin"
                                onClick={() => abrirModalCambioRol(usuario, 'quitar_admin')}
                                disabled={usuario.id === user?.id}
                                title={usuario.id === user?.id ? "No puedes quitarte a ti mismo los privilegios" : "Quitar super administrador"}
                              >
                                👤 Quitar Super Admin
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (userRole !== 'super_admin') {
    return (
      <div className="error-container">
        <h2>Acceso Denegado</h2>
        <p>Solo los super administradores pueden acceder a esta página.</p>
        <button 
          className="btn-reintentar"
          onClick={() => window.location.href = '/reservas'}
        >
          Volver
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
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
            onClick={() => window.location.href = '/login'}
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="error-container">
        <h2>No autenticado</h2>
        <p>Por favor, inicia sesión como administrador para acceder a este panel.</p>
        <button 
          className="btn-reintentar"
          onClick={() => window.location.href = '/login'}
        >
          Ir al Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <div className="loading-text">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Modal para agregar pista */}
      {modalPistaVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">🎾 Agregar Nueva Pista</div>
            
            <input
              className="modal-input"
              placeholder="Nombre de la pista"
              value={nuevoNombre}
              onChange={(e) => {
                setNuevoNombre(e.target.value);
                setErrorNombreRepetido('');
              }}
            />
            {errorNombreRepetido && (
              <div className="error-texto">{errorNombreRepetido}</div>
            )}

            <select
              className="modal-select"
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
            >
              <option value="">Seleccionar tipo</option>
              {tiposPista.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>

            <select
              className="modal-select"
              value={nuevoPolideportivo}
              onChange={(e) => setNuevoPolideportivo(e.target.value)}
            >
              <option value="">Seleccionar polideportivo</option>
              {polideportivos.map(polideportivo => (
                <option key={polideportivo.id} value={polideportivo.id}>
                  {polideportivo.nombre}
                </option>
              ))}
            </select>

            <input
              className="modal-input"
              placeholder="Precio por hora (€)"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              type="number"
              min="0"
              step="0.01"
            />

            <textarea
              className="modal-textarea"
              placeholder="Descripción (opcional)"
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              rows="3"
            />

            <div className="modal-buttons">
              <button
                className="modal-button modal-button-cancel"
                onClick={() => {
                  setModalPistaVisible(false);
                  setNuevoNombre('');
                  setNuevoTipo('');
                  setNuevoPrecio('');
                  setNuevaDescripcion('');
                  setNuevoPolideportivo('');
                  setErrorNombreRepetido('');
                }}
              >
                Cancelar
              </button>
              <button
                className={`modal-button modal-button-save ${(!nuevoNombre.trim() || !nuevoTipo || !nuevoPrecio || !nuevoPolideportivo) ? 'boton-disabled' : ''}`}
                onClick={agregarPista}
                disabled={!nuevoNombre.trim() || !nuevoTipo || !nuevoPrecio || !nuevoPolideportivo}
              >
                Agregar Pista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar precio */}
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Editar Precio</div>
            <div className="modal-pista-nombre">
              {pistaEditando?.nombre}
            </div>
            <div className="modal-polideportivo-info">
              {obtenerNombrePolideportivo(pistaEditando?.polideportivo_id)}
            </div>
            
            <input
              className="modal-input"
              placeholder="Nuevo precio"
              value={precioEditando}
              onChange={(e) => setPrecioEditando(e.target.value)}
              type="number"
              min="0"
              step="0.01"
            />
            
            <div className="modal-buttons">
              <button
                className="modal-button modal-button-cancel"
                onClick={() => setModalVisible(false)}
              >
                Cancelar
              </button>
              <button
                className="modal-button modal-button-save"
                onClick={guardarPrecio}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar pista completa */}
      {modalPistaEdicionVisible && pistaEditando && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">✏️ Editar Pista</div>
            
            <input
              className="modal-input"
              placeholder="Nombre de la pista"
              value={editarNombrePista}
              onChange={(e) => {
                setEditarNombrePista(e.target.value);
                setErrorNombreRepetido('');
              }}
            />
            {errorNombreRepetido && (
              <div className="error-texto">{errorNombreRepetido}</div>
            )}

            <select
              className="modal-select"
              value={editarTipoPista}
              onChange={(e) => setEditarTipoPista(e.target.value)}
            >
              <option value="">Seleccionar tipo</option>
              {tiposPista.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>

            <input
              className="modal-input"
              placeholder="Precio por hora (€)"
              value={editarPrecioPista}
              onChange={(e) => setEditarPrecioPista(e.target.value)}
              type="number"
              min="0"
              step="0.01"
            />

            <textarea
              className="modal-textarea"
              placeholder="Descripción (opcional)"
              value={editarDescripcionPista}
              onChange={(e) => setEditarDescripcionPista(e.target.value)}
              rows="3"
            />

            <div className="modal-buttons">
              <button
                className="modal-button modal-button-cancel"
                onClick={() => {
                  setModalPistaEdicionVisible(false);
                  setPistaEditando(null);
                  setEditarNombrePista('');
                  setEditarTipoPista('');
                  setEditarPrecioPista('');
                  setEditarDescripcionPista('');
                  setErrorNombreRepetido('');
                }}
              >
                Cancelar
              </button>
              <button
                className="modal-button modal-button-save"
                onClick={guardarCambiosPista}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar polideportivo */}
      {modalPolideportivoVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">🏟️ Agregar Polideportivo</div>
            
            <input
              className="modal-input"
              placeholder="Nombre del polideportivo"
              value={nuevoPolideportivoNombre}
              onChange={(e) => setNuevoPolideportivoNombre(e.target.value)}
            />
            
            <input
              className="modal-input"
              placeholder="Dirección"
              value={nuevoPolideportivoDireccion}
              onChange={(e) => setNuevoPolideportivoDireccion(e.target.value)}
            />

            <input
              className="modal-input"
              placeholder="Teléfono (opcional)"
              value={nuevoPolideportivoTelefono}
              onChange={(e) => setNuevoPolideportivoTelefono(e.target.value)}
              type="tel"
            />
            
            <div className="modal-buttons">
              <button
                className="modal-button modal-button-cancel"
                onClick={() => {
                  setModalPolideportivoVisible(false);
                  setNuevoPolideportivoNombre('');
                  setNuevoPolideportivoDireccion('');
                  setNuevoPolideportivoTelefono('');
                }}
              >
                Cancelar
              </button>
              <button
                className="modal-button modal-button-save"
                onClick={agregarPolideportivo}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar cambio de rol */}
      {modalPasswordVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">🔐 Confirmar Cambio de Rol</div>
            
            <div className="modal-usuario-info">
              <strong>Usuario:</strong> {usuarioEditando?.nombre} ({usuarioEditando?.usuario})
            </div>
            
            <div className="modal-rol-info">
              <strong>Cambiando a:</strong> 
              <span className={`rol-badge ${accionSeleccionada === 'admin_global' ? 'rol-admin' : 
                                  accionSeleccionada === 'admin_poli' ? 'rol-admin-poli' : 'rol-user'}`}>
                {accionSeleccionada === 'admin_global' ? '👑 Super Administrador' : 
                 accionSeleccionada === 'admin_poli' ? '🏢 Administrador de Polideportivo' : 
                 '👤 Usuario Normal'}
              </span>
            </div>

            {accionSeleccionada === 'admin_poli' && (
              <div className="modal-seleccion-poli">
                <label className="modal-label">Seleccionar Polideportivo:</label>
                <select
                  className="modal-select"
                  value={polideportivoSeleccionado}
                  onChange={(e) => setPolideportivoSeleccionado(e.target.value)}
                >
                  <option value="">Seleccionar polideportivo</option>
                  {polideportivos.map(polideportivo => (
                    <option key={polideportivo.id} value={polideportivo.id}>
                      {polideportivo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="modal-advertencia">
              ⚠️ Para realizar esta acción, debes confirmar tu contraseña de administrador.
            </div>

            <input
              className="modal-input"
              type="password"
              placeholder="Tu contraseña de administrador"
              value={passwordConfirmacion}
              onChange={(e) => setPasswordConfirmacion(e.target.value)}
              autoComplete="current-password"
            />

            <div className="modal-buttons">
              <button
                className="modal-button modal-button-cancel"
                onClick={() => {
                  setModalPasswordVisible(false);
                  setPasswordConfirmacion('');
                  setUsuarioEditando(null);
                  setAccionSeleccionada('');
                  setPolideportivoSeleccionado('');
                }}
                disabled={cambiandoRol}
              >
                Cancelar
              </button>
              <button
                className={`modal-button modal-button-save ${!passwordConfirmacion || (accionSeleccionada === 'admin_poli' && !polideportivoSeleccionado) ? 'boton-disabled' : ''}`}
                onClick={cambiarRolUsuario}
                disabled={!passwordConfirmacion || (accionSeleccionada === 'admin_poli' && !polideportivoSeleccionado) || cambiandoRol}
              >
                {cambiandoRol ? 'Cambiando...' : 'Confirmar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-top">
            <button
              onClick={() => window.history.back()}
              className="back-button"
            >
              ← Volver
            </button>
            
            <div className="welcome-text">
              Panel de Super Administración 👑
            </div>
          </div>
          
          <div className="username">Super Admin: {usuarioNombre}</div>
          
          {/* Tabs de navegación */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'polideportivos' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('polideportivos')}
            >
              🏟️ Polideportivos
            </button>
            
            <button
              className={`tab-button ${activeTab === 'pistas' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('pistas')}
            >
              🎾 Pistas
            </button>
            
            <button
              className={`tab-button ${activeTab === 'reservas' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('reservas')}
            >
              📋 Reservas
            </button>
            
            <button
              className={`tab-button ${activeTab === 'usuarios' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('usuarios')}
            >
              👥 Usuarios
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="content">
        {renderContent()}
      </div>
    </div>
  );
}