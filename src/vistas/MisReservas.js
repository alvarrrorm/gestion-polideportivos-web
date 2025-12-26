import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  
  // Referencia para el intervalo de verificación automática
  const intervaloRef = useRef(null);

  // Obtener datos del usuario
  const usuario = user?.usuario || '';
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

  // 👇 FUNCIÓN AUXILIAR PARA ACTUALIZAR LISTAS DESPUÉS DE CANCELAR
  const actualizarListasDespuesDeCancelar = (reservaId, esAutomatica = false) => {
    // Buscar la reserva en activas
    let reservaEncontrada = reservasActivas.find(r => r.id === reservaId);
    let origen = 'activas';
    
    // Si no está en activas, buscar en confirmadas
    if (!reservaEncontrada) {
      reservaEncontrada = reservasConfirmadas.find(r => r.id === reservaId);
      origen = 'confirmadas';
    }
    
    // Si tampoco está en confirmadas, buscar en historial
    if (!reservaEncontrada) {
      reservaEncontrada = reservasHistorial.find(r => r.id === reservaId);
      origen = 'historial';
    }
    
    if (reservaEncontrada) {
      // Crear versión cancelada
      const reservaCancelada = {
        ...reservaEncontrada,
        estado: 'cancelada',
        motivo_cancelacion: esAutomatica ? 'Tiempo expirado (más de 1 hora pendiente)' : 'Cancelada por el usuario'
      };
      
      // Actualizar listas
      if (origen === 'activas') {
        setReservasActivas(prev => prev.filter(r => r.id !== reservaId));
      } else if (origen === 'confirmadas') {
        setReservasConfirmadas(prev => prev.filter(r => r.id !== reservaId));
      } else {
        setReservasHistorial(prev => prev.filter(r => r.id !== reservaId));
      }
      
      // Agregar al historial
      setReservasHistorial(prev => [reservaCancelada, ...prev]);
      
      console.log(`📝 Reserva ${reservaId} movida al historial (${esAutomatica ? 'cancelación automática' : 'cancelación manual'})`);
    } else {
      console.warn(`⚠️ Reserva ${reservaId} no encontrada en ninguna lista`);
    }
  };

  // 👇 FUNCIÓN MEJORADA PARA CANCELAR RESERVAS (PENDIENTES Y CONFIRMADAS)
  const handleCancelar = async (reservaId, e) => {
    e.stopPropagation();
    
    // Obtener información de la reserva para mostrar en el mensaje
    const todasReservas = [...reservasActivas, ...reservasConfirmadas, ...reservasHistorial];
    const reserva = todasReservas.find(r => r.id === reservaId);
    
    if (!reserva) {
      alert('❌ No se encontró la reserva');
      return;
    }
    
    const mensajeConfirmacion = reserva.estado === 'confirmada' 
      ? `¿Estás seguro de que quieres cancelar esta reserva CONFIRMADA?\n\nDetalles:\n• ${reserva.pistaNombre || 'Pista'} - ${reserva.fecha} ${reserva.hora_inicio}\n• Precio: €${parseFloat(reserva.precio || 0).toFixed(2)}\n\n⚠️ Esta acción no se puede deshacer.`
      : `¿Estás seguro de que quieres cancelar esta reserva PENDIENTE?\n\nEsta acción no se puede deshacer.`;
    
    if (!window.confirm(mensajeConfirmacion)) {
      return;
    }

    setCancelando(prev => ({ ...prev, [reservaId]: true }));

    try {
      console.log(`❌ Intentando cancelar reserva ID: ${reservaId}, Estado actual: ${reserva.estado}`);
      
      const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${reservaId}/cancelar`, {
        method: 'PUT',
        headers: getHeaders()
      });

      const data = await response.json();
      
      console.log('📊 Respuesta de cancelación:', data);

      if (!response.ok || !data.success) {
        // Verificar si ya está cancelada
        if (data.error && (data.error.includes('ya no está pendiente') || data.error.includes('cancelada'))) {
          if (reserva.estado === 'cancelada') {
            alert('⚠️ Esta reserva ya estaba cancelada.');
          } else {
            alert('⚠️ Esta reserva ya no se puede cancelar (posiblemente ya fue procesada).');
          }
          actualizarListasDespuesDeCancelar(reservaId);
          return;
        }
        throw new Error(data.error || 'Error al cancelar la reserva');
      }

      // Mostrar mensaje diferente según el estado original
      if (reserva.estado === 'confirmada') {
        alert(`✅ Reserva confirmada cancelada correctamente.\n\nSe ha liberado el espacio para que otras personas puedan reservar.`);
      } else {
        alert('✅ Reserva pendiente cancelada correctamente.');
      }
      
      // Actualizar todas las listas después de cancelar
      actualizarListasDespuesDeCancelar(reservaId);

    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      
      // Mensaje de error más específico
      let mensajeError = `❌ Error al cancelar: ${error.message}`;
      
      if (error.message.includes('permisos')) {
        mensajeError += '\n\nNo tienes permisos para cancelar esta reserva.';
      } else if (error.message.includes('404')) {
        mensajeError += '\n\nLa reserva no fue encontrada en el sistema.';
      } else if (error.message.includes('conexión')) {
        mensajeError += '\n\nPor favor, verifica tu conexión a internet e intenta nuevamente.';
      }
      
      alert(mensajeError);
    } finally {
      setCancelando(prev => ({ ...prev, [reservaId]: false }));
    }
  };

  // Cargar reservas - VERSIÓN CORREGIDA CON MANEJO DE ERRORES DE FECHA
  useEffect(() => {
    const fetchReservas = async () => {
      console.log('🔄 Iniciando carga de reservas...');
      console.log('👤 Usuario ID:', userId);
      console.log('🔑 Token disponible:', token ? 'Sí' : 'No');

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
        
        const endpoint = `https://tfgv2-production.up.railway.app/api/reservas/mis-reservas`;
        console.log('📡 Endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: getHeaders()
        });
        
        console.log('📊 Status de respuesta:', response.status, response.statusText);
        
        const data = await response.json();
        
        console.log('📦 Datos recibidos del servidor:', data);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('❌ Token expirado o inválido');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
          throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        if (!data.success) {
          throw new Error(data.error || 'Error al obtener reservas');
        }

        // Procesar reservas recibidas
        console.log('📋 Datos a procesar:', data.data);
        processReservas(data.data || []);

      } catch (error) {
        console.error('❌ Error cargando reservas:', error);
        setError(error.message || 'Error al cargar las reservas. Por favor, verifica tu conexión.');
      } finally {
        setLoading(false);
      }
    };

    // 🎯 FUNCIÓN CORREGIDA PARA PROCESAR RESERVAS CON ZONA HORARIA
    const processReservas = (todasReservas) => {
      console.log('🔧 Procesando reservas recibidas:', todasReservas.length);
      
      // DEBUG: Mostrar todas las reservas recibidas
      todasReservas.forEach((reserva, index) => {
        console.log(`📋 Reserva ${index + 1}:`, {
          id: reserva.id,
          estado: reserva.estado,
          fecha: reserva.fecha,
          hora_inicio: reserva.hora_inicio,
          pistaNombre: reserva.pistaNombre || reserva.pistas?.nombre,
          pistaTipo: reserva.pistaTipo || reserva.pistas?.tipo,
          polideportivo_nombre: reserva.polideportivo_nombre || reserva.polideportivos?.nombre,
          precio: reserva.precio,
          usuario_id: reserva.usuario_id,
          hora_creacion: reserva.hora_creacion,
          created_at: reserva.created_at
        });
      });
      
      // 🎯 OBTENER HORA ACTUAL CORRECTAMENTE (local del navegador)
      const ahora = new Date();
      console.log('⏰ Fecha/hora actual LOCAL (navegador):', ahora.toString());
      console.log('⏰ Fecha/hora actual UTC:', ahora.toISOString());
      console.log('🌍 Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log('🕒 Diferencia UTC (horas):', ahora.getTimezoneOffset() / 60);
      
      // Inicializar arrays
      const activas = [];
      const confirmadas = [];
      const historial = [];
      
      // Procesar cada reserva individualmente
      todasReservas.forEach((reserva) => {
        try {
          // Verificar que la reserva tenga fecha y hora
          if (!reserva.fecha || !reserva.hora_inicio) {
            console.warn('⚠️ Reserva sin fecha/hora:', reserva.id);
            historial.push(reserva);
            return;
          }
          
          // 🎯 Crear fecha de reserva en la zona horaria LOCAL del usuario
          let fechaReservaLocal;
          try {
            // Separar fecha y hora de la reserva
            const [anio, mes, dia] = reserva.fecha.split('-').map(Number);
            
            // Extraer hora y minutos (ignorar segundos si existen)
            const [horaStr, minutoStr] = reserva.hora_inicio.split(':');
            const horas = parseInt(horaStr);
            const minutos = parseInt(minutoStr || '0');
            
            // 🎯 IMPORTANTE: Crear fecha en zona horaria LOCAL (no UTC)
            // Esto asegura que 08:00 en España sea 08:00, no 07:00 UTC
            fechaReservaLocal = new Date(anio, mes - 1, dia, horas, minutos, 0);
            
            // Verificar si la fecha es válida
            if (isNaN(fechaReservaLocal.getTime())) {
              console.warn(`⚠️ Fecha inválida para reserva ${reserva.id}:`, reserva.fecha, reserva.hora_inicio);
              historial.push(reserva);
              return;
            }
            
            console.log(`Reserva ${reserva.id}:`, {
              fechaOriginal: reserva.fecha,
              horaOriginal: reserva.hora_inicio,
              fechaReservaLocal: fechaReservaLocal.toString(),
              fechaReservaISO: fechaReservaLocal.toISOString(),
              ahoraLocal: ahora.toString(),
              ahoraISO: ahora.toISOString(),
              esFutura: fechaReservaLocal > ahora, // Usar > en lugar de >=
              diferenciaMinutos: (fechaReservaLocal.getTime() - ahora.getTime()) / (1000 * 60),
              estado: reserva.estado
            });
            
            // 🎯 CLASIFICAR LA RESERVA CON LÓGICA CORREGIDA
            if (reserva.estado === 'cancelada') {
              // Reservas canceladas van directamente al historial
              historial.push(reserva);
            } else if (fechaReservaLocal > ahora) {
              // 🎯 Es futura (fecha de reserva > hora actual)
              if (reserva.estado === 'confirmada') {
                confirmadas.push(reserva);
              } else if (reserva.estado === 'pendiente') {
                activas.push(reserva);
              } else {
                historial.push(reserva);
              }
            } else {
              // 🎯 Es pasada o presente (fecha de reserva <= hora actual)
              // Todas las reservas pasadas van al historial
              historial.push(reserva);
            }
            
          } catch (fechaError) {
            console.error(`❌ Error procesando fecha para reserva ${reserva.id}:`, fechaError);
            historial.push(reserva);
          }
          
        } catch (e) {
          console.error(`❌ Error general procesando reserva ${reserva.id}:`, e);
          historial.push(reserva);
        }
      });
      
      console.log('✅ Reservas activas encontradas:', activas.length);
      setReservasActivas(activas);

      console.log('✅ Reservas confirmadas encontradas:', confirmadas.length);
      setReservasConfirmadas(confirmadas);

      console.log('📜 Reservas en historial:', historial.length);
      setReservasHistorial(historial);
      
      // DEBUG: Resumen final
      console.log('📊 RESUMEN FINAL:');
      console.log('   Activas:', activas.length);
      console.log('   Confirmadas:', confirmadas.length);
      console.log('   Historial:', historial.length);
      console.log('   Total procesadas:', todasReservas.length);
      
      // Mostrar ejemplos de clasificación
      if (todasReservas.length > 0) {
        console.log('📝 EJEMPLOS DE CLASIFICACIÓN:');
        const ejemploActiva = activas[0];
        const ejemploConfirmada = confirmadas[0];
        const ejemploHistorial = historial[0];
        
        if (ejemploActiva) {
          console.log('   Activa:', {
            id: ejemploActiva.id,
            fecha: ejemploActiva.fecha,
            hora: ejemploActiva.hora_inicio,
            estado: ejemploActiva.estado
          });
        }
        if (ejemploConfirmada) {
          console.log('   Confirmada:', {
            id: ejemploConfirmada.id,
            fecha: ejemploConfirmada.fecha,
            hora: ejemploConfirmada.hora_inicio,
            estado: ejemploConfirmada.estado
          });
        }
        if (ejemploHistorial) {
          console.log('   Historial:', {
            id: ejemploHistorial.id,
            fecha: ejemploHistorial.fecha,
            hora: ejemploHistorial.hora_inicio,
            estado: ejemploHistorial.estado
          });
        }
      }
    };

    if (token) {
      console.log('🚀 Iniciando carga de reservas...');
      fetchReservas();
    } else {
      console.log('⚠️ No hay token disponible');
      setLoading(false);
      setError('No estás autenticado. Por favor, inicia sesión.');
    }
  }, [userId, token, navigate]);

  // 👇 FUNCIÓN CORREGIDA PARA CANCELAR RESERVA AUTOMÁTICAMENTE SI LLEVA MÁS DE 1 HORA PENDIENTE
  const verificarCancelacionAutomatica = async () => {
    if (!token || reservasActivas.length === 0) return;
    
    // 🎯 Obtener hora actual CORRECTA (local del navegador)
    const ahora = new Date();
    console.log('🔄 Verificación automática - Hora actual:', ahora.toString());
    
    // 🎯 Calcular 1 hora atrás usando la misma referencia de tiempo
    const unaHoraAtras = new Date(ahora.getTime() - (60 * 60 * 1000));
    
    console.log('⏰ Verificando cancelación automática de reservas (1 hora)...');
    console.log('   Hora actual:', ahora.toString());
    console.log('   1 hora atrás:', unaHoraAtras.toString());
    
    // Filtrar reservas pendientes que tengan más de 1 hora desde su creación
    const reservasParaCancelar = reservasActivas.filter(reserva => {
      if (reserva.estado !== 'pendiente') return false;
      
      try {
        // 🎯 Obtener fecha de creación de la reserva CORRECTAMENTE
        const fechaCreacionStr = reserva.created_at || reserva.hora_creacion || reserva.fecha_creacion;
        
        if (!fechaCreacionStr) {
          console.warn(`⚠️ Reserva ${reserva.id} sin fecha de creación`);
          return false;
        }
        
        // 🎯 Convertir la fecha de creación a objeto Date
        let fechaCreacion;
        if (typeof fechaCreacionStr === 'string') {
          // Intentar parsear diferentes formatos de fecha
          if (fechaCreacionStr.includes('T')) {
            // Formato ISO
            fechaCreacion = new Date(fechaCreacionStr);
          } else {
            // Formato personalizado 'YYYY-MM-DD HH:MM:SS'
            const [fecha, hora] = fechaCreacionStr.split(' ');
            const [anio, mes, dia] = fecha.split('-').map(Number);
            const [horas, minutos, segundos] = hora.split(':').map(Number);
            fechaCreacion = new Date(anio, mes - 1, dia, horas, minutos, segundos || 0);
          }
        } else {
          fechaCreacion = new Date(fechaCreacionStr);
        }
        
        // Verificar que la fecha sea válida
        if (isNaN(fechaCreacion.getTime())) {
          console.warn(`⚠️ Fecha de creación inválida para reserva ${reserva.id}:`, fechaCreacionStr);
          return false;
        }
        
        const tiempoTranscurrido = ahora.getTime() - fechaCreacion.getTime();
        const minutosTranscurridos = Math.floor(tiempoTranscurrido / (1000 * 60));
        const horasTranscurridas = minutosTranscurridos / 60;
        
        console.log(`Reserva ${reserva.id}: Creada el ${fechaCreacion.toString()}`);
        console.log(`   Tiempo transcurrido: ${minutosTranscurridos} minutos (${horasTranscurridas.toFixed(2)} horas)`);
        
        // 🎯 Verificar si pasó más de 1 hora
        const masDeUnaHora = tiempoTranscurrido > ( 60 * 1000);
        
        if (masDeUnaHora) {
          console.log(`   ⚠️ Pendiente por más de 1 hora: ${horasTranscurridas.toFixed(2)} horas`);
        }
        
        return masDeUnaHora;
      } catch (e) {
        console.error(`Error verificando fecha de creación para reserva ${reserva.id}:`, e);
        return false;
      }
    });
    
    if (reservasParaCancelar.length === 0) {
      console.log('✅ No hay reservas pendientes con más de 1 hora');
      return;
    }
    
    console.log(`🔄 Encontradas ${reservasParaCancelar.length} reservas para cancelar automáticamente`);
    
    // Cancelar cada reserva pendiente con más de 1 hora
    for (const reserva of reservasParaCancelar) {
      try {
        console.log(`⏰ Cancelando automáticamente reserva ID: ${reserva.id} (creada hace más de 1 hora)`);
        
        const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${reserva.id}/cancelar`, {
          method: 'PUT',
          headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ Reserva ${reserva.id} cancelada automáticamente por tiempo expirado (más de 1 hora pendiente)`);
          
          // Actualizar estado localmente
          actualizarListasDespuesDeCancelar(reserva.id, true);
          
          // Notificar al usuario
          if (reservasParaCancelar.length === 1) {
            alert('ℹ️ Se ha cancelado automáticamente una reserva pendiente que llevaba más de 1 hora');
          }
        } else {
          console.warn(`⚠️ No se pudo cancelar automáticamente reserva ${reserva.id}:`, data.error);
        }
      } catch (error) {
        console.error(`❌ Error cancelando automáticamente reserva ${reserva.id}:`, error);
      }
    }
  };

  // 👇 EFECTO PARA VERIFICACIÓN PERIÓDICA DE CANCELACIÓN AUTOMÁTICA
  useEffect(() => {
    if (!token) return;
    
    // Configurar intervalo para verificar cada 5 minutos
    intervaloRef.current = setInterval(() => {
      verificarCancelacionAutomatica();
    }, 5 * 60 * 1000); // 5 minutos
    
    // Verificar inmediatamente al cargar
    verificarCancelacionAutomatica();
    
    // Limpiar intervalo al desmontar el componente
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [reservasActivas, token]);

  // 🎯 FUNCIÓN PARA FORMATO DE FECHA
  const formatearFecha = (fechaStr) => {
    try {
      if (!fechaStr) return 'Fecha no disponible';
      
      const [anio, mes, dia] = fechaStr.split('-');
      const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      
      if (isNaN(fecha.getTime())) {
        return fechaStr;
      }
      
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formateando fecha:', e, fechaStr);
      return fechaStr;
    }
  };

  // 🎯 FUNCIÓN CORREGIDA PARA FORMATO DE FECHA CON HORA
  const formatearFechaParaTarjeta = (fechaStr, horaInicio) => {
    try {
      if (!fechaStr || !horaInicio) return 'Fecha/hora no disponible';
      
      // 🎯 Crear fecha de reserva en zona horaria LOCAL
      const [anio, mes, dia] = fechaStr.split('-');
      const [horas, minutos] = horaInicio.split(':');
      
      const fechaReserva = new Date(
        parseInt(anio), 
        parseInt(mes) - 1, 
        parseInt(dia), 
        parseInt(horas), 
        parseInt(minutos), 
        0
      );
      
      if (isNaN(fechaReserva.getTime())) {
        return `${fechaStr} ${horaInicio}`;
      }
      
      const ahora = new Date();
      
      // 🎯 Calcular diferencia en días usando fecha LOCAL
      const fechaReservaDia = new Date(
        fechaReserva.getFullYear(),
        fechaReserva.getMonth(),
        fechaReserva.getDate()
      );
      
      const hoyDia = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );
      
      const diferenciaMs = fechaReservaDia.getTime() - hoyDia.getTime();
      const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      
      // Formatear hora
      const horaFormateada = fechaReserva.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit'
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
          minute: '2-digit'
        });
      }
    } catch (e) {
      console.error('Error formateando fecha para tarjeta:', e, fechaStr, horaInicio);
      return `${fechaStr} ${horaInicio}`;
    }
  };

  // 👇 FUNCIÓN CORREGIDA PARA MOSTRAR TIEMPO TRANSCURRIDO DESDE LA CREACIÓN
  const getTiempoDesdeCreacion = (reserva) => {
    try {
      const fechaCreacionStr = reserva.created_at || reserva.hora_creacion || reserva.fecha_creacion;
      
      if (!fechaCreacionStr) return 'N/A';
      
      // 🎯 Convertir fecha de creación a objeto Date
      let fechaCreacion;
      if (typeof fechaCreacionStr === 'string') {
        if (fechaCreacionStr.includes('T')) {
          // Formato ISO
          fechaCreacion = new Date(fechaCreacionStr);
        } else {
          // Formato personalizado 'YYYY-MM-DD HH:MM:SS'
          const [fecha, hora] = fechaCreacionStr.split(' ');
          const [anio, mes, dia] = fecha.split('-').map(Number);
          const [horas, minutos, segundos] = hora.split(':').map(Number);
          fechaCreacion = new Date(anio, mes - 1, dia, horas, minutos, segundos || 0);
        }
      } else {
        fechaCreacion = new Date(fechaCreacionStr);
      }
      
      if (isNaN(fechaCreacion.getTime())) {
        console.warn('Fecha de creación inválida:', fechaCreacionStr);
        return 'N/A';
      }
      
      const ahora = new Date();
      const diferenciaMs = ahora.getTime() - fechaCreacion.getTime();
      const diferenciaMinutos = Math.floor(diferenciaMs / (1000 * 60));
      
      if (diferenciaMinutos < 60) {
        return `${diferenciaMinutos} minutos`;
      } else {
        const horas = Math.floor(diferenciaMinutos / 60);
        const minutos = diferenciaMinutos % 60;
        if (minutos === 0) {
          return `${horas} hora${horas !== 1 ? 's' : ''}`;
        }
        return `${horas}h ${minutos}min`;
      }
    } catch (e) {
      console.error('Error calculando tiempo desde creación:', e);
      return 'N/A';
    }
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

  // Filtrado de reservas - MEJORADO
  const reservasFiltradas = useMemo(() => {
    console.log('🔍 Aplicando filtros a reservas activas:', reservasActivas.length);
    
    let filtradas = [...reservasActivas];
    
    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(reserva => reserva.estado === filtroEstado);
      console.log('   Después de filtrar por estado:', filtradas.length);
    }
    
    // Filtrar por fecha
    if (filtroFecha !== 'todas') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);
      const semanaSiguiente = new Date(hoy);
      semanaSiguiente.setDate(semanaSiguiente.getDate() + 7);
      
      filtradas = filtradas.filter(reserva => {
        try {
          const [anio, mes, dia] = reserva.fecha.split('-');
          const fechaReserva = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
          
          switch(filtroFecha) {
            case 'hoy':
              return fechaReserva.getTime() === hoy.getTime();
            case 'mañana':
              return fechaReserva.getTime() === mañana.getTime();
            case 'semana':
              return fechaReserva >= hoy && fechaReserva < semanaSiguiente;
            default:
              return true;
          }
        } catch (e) {
          console.error('Error filtrando por fecha:', e);
          return true;
        }
      });
      console.log('   Después de filtrar por fecha:', filtradas.length);
    }
    
    // Filtrar por tipo de pista
    if (filtroTipo !== 'todos' && filtroTipo !== '') {
      filtradas = filtradas.filter(reserva => {
        const tipoPista = reserva.pistaTipo || reserva.pistas?.tipo || '';
        return tipoPista.toLowerCase().includes(filtroTipo.toLowerCase());
      });
      console.log('   Después de filtrar por tipo:', filtradas.length);
    }
    
    console.log('✅ Total después de filtrar:', filtradas.length);
    return filtradas;
  }, [reservasActivas, filtroEstado, filtroFecha, filtroTipo]);

  // Calcular reservas pendientes con más de 1 hora (para mostrar advertencia)
  const reservasPendientesExpiradas = useMemo(() => {
    const ahora = new Date();
    
    return reservasActivas.filter(reserva => {
      if (reserva.estado !== 'pendiente') return false;
      
      try {
        const fechaCreacionStr = reserva.created_at || reserva.hora_creacion || reserva.fecha_creacion;
        
        if (!fechaCreacionStr) return false;
        
        // 🎯 Convertir fecha de creación
        let fechaCreacion;
        if (typeof fechaCreacionStr === 'string') {
          if (fechaCreacionStr.includes('T')) {
            fechaCreacion = new Date(fechaCreacionStr);
          } else {
            const [fecha, hora] = fechaCreacionStr.split(' ');
            const [anio, mes, dia] = fecha.split('-').map(Number);
            const [horas, minutos, segundos] = hora.split(':').map(Number);
            fechaCreacion = new Date(anio, mes - 1, dia, horas, minutos, segundos || 0);
          }
        } else {
          fechaCreacion = new Date(fechaCreacionStr);
        }
        
        if (isNaN(fechaCreacion.getTime())) return false;
        
        const unaHoraAtras = new Date(ahora.getTime() - (60 * 60 * 1000));
        return fechaCreacion < unaHoraAtras;
      } catch (e) {
        return false;
      }
    });
  }, [reservasActivas]);

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
        <p>Cargando tus reservas...</p>
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

  // Calcular estadísticas
  const totalReservas = reservasActivas.length + reservasConfirmadas.length + reservasHistorial.length;

  console.log('🎯 Estado actual del componente:');
  console.log('   Activas:', reservasActivas.length);
  console.log('   Confirmadas:', reservasConfirmadas.length);
  console.log('   Historial:', reservasHistorial.length);
  console.log('   Pendientes expiradas:', reservasPendientesExpiradas.length);

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
            <small>Total reservas: {totalReservas}</small>
          </div>
        </div>
      </div>

      {/* ADVERTENCIA SOBRE RESERVAS PENDIENTES CON MÁS DE 1 HORA */}
      {reservasPendientesExpiradas.length > 0 && (
        <div className="advertencia-container">
          <div className="advertencia-header">
            <span className="advertencia-icon">⚠️</span>
            <span className="advertencia-titulo">Reservas pendientes por expirar</span>
          </div>
          <p className="advertencia-texto">
            Tienes {reservasPendientesExpiradas.length} reserva(s) pendiente(s) que llevan más de 1 hora. 
            Se cancelarán automáticamente para liberar espacios.
          </p>
          <div className="advertencia-reservas">
            {reservasPendientesExpiradas.slice(0, 3).map((reserva, index) => (
              <div key={`exp-${reserva.id}`} className="advertencia-item">
                <span>{reserva.pistaNombre || reserva.pistas?.nombre || `Pista ${reserva.pista_id}`}</span>
                <span className="advertencia-tiempo">
                  ({getTiempoDesdeCreacion(reserva)} pendiente)
                </span>
              </div>
            ))}
            {reservasPendientesExpiradas.length > 3 && (
              <div className="advertencia-item">
                <span>... y {reservasPendientesExpiradas.length - 3} más</span>
              </div>
            )}
          </div>
        </div>
      )}

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
            {reservasPendientesExpiradas.length > 0 && (
              <span className="expiracion-info">
                ⏰ {reservasPendientesExpiradas.length} pendiente(s) se cancelarán automáticamente pronto
              </span>
            )}
          </p>

          {reservasActivas.length === 0 && reservasConfirmadas.length === 0 && reservasHistorial.length === 0 ? (
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
          ) : reservasFiltradas.length === 0 && filtroEstado === 'todos' && filtroFecha === 'todas' && filtroTipo === 'todos' ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>No tienes reservas activas</p>
              <p className="empty-subtext">Todas tus reservas están confirmadas o en el historial</p>
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No se encontraron reservas con los filtros aplicados</p>
              <button 
                className="btn-limpiar-filtros-empty"
                onClick={() => {
                  setFiltroEstado('todos');
                  setFiltroFecha('todas');
                  setFiltroTipo('todos');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="reservas-grid">
              {reservasFiltradas.map((reserva) => {
                // Verificar si esta reserva está próxima a expirar
                const estaPorExpiar = reservasPendientesExpiradas.some(r => r.id === reserva.id);
                const tiempoDesdeCreacion = getTiempoDesdeCreacion(reserva);
                
                return (
                  <div 
                    key={reserva.id} 
                    className={`reserva-card ${reserva.estado} ${estaPorExpiar ? 'expiracion-cercana' : ''}`}
                    onClick={() => irADetalles(reserva)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && irADetalles(reserva)}
                  >
                    <div className="card-header">
                      <div className="card-badge">
                        {reserva.estado === 'pendiente' ? '⏳ Pendiente' : '✅ Confirmada'}
                        {estaPorExpiar && <span className="expiracion-badge"> ⏰</span>}
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
                      {estaPorExpiar && reserva.estado === 'pendiente' && (
                        <div className="expiracion-alerta">
                          ⚠️ Pendiente por {tiempoDesdeCreacion}. Se cancelará automáticamente pronto.
                        </div>
                      )}
                      
                      <h3 className="pista-nombre">{reserva.pistaNombre || reserva.pistas?.nombre || `Pista ${reserva.pista_id}`}</h3>
                      <p className="pista-tipo">
                        {reserva.pistaTipo || reserva.pistas?.tipo || 'Sin especificar'}
                        {reserva.ludoteca && <span className="ludoteca-badge"> 🧸 Ludoteca</span>}
                      </p>
                      
                      <div className="info-row">
                        <span className="info-icon">📍</span>
                        <span className="info-text">{reserva.polideportivo_nombre || reserva.polideportivos?.nombre || `Polideportivo ${reserva.polideportivo_id}`}</span>
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
                      
                      {reserva.estado === 'pendiente' && (
                        <div className="tiempo-pendiente">
                          <small>⏰ Pendiente por: {tiempoDesdeCreacion}</small>
                        </div>
                      )}
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
                );
              })}
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
                    <h4>{reserva.pistaNombre || reserva.pistas?.nombre || `Pista ${reserva.pista_id}`}</h4>
                    <p className="confirmada-lugar">
                      {reserva.polideportivo_nombre || reserva.polideportivos?.nombre || `Polideportivo ${reserva.polideportivo_id}`}
                    </p>
                    <p className="confirmada-horario">
                      {reserva.hora_inicio} - {reserva.hora_fin} • €{parseFloat(reserva.precio || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="confirmada-actions">
                    <button 
                      className="btn-ver-confirmada"
                      onClick={() => irADetalles(reserva)}
                    >
                      Ver
                    </button>
                    <button 
                      className="btn-cancelar-confirmada"
                      onClick={(e) => handleCancelar(reserva.id, e)}
                      title="Cancelar reserva confirmada"
                      disabled={cancelando[reserva.id]}
                    >
                      {cancelando[reserva.id] ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  </div>
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
                        {reserva.motivo_cancelacion && reserva.estado === 'cancelada' && (
                          <span className="motivo-cancelacion"> ({reserva.motivo_cancelacion})</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="historial-info">
                      <span className="historial-pista">
                        {reserva.pistaNombre || reserva.pistas?.nombre || `Pista ${reserva.pista_id}`}
                      </span>
                      <span className="historial-polideportivo">
                        • {reserva.polideportivo_nombre || reserva.polideportivos?.nombre || `Polideportivo ${reserva.polideportivo_id}`}
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