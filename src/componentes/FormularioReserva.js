import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexto/AuthProvider';
import './FormularioReserva.css';

export default function FormularioReserva() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const reservaParam = searchParams.get('reserva');
  const [reservaParaEditar, setReservaParaEditar] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [polideportivos, setPolideportivos] = useState([]);
  const [pistas, setPistas] = useState([]);
  const [pistasDisponibles, setPistasDisponibles] = useState([]); // Solo pistas no en mantenimiento
  const [reservasExistentes, setReservasExistentes] = useState([]);
  const [misReservasPendientes, setMisReservasPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPolideportivos, setLoadingPolideportivos] = useState(true);
  const [loadingPistas, setLoadingPistas] = useState(true);
  const [validandoDisponibilidad, setValidandoDisponibilidad] = useState(false);
  const [errores, setErrores] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const [formData, setFormData] = useState({
    polideportivo: '',
    pista: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    ludoteca: false,
  });

  const userId = user?.id || 0;
  const usuario = user?.usuario || '';
  const dni = user?.dni || '';
  const token = localStorage.getItem('auth_token');

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

  // Cargar datos de reserva para editar
  useEffect(() => {
    if (reservaParam) {
      try {
        const reservaData = JSON.parse(decodeURIComponent(reservaParam));
        setReservaParaEditar(reservaData);
        setModoEdicion(true);
        
        console.log('📝 Modo EDICIÓN activado para reserva:', reservaData.id);
        console.log('📊 Datos de la reserva para editar:', {
          id: reservaData.id,
          polideportivo_id: reservaData.polideportivo_id,
          pista_id: reservaData.pista_id,
          fecha: reservaData.fecha,
          hora_inicio: reservaData.hora_inicio,
          hora_fin: reservaData.hora_fin,
          ludoteca: reservaData.ludoteca,
          estado: reservaData.estado,
          // 🎯 MOSTRAR LA FECHA DE CREACIÓN CORRECTA
          created_at: reservaData.created_at ? formatFechaHoraLocal(reservaData.created_at) : 'No disponible'
        });
        
        if (reservaData) {
          setFormData({
            polideportivo: reservaData.polideportivo_id?.toString() || '',
            pista: reservaData.pista_id?.toString() || '',
            fecha: reservaData.fecha ? formatearFechaDesdeBackend(reservaData.fecha) : '',
            horaInicio: reservaData.hora_inicio || '',
            horaFin: reservaData.hora_fin || '',
            ludoteca: reservaData.ludoteca || false,
          });
        }
      } catch (error) {
        console.error('Error parseando reserva para editar:', error);
      }
    }
  }, [reservaParam]);

  // Horas disponibles de 8:00 a 22:00
  const horasDisponibles = Array.from({ length: 15 }, (_, i) => {
    const h = 8 + i;
    return `${h.toString().padStart(2, '0')}:00`;
  });

  const hoy = new Date().toISOString().split("T")[0];
  const esHoy = formData.fecha === hoy;
  const horaActual = new Date().getHours();
  const minutosActuales = new Date().getMinutes();
  
  // Filtrar horas según si es hoy o no
  const horasFiltradas = esHoy
    ? horasDisponibles.filter(h => {
        const hora = parseInt(h.split(":")[0], 10);
        // Si la hora es mayor a la actual, está disponible
        if (hora > horaActual) return true;
        // Si es la misma hora, verificar minutos (solo permitir si faltan al menos 30 minutos)
        if (hora === horaActual) {
          return minutosActuales < 30; // Solo permitir si es antes de las :30
        }
        return false;
      })
    : horasDisponibles;

  const polideportivoSeleccionado = formData.polideportivo 
    ? polideportivos.find(p => p.id.toString() === formData.polideportivo)
    : null;

  // Filtrar pistas que no estén en mantenimiento
  const pistasFiltradas = formData.polideportivo 
    ? pistasDisponibles.filter(pista => 
        pista.polideportivo_id && 
        pista.polideportivo_id.toString() === formData.polideportivo &&
        pista.disponible !== false // Filtrar pistas NO en mantenimiento
      )
    : [];

  // 🎯 FUNCIÓN MEJORADA: Formatear fecha desde backend
  const formatearFechaDesdeBackend = (fechaInput) => {
    if (!fechaInput) return '';
    
    if (typeof fechaInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
      return fechaInput;
    }
    
    if (typeof fechaInput === 'string' && fechaInput.includes('T')) {
      try {
        // Extraer solo la parte de la fecha (YYYY-MM-DD)
        return fechaInput.split('T')[0];
      } catch (error) {
        console.error('Error formateando fecha desde backend:', error);
        return '';
      }
    }
    
    return fechaInput || '';
  };

  // 🎯 NUEVA FUNCIÓN: Formatear fecha/hora completa
  const formatFechaHoraLocal = (fechaISO) => {
    if (!fechaISO) return '';
    
    try {
      // Crear fecha a partir de ISO string
      const fecha = new Date(fechaISO);
      
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida recibida:', fechaISO);
        return fechaISO;
      }
      
      // Formatear en zona horaria local del cliente
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formateando fecha/hora:', error, 'Input:', fechaISO);
      return fechaISO; // Devolver original si hay error
    }
  };

  // 🎯 FUNCIÓN PARA VERIFICAR SI UNA HORA YA PASÓ (PARA HOY)
  const horaYaPaso = (horaStr) => {
    if (!esHoy) return false; // Solo verificar si es hoy
    
    const horaSeleccionada = parseInt(horaStr.split(':')[0], 10);
    const minutosSeleccionados = parseInt(horaStr.split(':')[1] || '0', 10);
    
    // Convertir a minutos totales para comparación precisa
    const minutosActualesTotales = horaActual * 60 + minutosActuales;
    const minutosSeleccionadosTotales = horaSeleccionada * 60 + minutosSeleccionados;
    
    return minutosSeleccionadosTotales < minutosActualesTotales;
  };

  // 🎯 FUNCIÓN PARA VERIFICAR SI UNA HORA ES MUY PRÓXIMA (MENOS DE 30 MINUTOS)
  const horaMuyProxima = (horaStr) => {
    if (!esHoy) return false; // Solo verificar si es hoy
    
    const horaSeleccionada = parseInt(horaStr.split(':')[0], 10);
    const minutosSeleccionados = parseInt(horaStr.split(':')[1] || '0', 10);
    
    // Convertir a minutos totales
    const minutosActualesTotales = horaActual * 60 + minutosActuales;
    const minutosSeleccionadosTotales = horaSeleccionada * 60 + minutosSeleccionados;
    
    // Verificar si falta menos de 30 minutos para la hora seleccionada
    const minutosFaltantes = minutosSeleccionadosTotales - minutosActualesTotales;
    
    return minutosFaltantes >= 0 && minutosFaltantes < 30;
  };

  const calcularPrecio = () => {
    if (!formData.pista || !formData.horaInicio || !formData.horaFin) {
      return 0;
    }
    
    const pista = pistas.find(p => p.id.toString() === formData.pista);
    if (!pista || !pista.precio) {
      return 0;
    }
    
    const hi = parseInt(formData.horaInicio.split(':')[0], 10);
    const hf = parseInt(formData.horaFin.split(':')[0], 10);
    const duracion = hf - hi;
    
    if (duracion <= 0) {
      return 0;
    }

    let total = parseFloat(pista.precio) * duracion;
    if (formData.ludoteca) total += 5;
    
    return parseFloat(total.toFixed(2));
  };

  const obtenerPrecioOriginal = () => {
    if (!reservaParaEditar?.precio) return 0;
    return typeof reservaParaEditar.precio === 'string' 
      ? parseFloat(reservaParaEditar.precio) 
      : reservaParaEditar.precio;
  };

  // 🆕 FUNCIÓN MEJORADA: Obtener horas ocupadas considerando rangos continuos
  const obtenerHorasOcupadas = () => {
    const horasOcupadas = new Set();
    const reservasParaPista = reservasExistentes.filter(r => {
      if (modoEdicion && reservaParaEditar && r.id === reservaParaEditar.id) {
        return false; // Excluir la reserva que se está editando
      }
      return r.pista_id && r.pista_id.toString() === formData.pista;
    });

    // Mapear todas las reservas y marcar las horas ocupadas
    reservasParaPista.forEach(r => {
      const hi = parseInt(r.hora_inicio.split(':')[0], 10);
      const hf = parseInt(r.hora_fin.split(':')[0], 10);
      
      // Marcar todas las horas del rango como ocupadas
      for(let h = hi; h < hf; h++){
        horasOcupadas.add(`${h.toString().padStart(2,'0')}:00`);
      }
    });

    return horasOcupadas;
  };

  // 🆕 FUNCIÓN MEJORADA: Obtener bloques de horas ocupadas
  const obtenerBloquesOcupados = () => {
    const bloques = [];
    const reservasParaPista = reservasExistentes.filter(r => {
      if (modoEdicion && reservaParaEditar && r.id === reservaParaEditar.id) {
        return false;
      }
      return r.pista_id && r.pista_id.toString() === formData.pista;
    });

    // Ordenar reservas por hora de inicio
    reservasParaPista.sort((a, b) => {
      const hiA = parseInt(a.hora_inicio.split(':')[0], 10);
      const hiB = parseInt(b.hora_inicio.split(':')[0], 10);
      return hiA - hiB;
    });

    // Crear bloques continuos de horas ocupadas
    let bloqueActual = null;
    reservasParaPista.forEach(r => {
      const hi = parseInt(r.hora_inicio.split(':')[0], 10);
      const hf = parseInt(r.hora_fin.split(':')[0], 10);
      
      if (!bloqueActual) {
        bloqueActual = { inicio: hi, fin: hf };
      } else if (hi <= bloqueActual.fin) {
        // Si la reserva se solapa o es continua, extender el bloque
        bloqueActual.fin = Math.max(bloqueActual.fin, hf);
      } else {
        // Nuevo bloque separado
        bloques.push(bloqueActual);
        bloqueActual = { inicio: hi, fin: hf };
      }
    });
    
    if (bloqueActual) {
      bloques.push(bloqueActual);
    }

    return bloques;
  };

  // 🎯 FUNCIÓN MEJORADA: Obtener horas de inicio disponibles (CON VALIDACIÓN DE HORAS PASADAS)
  const getHorasInicioDisponibles = () => {
    if (!formData.pista || !formData.fecha) {
      return horasFiltradas;
    }

    const bloquesOcupados = obtenerBloquesOcupados();
    const horasOcupadas = obtenerHorasOcupadas();
    
    return horasFiltradas.filter(horaInicio => {
      const horaInicioNum = parseInt(horaInicio.split(':')[0], 10);
      
      // 🎯 VERIFICAR SI LA HORA YA PASÓ (PARA HOY)
      if (esHoy && horaYaPaso(horaInicio)) {
        return false;
      }
      
      // 🎯 VERIFICAR SI LA HORA ES MUY PRÓXIMA (MENOS DE 30 MINUTOS)
      if (esHoy && horaMuyProxima(horaInicio)) {
        return false;
      }
      
      // Verificar si la hora está en un bloque ocupado
      const enBloqueOcupado = bloquesOcupados.some(bloque => 
        horaInicioNum >= bloque.inicio && horaInicioNum < bloque.fin
      );
      
      if (enBloqueOcupado) {
        return false;
      }
      
      // Verificar si hay horas de fin disponibles para esta hora de inicio
      const hayHorasFinDisponibles = horasFiltradas.some(horaFin => {
        const horaFinNum = parseInt(horaFin.split(':')[0], 10);
        if (horaFinNum <= horaInicioNum) return false;
        
        // 🎯 VERIFICAR SI LA HORA FIN YA PASÓ (PARA HOY)
        if (esHoy && horaYaPaso(horaFin)) {
          return false;
        }
        
        // Verificar que todo el rango esté disponible
        for (let h = horaInicioNum; h < horaFinNum; h++) {
          const horaIntermedia = `${h.toString().padStart(2, '0')}:00`;
          if (horasOcupadas.has(horaIntermedia)) {
            return false;
          }
        }
        return true;
      });
      
      return hayHorasFinDisponibles;
    });
  };

  // 🎯 FUNCIÓN MEJORADA: Obtener horas de fin disponibles (CON VALIDACIÓN DE HORAS PASADAS)
  const getHorasFinDisponibles = () => {
    if (!formData.pista || !formData.fecha || !formData.horaInicio) {
      return [];
    }

    const horaInicioNum = parseInt(formData.horaInicio.split(':')[0], 10);
    const bloquesOcupados = obtenerBloquesOcupados();
    const horasOcupadas = obtenerHorasOcupadas();

    return horasFiltradas.filter(horaFin => {
      const horaFinNum = parseInt(horaFin.split(':')[0], 10);
      
      // La hora de fin debe ser mayor que la de inicio
      if (horaFinNum <= horaInicioNum) return false;
      
      // 🎯 VERIFICAR SI LA HORA FIN YA PASÓ (PARA HOY)
      if (esHoy && horaYaPaso(horaFin)) {
        return false;
      }

      // Verificar que todo el rango esté disponible
      for (let h = horaInicioNum; h < horaFinNum; h++) {
        const horaStr = `${h.toString().padStart(2, '0')}:00`;
        if (horasOcupadas.has(horaStr)) {
          return false;
        }
      }

      // Verificar que no se cruce con un bloque ocupado
      const cruzaConBloque = bloquesOcupados.some(bloque => {
        // Si el rango se solapa con un bloque ocupado
        return (horaInicioNum < bloque.fin && horaFinNum > bloque.inicio);
      });

      return !cruzaConBloque;
    });
  };

  const horasInicioDisponibles = getHorasInicioDisponibles();
  const horasFinDisponibles = getHorasFinDisponibles();

  const mostrarAlerta = (titulo, mensaje) => {
    setModalTitle(titulo);
    setModalMessage(mensaje);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
  };

  // Cargar polideportivos
  useEffect(() => {
    const fetchPolideportivos = async () => {
      setLoadingPolideportivos(true);
      try {
        const response = await fetch('https://tfgv2-production.up.railway.app/api/polideportivos');
        const result = await response.json();
        if (result.success) {
          setPolideportivos(result.data);
        }
      } catch (error) {
        console.error('Error cargando polideportivos:', error);
        setErrores(prev => ({ ...prev, general: 'No se pudieron cargar los polideportivos' }));
      } finally {
        setLoadingPolideportivos(false);
      }
    };

    fetchPolideportivos();
  }, []);

  // Cargar todas las pistas disponibles (filtrando las en mantenimiento)
  useEffect(() => {
    const fetchPistas = async () => {
      setLoadingPistas(true);
      try {
        // Usar el endpoint de pistas disponibles que excluye las en mantenimiento
        const res = await fetch('https://tfgv2-production.up.railway.app/api/pistas/disponibles');
        const response = await res.json();

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('Formato de datos inválido');
        }

        // Filtrar solo pistas disponibles (no en mantenimiento)
        const pistasFiltradas = response.data.filter(pista => 
          pista.disponible !== false && 
          pista.disponible !== 0
        );

        setPistas(response.data); // Todas las pistas para cálculo de precios
        setPistasDisponibles(pistasFiltradas); // Solo las disponibles para mostrar
        
        console.log(`✅ Cargadas ${pistasFiltradas.length} pistas disponibles (de ${response.data.length} total)`);
      } catch (error) {
        console.error('Error fetching pistas:', error);
        setErrores(prev => ({ ...prev, general: 'No se pudieron cargar las pistas' }));
        setPistas([]);
        setPistasDisponibles([]);
      } finally {
        setLoadingPistas(false);
      }
    };
    fetchPistas();
  }, []);

  // Cargar mis reservas pendientes
  useEffect(() => {
    const fetchMisReservas = async () => {
      if (!usuario || !token) return;
      
      try {
        const res = await fetch(`https://tfgv2-production.up.railway.app/api/reservas?usuario_id=${userId}`, {
          headers: getHeaders()
        });
        const data = await res.json();
        
        if (data.success) {
          const reservasPendientes = data.data.filter(reserva => reserva.estado === 'pendiente');
          setMisReservasPendientes(reservasPendientes || []);
        }
      } catch (error) {
        console.error('Error cargando mis reservas:', error);
      }
    };
    
    if (userId > 0 && token) {
      fetchMisReservas();
    }
  }, [usuario, userId, token]);

  // Cargar reservas existentes para disponibilidad
  useEffect(() => {
    const fetchReservasExistentes = async () => {
      if (!formData.fecha || !formData.polideportivo || !token) {
        setReservasExistentes([]);
        return;
      }

      setValidandoDisponibilidad(true);
      try {
        const res = await fetch(
          `https://tfgv2-production.up.railway.app/api/reservas/disponibilidad?fecha=${formData.fecha}&polideportivo=${formData.polideportivo}`,
          {
            headers: getHeaders()
          }
        );
        const data = await res.json();
        
        if (data.success) {
          const reservasActivas = data.data.filter(reserva => 
            reserva.estado !== 'cancelada'
          );
          setReservasExistentes(reservasActivas || []);
          console.log(`📊 Se encontraron ${reservasActivas?.length || 0} reservas activas para la fecha ${formData.fecha}`);
        } else {
          console.error('Error en respuesta del servidor:', data.error);
          setReservasExistentes([]);
        }
      } catch (error) {
        console.error('Error cargando reservas existentes:', error);
        setReservasExistentes([]);
      } finally {
        setValidandoDisponibilidad(false);
      }
    };

    const timeoutId = setTimeout(fetchReservasExistentes, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.fecha, formData.polideportivo, token]);

  // 🎯 VALIDACIÓN COMPLETA DEL FORMULARIO (CON VALIDACIÓN DE HORAS PASADAS)
  useEffect(() => {
    const nuevosErrores = {};

    if (!formData.polideportivo) nuevosErrores.polideportivo = 'Selecciona un polideportivo';
    if (!formData.pista) nuevosErrores.pista = 'Selecciona una pista';
    if (!formData.fecha) nuevosErrores.fecha = 'Selecciona una fecha';
    if (!formData.horaInicio) nuevosErrores.horaInicio = 'Selecciona hora de inicio';
    if (!formData.horaFin) nuevosErrores.horaFin = 'Selecciona hora de fin';

    // Validar fecha
    if (formData.fecha && formData.fecha < hoy) {
      nuevosErrores.fecha = 'No puedes reservar en fechas pasadas';
    }

    // Validar horas (solo si tenemos fecha y hora)
    if (formData.horaInicio && formData.horaFin) {
      // Verificar que hora fin sea mayor que hora inicio
      const hi = parseInt(formData.horaInicio.split(':')[0], 10);
      const hf = parseInt(formData.horaFin.split(':')[0], 10);
      
      if (hf <= hi) {
        nuevosErrores.horaFin = 'La hora de fin debe ser mayor que la de inicio';
      }

      // 🎯 VERIFICAR SI ES HOY Y LAS HORAS YA PASARON
      if (esHoy) {
        const hiNum = parseInt(formData.horaInicio.split(':')[0], 10);
        const hfNum = parseInt(formData.horaFin.split(':')[0], 10);
        const minutosHi = parseInt(formData.horaInicio.split(':')[1] || '0', 10);
        const minutosHf = parseInt(formData.horaFin.split(':')[1] || '0', 10);
        
        // Convertir a minutos totales
        const minutosActualesTotales = horaActual * 60 + minutosActuales;
        const minutosHiTotales = hiNum * 60 + minutosHi;
        const minutosHfTotales = hfNum * 60 + minutosHf;
        
        // Verificar si la hora de inicio ya pasó
        if (minutosHiTotales < minutosActualesTotales) {
          nuevosErrores.horaInicio = 'La hora de inicio seleccionada ya pasó. Elige una hora futura.';
        }
        
        // Verificar si la hora de inicio es muy próxima (menos de 30 minutos)
        const minutosFaltantesParaInicio = minutosHiTotales - minutosActualesTotales;
        if (minutosFaltantesParaInicio >= 0 && minutosFaltantesParaInicio < 30) {
          nuevosErrores.horaInicio = 'La hora de inicio es muy próxima. Debes reservar con al menos 30 minutos de antelación.';
        }
        
        // Verificar si la hora de fin ya pasó
        if (minutosHfTotales < minutosActualesTotales) {
          nuevosErrores.horaFin = 'La hora de fin seleccionada ya pasó. Elige una hora futura.';
        }
        
        // Verificar que la hora de fin no sea anterior a la hora de inicio
        if (minutosHfTotales <= minutosHiTotales) {
          nuevosErrores.horaFin = 'La hora de fin debe ser posterior a la hora de inicio';
        }
      }
    }

    // Validar disponibilidad de la pista
    if (formData.pista && formData.fecha && formData.horaInicio && formData.horaFin) {
      const horasOcupadas = obtenerHorasOcupadas();
      const horaInicioNum = parseInt(formData.horaInicio.split(':')[0], 10);
      const horaFinNum = parseInt(formData.horaFin.split(':')[0], 10);
      
      let hayConflicto = false;
      for (let h = horaInicioNum; h < horaFinNum; h++) {
        const horaStr = `${h.toString().padStart(2, '0')}:00`;
        if (horasOcupadas.has(horaStr)) {
          hayConflicto = true;
          break;
        }
      }

      if (hayConflicto) {
        nuevosErrores.disponibilidad = 'La pista ya está reservada en este horario. Elige otro horario.';
      }
    }

    if (userId === 0) {
      nuevosErrores.usuario = 'Usuario no identificado correctamente. Por favor, inicia sesión nuevamente.';
    }

    if (modoEdicion && reservaParaEditar) {
      if (reservaParaEditar.estado !== 'pendiente') {
        nuevosErrores.estado = 'Esta reserva ya no se puede modificar porque ya fue confirmada o cancelada';
      }
    }

    setErrores(nuevosErrores);
  }, [formData, reservasExistentes, hoy, horaActual, minutosActuales, esHoy, userId, modoEdicion, reservaParaEditar]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePolideportivoChange = (value) => {
    setFormData({ 
      ...formData, 
      polideportivo: value, 
      pista: '', 
      fecha: '', 
      horaInicio: '', 
      horaFin: '' 
    });
  };

  const handlePistaChange = (value) => {
    setFormData({ 
      ...formData, 
      pista: value, 
      horaInicio: '', 
      horaFin: '' 
    });
  };

  const handleFechaChange = (value) => {
    setFormData({ 
      ...formData, 
      fecha: value, 
      horaInicio: '', 
      horaFin: '' 
    });
  };

  const handleHoraInicioChange = (value) => {
    setFormData({ 
      ...formData, 
      horaInicio: value, 
      horaFin: '' 
    });
  };

  const handleHoraFinChange = (value) => {
    setFormData({ 
      ...formData, 
      horaFin: value 
    });
  };

  const handleLudotecaChange = (e) => {
    setFormData({ 
      ...formData, 
      ludoteca: e.target.checked 
    });
  };

  // 🆕 FUNCIÓN: Verificar si una pista está disponible (no en mantenimiento)
  const pistaEstaDisponible = (pistaId) => {
    const pista = pistas.find(p => p.id === pistaId);
    return pista && pista.disponible !== false && pista.disponible !== 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🎯 VALIDACIÓN EXTRA EN EL SUBMIT (PARA SEGURIDAD)
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split("T")[0];
    
    if (formData.fecha === hoyStr) {
      const horaActualNum = ahora.getHours();
      const minutosActualesNum = ahora.getMinutes();
      const minutosActualesTotales = horaActualNum * 60 + minutosActualesNum;
      
      if (formData.horaInicio) {
        const hiNum = parseInt(formData.horaInicio.split(':')[0], 10);
        const minutosHi = parseInt(formData.horaInicio.split(':')[1] || '0', 10);
        const minutosHiTotales = hiNum * 60 + minutosHi;
        
        if (minutosHiTotales < minutosActualesTotales) {
          mostrarAlerta('Hora inválida', 'La hora de inicio seleccionada ya pasó. Por favor, elige una hora futura.');
          return;
        }
        
        if (minutosHiTotales - minutosActualesTotales < 30) {
          mostrarAlerta('Tiempo insuficiente', 'Debes reservar con al menos 30 minutos de antelación. Por favor, elige una hora posterior.');
          return;
        }
      }
      
      if (formData.horaFin) {
        const hfNum = parseInt(formData.horaFin.split(':')[0], 10);
        const minutosHf = parseInt(formData.horaFin.split(':')[1] || '0', 10);
        const minutosHfTotales = hfNum * 60 + minutosHf;
        
        if (minutosHfTotales < minutosActualesTotales) {
          mostrarAlerta('Hora inválida', 'La hora de fin seleccionada ya pasó. Por favor, elige una hora futura.');
          return;
        }
      }
    }
    
    if (Object.keys(errores).length > 0) {
      mostrarAlerta('Error', 'Por favor, corrige los errores antes de continuar');
      return;
    }

    if (!token) {
      mostrarAlerta('No autenticado', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (modoEdicion && reservaParaEditar) {
      if (reservaParaEditar.estado !== 'pendiente') {
        mostrarAlerta(
          'Reserva no modificable', 
          'Esta reserva ya ha sido confirmada o cancelada y no se puede modificar.'
        );
        return;
      }
    }

    if (!modoEdicion && misReservasPendientes.length > 0) {
      mostrarAlerta(
        'Reserva pendiente', 
        'Ya tienes una reserva pendiente. No puedes hacer más reservas hasta que completes o canceles la actual.'
      );
      return;
    }

    // 🆕 Verificar si la pista sigue disponible (no en mantenimiento)
    if (!pistaEstaDisponible(parseInt(formData.pista))) {
      mostrarAlerta(
        'Pista no disponible',
        'La pista seleccionada ya no está disponible (puede estar en mantenimiento). Por favor, selecciona otra pista.'
      );
      return;
    }

    setLoading(true);

    try {
      const precioFinal = calcularPrecio();

      console.log('📤 Preparando datos para enviar...');
      console.log('📊 Datos del formulario:', formData);
      console.log('👤 Usuario info:', { userId, usuario, dni });
      console.log('💰 Precio calculado:', precioFinal);
      console.log('⏰ Hora local del cliente:', new Date().toLocaleString('es-ES'));
      console.log('📅 Fecha seleccionada:', formData.fecha);
      console.log('🕐 Es hoy?:', esHoy);
      console.log('🕐 Hora actual:', `${horaActual}:${minutosActuales}`);

      // 🆕 USAR LA NUEVA RUTA ESPECÍFICA PARA USUARIOS
      let url = 'https://tfgv2-production.up.railway.app/api/reservas';
      let method = 'POST';

      if (modoEdicion && reservaParaEditar) {
        // Usar la nueva ruta específica para usuarios editando sus reservas
        url = `https://tfgv2-production.up.railway.app/api/reservas/usuario/editar/${reservaParaEditar.id}`;
        method = 'PUT';
        
        // Enviar solo los campos necesarios para modificación
        const datosModificacion = {
          pista_id: parseInt(formData.pista),
          fecha: formData.fecha,
          hora_inicio: formData.horaInicio,
          hora_fin: formData.horaFin,
          ludoteca: formData.ludoteca
        };
        
        console.log('🔄 Enviando datos de modificación:', datosModificacion);
        console.log('🔗 URL:', url);
        console.log('🔑 Headers:', getHeaders());
        console.log('⏰ Fecha/hora envio:', new Date().toISOString());
        
        const response = await fetch(url, {
          method: method,
          headers: getHeaders(),
          body: JSON.stringify(datosModificacion),
        });

        const responseText = await response.text();
        console.log('📥 Respuesta RAW del servidor:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Error parseando respuesta JSON:', parseError);
          throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 100)}`);
        }
        
        console.log('📊 Respuesta del servidor (parsed):', {
          status: response.status,
          ok: response.ok,
          data: data
        });
        
        if (!response.ok) {
          const errorMsg = data?.error || `Error ${response.status} al actualizar la reserva`;
          console.error('❌ Error en respuesta:', errorMsg);
          throw new Error(errorMsg);
        }

        if (!data.success) {
          const errorMsg = data?.error || `Error al actualizar la reserva`;
          console.error('❌ Error en data.success:', errorMsg);
          throw new Error(errorMsg);
        }

        console.log(`✅ Reserva actualizada exitosamente:`, data.data);
        console.log('📅 Fecha/hora actualización (local):', formatFechaHoraLocal(data.data.fecha_modificacion));

        const mensajeExito = data.cambioPrecio 
          ? `Reserva #${reservaParaEditar.id} actualizada correctamente. El precio se ha ajustado a ${data.precioNuevo?.toFixed(2) || precioFinal.toFixed(2)} €.`
          : `Reserva #${reservaParaEditar.id} actualizada correctamente.`;
        
        console.log('🎉 Redirigiendo a resumen con mensaje:', mensajeExito);
        
        window.location.href = `/resumen-reserva?reserva=${encodeURIComponent(JSON.stringify(data.data))}&mensaje=${encodeURIComponent(mensajeExito)}&precioActualizado=${data.cambioPrecio || false}`;

        return; // Salir temprano para reservas en edición
      }

      // 📌 CÓDIGO PARA CREAR NUEVA RESERVA
      const reservaData = {
        dni_usuario: dni,
        nombre_usuario: usuario || 'Usuario',
        usuario_id: userId,
        pista_id: parseInt(formData.pista),
        fecha: formData.fecha,
        hora_inicio: formData.horaInicio,
        hora_fin: formData.horaFin,
        ludoteca: formData.ludoteca,
        estado: 'pendiente',
        precio: precioFinal
      };

      console.log('📤 Enviando datos de nueva reserva:', reservaData);
      console.log('🔗 URL:', url);
      console.log('🔑 Headers:', getHeaders());
      console.log('⏰ Fecha/hora envio:', new Date().toISOString());

      const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(reservaData),
      });

      const responseText = await response.text();
      console.log('📥 Respuesta RAW del servidor (creación):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta JSON:', parseError);
        throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 100)}`);
      }
      
      console.log('📊 Respuesta del servidor (creación, parsed):', {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      if (!response.ok) {
        const errorMsg = data?.error || `Error ${response.status} al crear la reserva`;
        console.error('❌ Error en respuesta:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.success) {
        const errorMsg = data?.error || `Error al crear la reserva`;
        console.error('❌ Error en data.success:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log(`✅ Reserva creada exitosamente:`, data.data);
      console.log('📅 Fecha/hora creación (local):', formatFechaHoraLocal(data.data.created_at));
      
      window.location.href = `/resumen-reserva?reserva=${encodeURIComponent(JSON.stringify(data.data))}&mensaje=${encodeURIComponent('Reserva creada exitosamente')}`;

    } catch (error) {
      console.error(`❌ Error ${modoEdicion ? 'actualizando' : 'creando'} reserva:`, error);
      console.error('🔍 Error completo:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Mensaje de error más específico
      let mensajeError = error.message || `Ocurrió un error al ${modoEdicion ? 'actualizar' : 'crear'} la reserva`;
      
      if (error.message.includes('Error al actualizar reserva en la base de datos')) {
        mensajeError = 'Error técnico al guardar los cambios. Por favor, verifica que todos los campos sean válidos.';
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        mensajeError = 'Error de conexión. Por favor, verifica tu internet e intenta nuevamente.';
      } else if (error.message.includes('La pista no está disponible')) {
        mensajeError = 'La pista ya no está disponible en el horario seleccionado. Por favor, elige otro horario.';
      } else if (error.message.includes('Solo se pueden modificar reservas pendientes')) {
        mensajeError = 'Esta reserva ya no se puede modificar porque ya fue confirmada o cancelada.';
      } else if (error.message.includes('Reserva no encontrada')) {
        mensajeError = 'No se encontró la reserva. Puede que ya haya sido eliminada.';
      } else if (error.message.includes('no tienes permisos')) {
        mensajeError = 'No tienes permisos para modificar esta reserva.';
      }
      
      mostrarAlerta('Error', mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const PrecioEstimadoComponent = () => {
    const pistaSeleccionada = pistas.find(p => p.id.toString() === formData.pista);
    const duracion = formData.horaInicio && formData.horaFin
      ? parseInt(formData.horaFin.split(':')[0], 10) - parseInt(formData.horaInicio.split(':')[0], 10)
      : 0;
    
    const precioTotal = calcularPrecio();
    const precioOriginal = obtenerPrecioOriginal();
    const hayCambio = modoEdicion && precioTotal !== precioOriginal;
    
    // 🆕 Verificar si la pista está disponible
    const pistaDisponible = pistaEstaDisponible(parseInt(formData.pista));
    
    return (
      <div className="precio-container">
        <h3 className="precio-titulo">
          {modoEdicion ? 'Precio Actualizado' : 'Precio Estimado'}
        </h3>
        
        {!pistaDisponible && (
          <div className="pista-no-disponible-alert">
            ⚠️ Esta pista ya no está disponible (puede estar en mantenimiento)
          </div>
        )}
        
        {modoEdicion && hayCambio && (
          <div className="precio-anterior-container">
            <span className="precio-anterior-label">Precio anterior:</span>
            <span className="precio-anterior-valor">{precioOriginal.toFixed(2)} €</span>
          </div>
        )}
        
        {pistaSeleccionada && duracion > 0 && (
          <div className="desglose">
            <div className="desglose-item">
              <span>{duracion}h × {pistaSeleccionada.precio}€/hora = </span>
              <span>{(duracion * pistaSeleccionada.precio).toFixed(2)}€</span>
            </div>
            {formData.ludoteca && (
              <div className="desglose-item">
                <span>+ Ludoteca:</span>
                <span>5€</span>
              </div>
            )}
          </div>
        )}
        
        <div className="total-container">
          <span className="total-label">Total:</span>
          <span className={`total-precio ${hayCambio ? 'total-precio-cambiado' : ''} ${!pistaDisponible ? 'total-precio-no-disponible' : ''}`}>
            {precioTotal.toFixed(2)} €
          </span>
        </div>
        
        {hayCambio && (
          <div className="nota-cambio">
            💰 El precio se ha actualizado por los cambios realizados
          </div>
        )}
        
        {/* 🎯 Mostrar información de fecha/hora de creación si estamos en modo edición */}
        {modoEdicion && reservaParaEditar?.created_at && (
          <div className="info-creacion">
            <small>
              📅 Creada el: {formatFechaHoraLocal(reservaParaEditar.created_at)}
            </small>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="formulario-reserva-container">
      <ModalAlerta 
        show={showModal}
        title={modalTitle}
        message={modalMessage}
        onClose={cerrarModal}
      />
      
      <div className="header-with-back">
        <button 
          className="back-button-header"
          onClick={() => navigate(modoEdicion ? '/mis-reservas' : '/reservas')}
          title={modoEdicion ? "Volver a mis reservas" : "Volver al panel"}
        >
          <span className="back-arrow">←</span>
          <span className="back-text">
            {modoEdicion ? "Volver a mis reservas" : "Volver"}
          </span>
        </button>
        
        <div className="header-content">
          <h1 className="formulario-titulo">
            {modoEdicion ? 'Modificar Reserva' : 'Nueva Reserva'}
          </h1>
          <p className="formulario-subtitulo">
            {modoEdicion 
              ? `Actualiza los datos de tu reserva #${reservaParaEditar?.id || ''}`
              : 'Completa los datos para realizar tu reserva'
            }
          </p>
          
          {modoEdicion && reservaParaEditar && (
            <div className="info-reserva-actual">
              <small>
                Reserva actual: #{reservaParaEditar.id} | Estado: {reservaParaEditar.estado} | 
                Ludoteca: {reservaParaEditar.ludoteca ? 'Sí' : 'No'}
                {reservaParaEditar.created_at && (
                  <> | 📅 Creada: {formatFechaHoraLocal(reservaParaEditar.created_at)}</>
                )}
              </small>
            </div>
          )}
        </div>
      </div>

      {errores.general && (
        <div className="error-container">
          ❌ {errores.general}
        </div>
      )}

      {errores.usuario && (
        <div className="error-container">
          ⚠️ {errores.usuario}
        </div>
      )}

      {errores.estado && (
        <div className="error-container error-estado">
          ⚠️ {errores.estado}
        </div>
      )}

      {!modoEdicion && misReservasPendientes.length > 0 && (
        <div className="alert-container">
          ⚠️ Ya tienes una reserva pendiente. No puedes hacer más reservas hasta que completes o canceles la actual.
        </div>
      )}

      <form onSubmit={handleSubmit} className="reserva-form">
        <div className="user-info-section">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <div className="user-container">
              {usuario || 'No identificado'}
            </div>
          </div>
          
          {modoEdicion && reservaParaEditar && (
            <div className="form-group">
              <label className="form-label">Reserva actual</label>
              <div className="reserva-info">
                #{reservaParaEditar.id} • {formatearFechaDesdeBackend(reservaParaEditar.fecha)} • {reservaParaEditar.hora_inicio} - {reservaParaEditar.hora_fin}
                {reservaParaEditar.created_at && (
                  <div className="fecha-creacion-info">
                    <small>📅 Creada: {formatFechaHoraLocal(reservaParaEditar.created_at)}</small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Polideportivo *</label>
          <div className="select-wrapper">
            {loadingPolideportivos ? (
              <div className="loading-indicator">Cargando polideportivos...</div>
            ) : (
              <select
                className="form-select"
                value={formData.polideportivo}
                onChange={(e) => handlePolideportivoChange(e.target.value)}
                required
                disabled={modoEdicion && reservaParaEditar?.estado !== 'pendiente'}
              >
                <option value="">Selecciona un polideportivo</option>
                {polideportivos.map(polideportivo => (
                  <option key={polideportivo.id} value={polideportivo.id}>
                    {polideportivo.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
          {errores.polideportivo && <div className="field-error">{errores.polideportivo}</div>}
        </div>

        {polideportivoSeleccionado && (
          <div className="info-polideportivo">
            📍 {polideportivoSeleccionado.nombre}
            {polideportivoSeleccionado.direccion && ` - ${polideportivoSeleccionado.direccion}`}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Pista *</label>
          <div className="select-wrapper">
            {loadingPistas ? (
              <div className="loading-indicator">Cargando pistas...</div>
            ) : !formData.polideportivo ? (
              <select className="form-select" disabled>
                <option value="">Primero selecciona un polideportivo</option>
              </select>
            ) : pistasFiltradas.length === 0 ? (
              <select className="form-select" disabled>
                <option value="">No hay pistas disponibles en este polideportivo</option>
              </select>
            ) : (
              <select
                className="form-select"
                value={formData.pista}
                onChange={(e) => handlePistaChange(e.target.value)}
                required
                disabled={modoEdicion && reservaParaEditar?.estado !== 'pendiente'}
              >
                <option value="">Selecciona una pista</option>
                {pistasFiltradas.map(pista => (
                  <option key={pista.id} value={pista.id}>
                    {pista.tipo} - {pista.nombre} (€{pista.precio}/hora)
                    {pista.disponible === false && ' - ⚠️ En mantenimiento'}
                  </option>
                ))}
              </select>
            )}
          </div>
          {errores.pista && <div className="field-error">{errores.pista}</div>}
        </div>

        {/* 🆕 Indicador de pistas en mantenimiento */}
        {formData.polideportivo && pistasFiltradas.length > 0 && (
          <div className="info-pistas-disponibles">
            🎯 {pistasFiltradas.length} pista{pistasFiltradas.length !== 1 ? 's' : ''} disponible{pistasFiltradas.length !== 1 ? 's' : ''} 
            (pistas en mantenimiento no se muestran)
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Fecha de la reserva *</label>
          <input
            type="date"
            className="form-input"
            value={formData.fecha}
            onChange={(e) => handleFechaChange(e.target.value)}
            min={hoy}
            required
            disabled={modoEdicion && reservaParaEditar?.estado !== 'pendiente'}
          />
          {errores.fecha && <div className="field-error">{errores.fecha}</div>}
        </div>

        <div className="time-pickers-container">
          <div className="form-group time-picker">
            <label className="form-label">Hora inicio *</label>
            <select
              className="form-select"
              value={formData.horaInicio}
              onChange={(e) => handleHoraInicioChange(e.target.value)}
              disabled={horasInicioDisponibles.length === 0 || (modoEdicion && reservaParaEditar?.estado !== 'pendiente')}
              required
            >
              <option value="">
                {horasInicioDisponibles.length > 0 
                  ? "Selecciona hora" 
                  : esHoy ? "No hay horas disponibles para hoy" : "No hay horas disponibles"}
              </option>
              {horasInicioDisponibles.map(hora => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
            {horasInicioDisponibles.length === 0 && formData.pista && formData.fecha && (
              <div className="no-horas-text">
                {esHoy 
                  ? `Todas las horas disponibles para hoy ya pasaron. Solo puedes reservar horas futuras.`
                  : `Todas las horas están ocupadas para esta fecha y pista`}
              </div>
            )}
            {esHoy && (
              <div className="info-hora-actual">
                <small>🕐 Hora actual: {`${horaActual}:${minutosActuales.toString().padStart(2, '0')}`}</small>
              </div>
            )}
          </div>

          <div className="form-group time-picker">
            <label className="form-label">Hora fin *</label>
            <select
              className="form-select"
              value={formData.horaFin}
              onChange={(e) => handleHoraFinChange(e.target.value)}
              disabled={horasFinDisponibles.length === 0 || !formData.horaInicio || (modoEdicion && reservaParaEditar?.estado !== 'pendiente')}
              required
            >
              <option value="">
                {!formData.horaInicio ? "Primero selecciona hora inicio" :
                 horasFinDisponibles.length > 0 ? "Selecciona hora" : 
                 esHoy ? "No hay horas futuras disponibles" : "No hay horas disponibles para esta hora inicio"}
              </option>
              {horasFinDisponibles.map(hora => (
                <option key={hora} value={hora}>{hora}</option>
              ))}
            </select>
            {horasFinDisponibles.length === 0 && formData.horaInicio && (
              <div className="no-horas-text">
                {esHoy 
                  ? `No hay horas futuras disponibles para esta hora de inicio`
                  : `No hay horas de fin disponibles para esta hora de inicio`}
              </div>
            )}
          </div>
        </div>
        {(errores.horaInicio || errores.horaFin) && (
          <div className="field-error">{errores.horaInicio || errores.horaFin}</div>
        )}

        {validandoDisponibilidad && (
          <div className="validando-container">
            <div className="loading-spinner-small"></div>
            Verificando disponibilidad...
          </div>
        )}

        {errores.disponibilidad && (
          <div className="alert-container">
            ⚠️ {errores.disponibilidad}
          </div>
        )}

        {/* 🆕 Visualización de horas ocupadas */}
        {formData.pista && formData.fecha && reservasExistentes.length > 0 && (
          <div className="horas-ocupadas-info">
            <div className="horas-ocupadas-titulo">Horarios ocupados en esta pista:</div>
            <div className="horas-ocupadas-lista">
              {obtenerBloquesOcupados().map((bloque, index) => (
                <div key={index} className="bloque-ocupado">
                  {`${bloque.inicio.toString().padStart(2, '0')}:00 - ${bloque.fin.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="checkbox-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.ludoteca}
              onChange={handleLudotecaChange}
              className="checkbox-input"
              disabled={modoEdicion && reservaParaEditar?.estado !== 'pendiente'}
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">Incluir servicio de ludoteca (+5€)</span>
          </label>
        </div>

        {(formData.pista && formData.horaInicio && formData.horaFin) && (
          <div className="precio-section">
            <PrecioEstimadoComponent />
          </div>
        )}

        <button
          type="submit"
          className={`submit-button ${loading || Object.keys(errores).length > 0 || (!modoEdicion && misReservasPendientes.length > 0) ? 'button-disabled' : ''}`}
          disabled={loading || Object.keys(errores).length > 0 || (!modoEdicion && misReservasPendientes.length > 0) || (modoEdicion && reservaParaEditar?.estado !== 'pendiente')}
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              {modoEdicion ? 'Actualizando reserva...' : 'Creando reserva...'}
            </>
          ) : (!modoEdicion && misReservasPendientes.length > 0) ? (
            'Reserva Pendiente'
          ) : modoEdicion && reservaParaEditar?.estado !== 'pendiente' ? (
            'Reserva No Modificable'
          ) : modoEdicion ? (
            'Actualizar Reserva'
          ) : (
            'Reservar'
          )}
        </button>
      </form>
    </div>
  );
}

function ModalAlerta({ show, title, message, onClose }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <button className="modal-button" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
}