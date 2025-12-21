import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexto/AuthProvider'; // 👈 Importar el contexto de autenticación
import './ResumenReserva.css';

export default function ResumenReserva() {
  const [searchParams] = useSearchParams();
  const reservaParam = searchParams.get('reserva');
  const mensaje = searchParams.get('mensaje');
  const precioActualizado = searchParams.get('precioActualizado');
  
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [datosPago, setDatosPago] = useState({
    nombre: '',
    tarjeta: '',
    expiracion: '',
    cvv: ''
  });
  const [screenSize, setScreenSize] = useState('medium');

  // 👇 Obtener usuario y token del contexto de autenticación
  const { user, token } = useAuth();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 380) setScreenSize('small');
      else if (width > 768) setScreenSize('large');
      else if (width > 480) setScreenSize('medium');
      else setScreenSize('small');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parsear reserva desde URL
  useEffect(() => {
    if (reservaParam) {
      try {
        const reservaData = JSON.parse(decodeURIComponent(reservaParam));
        setReserva(reservaData);
      } catch (error) {
        console.error('Error parseando reserva:', error);
      }
    }
  }, [reservaParam]);

  // 👇 Función para obtener headers con autenticación
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // 👇 FUNCIÓN MEJORADA PARA FORMATEAR FECHA
  const formatoFechaLegible = (fechaInput) => {
    if (!fechaInput) return 'No especificado';
    
    let fechaObj;
    
    // Si ya es un string ISO
    if (typeof fechaInput === 'string' && fechaInput.includes('T')) {
      fechaObj = new Date(fechaInput);
    } 
    // Si es formato YYYY-MM-DD
    else if (typeof fechaInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
      fechaObj = new Date(fechaInput + 'T00:00:00');
    }
    // Otros casos
    else {
      fechaObj = new Date(fechaInput);
    }
    
    if (isNaN(fechaObj.getTime())) {
      return 'Fecha inválida';
    }
    
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return fechaObj.toLocaleDateString('es-ES', opciones);
  };

  // 👇 FUNCIÓN MEJORADA PARA OBTENER PRECIO
  const obtenerPrecio = () => {
    if (reserva?.precio === undefined || reserva?.precio === null) return 0;
    return typeof reserva.precio === 'string' ? parseFloat(reserva.precio) : reserva.precio;
  };

  // 👇 FUNCIONES MEJORADAS PARA OBTENER NOMBRES
  const obtenerPolideportivo = () => {
    return reserva?.polideportivo_nombre || 
           reserva?.nombre_polideportivo || 
           (reserva?.polideportivo_id ? `Polideportivo ${reserva.polideportivo_id}` : 'No especificado');
  };

  const obtenerPista = () => {
    return reserva?.pistaNombre || 
           reserva?.nombre_pista || 
           (reserva?.pista_id ? `Pista ${reserva.pista_id}` : 'No especificado');
  };

  const obtenerNombreUsuario = () => {
    return reserva?.nombre_usuario || 'Desconocido';
  };

  useEffect(() => {
    console.log('Datos completos de reserva recibidos:', reserva);
    console.log('Precio de la reserva:', obtenerPrecio());
    console.log('Mensaje:', mensaje);
    console.log('Precio actualizado:', precioActualizado);
    
    // Debug info
    console.log('🔍 DEBUG Reserva:', {
      id: reserva?.id,
      usuario_id: reserva?.usuario_id,
      nombre_usuario: reserva?.nombre_usuario,
      estado: reserva?.estado
    });
    
    // Mostrar mensaje de éxito si existe
    if (mensaje) {
      alert(mensaje);
    }
  }, [reserva, mensaje, precioActualizado]);

  if (!reserva) {
    return (
      <div className="safe-area">
        <div className="centrado">
          <div className="error-texto">No se han recibido datos de la reserva.</div>
        </div>
      </div>
    );
  }

  const manejarEditarReserva = () => {
    console.log('Editando reserva:', reserva);
    window.location.href = `/formulario-reserva?reserva=${encodeURIComponent(JSON.stringify(reserva))}`;
  };

  const manejarCancelarReserva = async () => {
    if (!reserva?.id) {
      alert('Error: No se encontró el ID de la reserva');
      return;
    }

    if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      setLoading(true);
      try {
        console.log('Cancelando reserva ID:', reserva.id);
        
        const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${reserva.id}/cancelar`, {
          method: 'PUT',
          headers: getHeaders() // 👈 Usar headers con autenticación
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Cancelación exitosa:', data);

        if (!data.success) {
          throw new Error(data.error || 'Error al cancelar la reserva');
        }

        alert('Tu reserva ha sido cancelada correctamente.');
        window.location.href = '/mis-reservas';
      } catch (error) {
        console.error('Error en cancelación:', error);
        alert(`Error al cancelar: ${error.message || 'No se pudo cancelar la reserva. Por favor intente nuevamente.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const manejarPago = async () => {
    // Verificar si hay token antes de proceder
    if (!token) {
      alert('⚠️ No estás autenticado. Por favor, inicia sesión para continuar.');
      // Opcional: redirigir al login
      // window.location.href = '/login';
      return;
    }
    
    setModalVisible(true);
  };

  // 👇 FUNCIÓN MEJORADA PARA PROCESAR PAGO CON EMAIL
  const procesarPago = async () => {
    if (!reserva?.id) {
      alert('Error: No se encontró el ID de la reserva');
      return;
    }

    // Verificar token antes de proceder
    if (!token) {
      alert('⚠️ No estás autenticado. Por favor, inicia sesión para continuar.');
      setModalVisible(false);
      return;
    }

    setLoading(true);

    try {
      console.log('✅ Confirmando reserva ID:', reserva.id);
      console.log('📧 Usuario de la reserva:', reserva.nombre_usuario);
      console.log('👤 ID de usuario:', reserva.usuario_id);
      console.log('🔑 Token disponible:', token ? 'Sí' : 'No');
      
      const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${reserva.id}/confirmar`, {
        method: 'PUT',
        headers: getHeaders() // 👈 Usar headers con autenticación
      });

      const responseText = await response.text();
      console.log('📨 Respuesta del servidor:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
      }

      if (!response.ok) {
        // Si el token expiró o es inválido
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          window.location.href = '/login';
          return;
        }
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Confirmación exitosa:', data);

      if (!data.success) {
        throw new Error(data.error || 'Error al confirmar la reserva');
      }

      const reservaActualizada = {
        ...reserva,
        estado: 'confirmada',
        ...data.data
      };

      const precioFinal = obtenerPrecio();
      
      // 👇 MENSAJE MEJORADO CON MÁS INFORMACIÓN
      let mensajeExito = `Reserva #${reserva.id} confirmada correctamente.\nTotal: ${precioFinal} €`;
      
      if (data.message) {
        mensajeExito += `\n\n📋 ${data.message}`;
      }
      
      if (data.warning) {
        mensajeExito += `\n\n⚠️ ${data.warning}`;
      } else if (!data.warning && data.message && data.message.includes('email')) {
        mensajeExito += `\n\n📧 Se ha enviado un email de confirmación a tu correo.`;
      } else if (!data.warning) {
        mensajeExito += `\n\n📧 Se ha enviado un email de confirmación a tu correo.`;
      }

      alert(mensajeExito);
      window.location.href = `/mis-reservas?reserva=${encodeURIComponent(JSON.stringify(reservaActualizada))}`;
    } catch (error) {
      console.error('❌ Error en confirmación:', error);
      
      let mensajeError = error.message || 'No se pudo confirmar la reserva. Por favor intente nuevamente.';
      
      // Mensajes más específicos según el error
      if (error.message.includes('usuario') || error.message.includes('email')) {
        mensajeError += '\n\n💡 Asegúrate de que estés registrado correctamente en el sistema.';
      }
      
      if (error.message.includes('pendiente')) {
        mensajeError += '\n\n💡 La reserva ya estaba confirmada o no existe.';
      }
      
      alert(`Error al confirmar: ${mensajeError}`);
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  // 👇 NUEVA FUNCIÓN PARA REENVIAR EMAIL
  const reenviarEmailConfirmacion = async () => {
    if (!reserva?.id) {
      alert('Error: No se encontró el ID de la reserva');
      return;
    }

    // Verificar token antes de proceder
    if (!token) {
      alert('⚠️ No estás autenticado. Por favor, inicia sesión para continuar.');
      return;
    }

    setLoading(true);

    try {
      console.log('Reenviando email para reserva ID:', reserva.id);
      
      const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${reserva.id}/reenviar-email`, {
        method: 'POST',
        headers: getHeaders() // 👈 Usar headers con autenticación
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Reenvío exitoso:', data);

      if (!data.success) {
        throw new Error(data.error || 'Error al reenviar el email');
      }

      alert('✅ Email reenviado\n\nSe ha enviado nuevamente el email de confirmación a tu correo.');
    } catch (error) {
      console.error('Error reenviando email:', error);
      alert(`Error al reenviar email: ${error.message || 'No se pudo reenviar el email. Por favor intente nuevamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatoTarjeta = (numero) => {
    const limpio = numero.replace(/\D/g, '');
    const partes = [];
    for (let i = 0; i < limpio.length; i += 4) {
      partes.push(limpio.substr(i, 4));
    }
    return partes.join(' ');
  };

  const validarFormulario = () => {
    return (
      datosPago.nombre.trim() &&
      datosPago.tarjeta.replace(/\D/g, '').length >= 13 &&
      datosPago.expiracion.length === 5 &&
      datosPago.cvv.length >= 3
    );
  };

  const estaConfirmada = reserva.estado === 'confirmada';
  const estaPendiente = reserva.estado === 'pendiente';
  const precioReserva = obtenerPrecio();

  return (
    <div className="safe-area">
      <div className="resumen-content">
        {/* Header con gradiente */}
        <div className="header">
          <h1 className={`titulo titulo-${screenSize}`}>
            Resumen de Reserva
          </h1>
          <p className={`subtitulo-header subtitulo-header-${screenSize}`}>
            Revisa y confirma los detalles de tu reserva
          </p>
          
          {/* 👇 MOSTRAR MENSAJE DE PRECIO ACTUALIZADO */}
          {precioActualizado && (
            <div className="precio-actualizado-banner">
              <span className="precio-actualizado-text">
                ✅ El precio se ha actualizado correctamente
              </span>
            </div>
          )}
        </div>

        {/* Tarjeta principal de detalles */}
        <div className={`tarjeta tarjeta-${screenSize}`}>
          <div className={`encabezado-tarjeta ${screenSize === 'small' ? 'encabezado-tarjeta-small' : ''}`}>
            <h2 className={`titulo-tarjeta titulo-tarjeta-${screenSize}`}>
              Detalles de la Reserva
            </h2>
            <div className={`badge-estado ${estaConfirmada ? 'badge-confirmado' : 'badge-pendiente'}`}>
              <span className="badge-texto">
                {estaConfirmada ? '✅ Confirmada' : '⏳ Pendiente'}
              </span>
            </div>
          </div>

          <div className="grid-detalles">
            <div className={`dato-container ${screenSize === 'small' ? 'dato-container-small' : ''}`}>
              <span className={`dato-label dato-label-${screenSize}`}>Usuario</span>
              <span className={`dato-valor dato-valor-${screenSize}`}>
                {obtenerNombreUsuario()}
              </span>
            </div>

            <div className={`dato-container ${screenSize === 'small' ? 'dato-container-small' : ''}`}>
              <span className={`dato-label dato-label-${screenSize}`}>Número de Reserva</span>
              <span className={`dato-valor dato-valor-${screenSize}`}>
                #{reserva.id || 'Pendiente'}
              </span>
            </div>

            <div className={`dato-container ${screenSize === 'small' ? 'dato-container-small' : ''}`}>
              <span className={`dato-label dato-label-${screenSize}`}>Polideportivo</span>
              <span className={`dato-valor dato-valor-${screenSize}`}>
                {obtenerPolideportivo()}
              </span>
            </div>

            <div className={`dato-container ${screenSize === 'small' ? 'dato-container-small' : ''}`}>
              <span className={`dato-label dato-label-${screenSize}`}>Pista</span>
              <span className={`dato-valor dato-valor-${screenSize}`}>
                {obtenerPista()}
              </span>
            </div>

            <div className={`dato-container ${screenSize === 'small' ? 'dato-container-small' : ''}`}>
              <span className={`dato-label dato-label-${screenSize}`}>Fecha</span>
              <span className={`dato-valor dato-valor-${screenSize}`}>
                {formatoFechaLegible(reserva.fecha)}
              </span>
            </div>

            <div className={`dato-container ${screenSize === 'small' ? 'dato-container-small' : ''}`}>
              <span className={`dato-label dato-label-${screenSize}`}>Horario</span>
              <span className={`dato-valor dato-valor-${screenSize}`}>
                {reserva.hora_inicio} - {reserva.hora_fin}
              </span>
            </div>

            {/* 👇 SECCIÓN DE PRECIO DESTACADA */}
            <div className={`dato-container dato-precio ${screenSize === 'small' ? 'dato-container-small' : ''}`}>
              <span className={`dato-label dato-label-${screenSize}`}>Precio Total</span>
              <div className="precio-container">
                <span className={`precio precio-${screenSize}`}>
                  {precioReserva} €
                </span>
                {precioActualizado && (
                  <span className="precio-actualizado-badge">
                    Actualizado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción para reservas pendientes */}
          {estaPendiente && (
            <div className="botones-accion-container">
              <button 
                className="boton-accion boton-editar"
                onClick={manejarEditarReserva}
                disabled={loading}
              >
                <span className="boton-accion-texto">✏️ Modificar Reserva</span>
              </button>

              <button 
                className="boton-accion boton-cancelar"
                onClick={manejarCancelarReserva}
                disabled={loading}
              >
                <span className="boton-accion-texto">🗑️ Cancelar Reserva</span>
              </button>
            </div>
          )}
        </div>

        {/* Sección de confirmación */}
        {estaPendiente && (
          <div className={`tarjeta tarjeta-${screenSize}`}>
            <h2 className={`titulo-tarjeta titulo-tarjeta-${screenSize}`}>
              Confirmar Reserva
            </h2>
            
            <div className="info-box">
              <span className="info-icon">💡</span>
              <span className={`info-text info-text-${screenSize}`}>
                Al confirmar tu reserva, recibirás un email de confirmación con todos los detalles.
              </span>
            </div>
            
            <div className={`
              botones-container 
              ${screenSize === 'medium' || screenSize === 'large' ? 'botones-fila' : ''}
              ${screenSize === 'small' ? 'botones-container-small' : ''}
            `}>
              <button 
                className={`
                  boton-principal 
                  boton-confirmar
                  ${screenSize === 'small' ? 'boton-principal-small' : ''}
                `} 
                onClick={manejarPago}
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <>
                    <span className={`boton-texto boton-texto-${screenSize}`}>
                      Confirmar Ahora
                    </span>
                    <span className={`boton-subtexto boton-subtexto-${screenSize}`}>
                      Pagar {precioReserva} €
                    </span>
                  </>
                )}
              </button>

              <button 
                className={`
                  boton-principal 
                  boton-secundario
                  ${screenSize === 'small' ? 'boton-principal-small' : ''}
                `} 
                onClick={() => {
                  setModalVisible(false);
                  window.location.href = '/mis-reservas';
                }}
                disabled={loading}
              >
                <span className={`
                  boton-texto 
                  boton-texto-secundario
                  boton-texto-${screenSize}
                `}>
                  Confirmar Más Tarde
                </span>
                <span className={`
                  boton-subtexto 
                  boton-subtexto-secundario
                  boton-subtexto-${screenSize}
                `}>
                  Ir a mis reservas
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 👇 SECCIÓN MEJORADA PARA RESERVAS CONFIRMADAS CON BOTÓN DE REENVÍO */}
        {estaConfirmada && (
          <div className={`tarjeta tarjeta-${screenSize}`}>
            <h2 className={`titulo-tarjeta titulo-tarjeta-${screenSize}`}>
              Reserva Confirmada
            </h2>
            
            <div className="info-box">
              <span className="info-icon">✅</span>
              <span className={`info-text info-text-${screenSize}`}>
                Tu reserva ha sido confirmada y pagada. Se ha enviado un email de confirmación a tu correo.
                <span className="numero-reserva"> #{reserva.id}</span>
              </span>
            </div>

            {/* 👇 BOTÓN PARA REENVIAR EMAIL */}
            <button 
              className="boton-accion boton-email"
              onClick={reenviarEmailConfirmacion}
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <span className="boton-accion-texto boton-email-texto">
                  📧 Reenviar Email de Confirmación
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmación en web */}
      {modalVisible && (
        <div className="modal-overlay">
          <div className={`
            modal-content 
            ${screenSize === 'large' ? 'modal-content-large' : ''}
            ${screenSize === 'small' ? 'modal-content-small' : ''}
          `}>
            <div className="modal-header">
              <h2 className={`
                modal-titulo
                ${screenSize === 'small' ? 'modal-titulo-small' : ''}
              `}>
                Confirmar Pago
              </h2>
              <button 
                className="boton-cerrar"
                onClick={() => setModalVisible(false)}
              >
                <span className="boton-cerrar-texto">×</span>
              </button>
            </div>
            
            <div className="info-box-modal">
              <span className={`
                info-text-modal
                ${screenSize === 'small' ? 'info-text-modal-small' : ''}
              `}>
                Completa los datos de pago para confirmar tu reserva en {obtenerPolideportivo()}.
                Recibirás un email de confirmación con todos los detalles.
              </span>
            </div>
            
            <div className="form-container">
              <div className="input-group">
                <label className={`
                  input-label
                  ${screenSize === 'small' ? 'input-label-small' : ''}
                `}>
                  Nombre en la tarjeta
                </label>
                <input
                  type="text"
                  className={`input ${screenSize === 'small' ? 'input-small' : ''}`}
                  placeholder="Ej: Juan Pérez"
                  value={datosPago.nombre}
                  onChange={(e) => setDatosPago({...datosPago, nombre: e.target.value})}
                />
              </div>
              
              <div className="input-group">
                <label className={`
                  input-label
                  ${screenSize === 'small' ? 'input-label-small' : ''}
                `}>
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  className={`input ${screenSize === 'small' ? 'input-small' : ''}`}
                  placeholder="0000 0000 0000 0000"
                  value={formatoTarjeta(datosPago.tarjeta)}
                  onChange={(e) => setDatosPago({...datosPago, tarjeta: e.target.value.replace(/\D/g, '')})}
                  maxLength={19}
                />
              </div>
              
              <div className={`
                fila-inputs
                ${screenSize === 'small' ? 'fila-inputs-small' : ''}
              `}>
                <div className="input-group">
                  <label className={`
                    input-label
                    ${screenSize === 'small' ? 'input-label-small' : ''}
                  `}>
                    Fecha expiración
                  </label>
                  <input
                    type="text"
                    className={`input ${screenSize === 'small' ? 'input-small' : ''}`}
                    placeholder="MM/AA"
                    value={datosPago.expiracion}
                    onChange={(e) => {
                      const limpio = e.target.value.replace(/[^0-9]/g, '');
                      if (limpio.length > 2) {
                        setDatosPago({...datosPago, expiracion: `${limpio.substring(0, 2)}/${limpio.substring(2, 4)}`});
                      } else {
                        setDatosPago({...datosPago, expiracion: limpio});
                      }
                    }}
                    maxLength={5}
                  />
                </div>
                
                <div className="input-group">
                  <label className={`
                    input-label
                    ${screenSize === 'small' ? 'input-label-small' : ''}
                  `}>
                    CVV
                  </label>
                  <input
                    type="text"
                    className={`input ${screenSize === 'small' ? 'input-small' : ''}`}
                    placeholder="123"
                    value={datosPago.cvv}
                    onChange={(e) => setDatosPago({...datosPago, cvv: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
            
            <div className="resumen-pago">
              <span className={`
                resumen-label
                ${screenSize === 'small' ? 'resumen-label-small' : ''}
              `}>
                Total a pagar:
              </span>
              <span className={`
                resumen-precio
                ${screenSize === 'small' ? 'resumen-precio-small' : ''}
              `}>
                {precioReserva} €
              </span>
            </div>
            
            <div className={`
              botones-modal
              ${screenSize === 'small' ? 'botones-modal-small' : ''}
            `}>
              <button 
                className="boton-modal boton-cancelar-modal"
                onClick={() => setModalVisible(false)}
              >
                <span className="texto-boton-modal">Cancelar</span>
              </button>
              
              <button 
                className={`boton-modal boton-confirmar-modal ${!validarFormulario() ? 'boton-disabled' : ''}`}
                onClick={procesarPago}
                disabled={!validarFormulario() || loading}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <span className="texto-boton-modal">
                    Pagar {precioReserva} €
                  </span>
                )}
              </button>
            </div>

            <button 
              className="boton-mas-tarde-modal"
              onClick={() => {
                setModalVisible(false);
                window.location.href = '/mis-reservas';
              }}
            >
              <span className="texto-boton-mas-tarde">Confirmar más tarde</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}