import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ResumenReservaCompleto({ route }) {
  const navigation = useNavigation();
  const { reserva, reservaId } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [datosReserva, setDatosReserva] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos del usuario y token
  useEffect(() => {
    loadUserData();
  }, []);

  // Cargar datos de la reserva
  useEffect(() => {
    if (reserva || reservaId) {
      loadReservaData();
    } else {
      setIsLoadingData(false);
    }
  }, [reserva, reservaId, token]);

  const loadUserData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const storedUserData = await AsyncStorage.getItem('userData');
      
      if (userToken) {
        setToken(userToken);
      }
      
      if (storedUserData) {
        const parsedUser = JSON.parse(storedUserData);
        setUserData(parsedUser);
        console.log('👤 Usuario cargado:', parsedUser);
      }
    } catch (error) {
      console.error('❌ Error cargando datos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
    }
  };

  const loadReservaData = async () => {
    setIsLoadingData(true);
    try {
      // Si ya tenemos los datos de la reserva en los params
      if (reserva) {
        console.log('📋 Usando datos de reserva de params:', reserva);
        setDatosReserva(reserva);
        setIsLoadingData(false);
        return;
      }

      // Si solo tenemos el ID, cargar desde la API
      if (reservaId && token) {
        console.log('🔄 Cargando reserva ID:', reservaId);
        await fetchReservaFromAPI(reservaId);
      } else {
        // Datos de ejemplo para desarrollo
        setDatosReserva({
          id: reservaId || 41,
          usuario: userData?.nombre || 'Usuario',
          usuario_id: userData?.id || 3,
          numero_reserva: `#${reservaId || '41'}`,
          polideportivo: 'Polideportivo 1',
          pista: 'Pista Padel 2',
          fecha: 'viernes, 19 de diciembre de 2025',
          horario: '11:00 - 13:00',
          precio: 36.00,
          estado: 'pendiente',
          email: userData?.email || 'correo@ejemplo.com',
          telefono: userData?.telefono || '+34 600 000 000',
          duracion: '2 horas',
          deporte: 'Pádel',
          creado_en: new Date().toISOString(),
          puede_confirmar: true // Bandera para permisos
        });
      }
    } catch (error) {
      console.error('❌ Error cargando datos de reserva:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de la reserva');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchReservaFromAPI = async (id) => {
    try {
      const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo cargar la reserva`);
      }
      
      const data = await response.json();
      console.log('📡 Datos de reserva desde API:', data);
      
      if (data.success && data.reserva) {
        setDatosReserva(data.reserva);
      } else {
        throw new Error(data.error || 'Reserva no encontrada');
      }
    } catch (error) {
      console.error('❌ Error fetching reserva:', error);
      // Mostrar datos de ejemplo si la API falla
      setDatosReserva({
        id: id,
        usuario: userData?.nombre || 'Usuario',
        usuario_id: userData?.id || 3,
        numero_reserva: `#${id}`,
        polideportivo: 'Polideportivo 1',
        pista: 'Pista Padel 2',
        fecha: 'viernes, 19 de diciembre de 2025',
        horario: '11:00 - 13:00',
        precio: 36.00,
        estado: 'pendiente',
        email: userData?.email || 'correo@ejemplo.com',
        telefono: userData?.telefono || '+34 600 000 000',
        duracion: '2 horas',
        deporte: 'Pádel',
        creado_en: new Date().toISOString(),
        puede_confirmar: true
      });
    }
  };

  // Función para recargar datos
  const onRefresh = async () => {
    setRefreshing(true);
    if (datosReserva?.id) {
      await fetchReservaFromAPI(datosReserva.id);
    }
    setRefreshing(false);
  };

  // Función para confirmar la reserva
  const confirmarReserva = async () => {
    if (!datosReserva || !datosReserva.id) {
      Alert.alert('Error', 'No hay datos de reserva válidos');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'No estás autenticado. Por favor, inicia sesión nuevamente.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 Iniciando confirmación de reserva...');
      console.log('📋 ID Reserva:', datosReserva.id);
      console.log('👤 Usuario actual:', userData);
      console.log('🔑 Token disponible:', !!token);

      const baseUrl = 'https://tfgv2-production.up.railway.app/api';
      let url = `${baseUrl}/reservas/${datosReserva.id}/confirmar`;
      let method = 'PUT';
      
      // Si es admin, podríamos necesitar enviar datos adicionales
      const requestBody = {
        confirmado_por: userData?.id,
        rol_usuario: userData?.rol
      };

      console.log('🌐 URL:', url);
      console.log('📤 Request body:', requestBody);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      console.log('📨 Respuesta del servidor:', data);
      console.log('📊 Status:', response.status);
      
      if (!response.ok) {
        // Intentar con ruta alternativa si falla
        if (response.status === 404 || response.status === 403) {
          console.log('🔄 Intentando con ruta alternativa...');
          
          // Intentar con POST si PUT falla
          const response2 = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          const data2 = await response2.json();
          console.log('📨 Respuesta alternativa:', data2);
          
          if (response2.ok) {
            handleSuccessResponse(data2);
            return;
          }
          
          throw new Error(data2.error || `Error ${response2.status}: No se pudo confirmar la reserva`);
        }
        
        throw new Error(data.error || `Error ${response.status}: No se pudo confirmar la reserva`);
      }
      
      handleSuccessResponse(data);
      
    } catch (error) {
      console.error('❌ Error en confirmación:', error);
      Alert.alert(
        'Error de Confirmación', 
        error.message || 'No se pudo confirmar la reserva. Por favor, intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessResponse = (data) => {
    Alert.alert(
      '✅ Reserva Confirmada',
      data.message || 'La reserva ha sido confirmada exitosamente. Se ha enviado un email de confirmación.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Actualizar estado local
            setDatosReserva(prev => ({
              ...prev,
              estado: 'confirmada',
              confirmado_en: new Date().toISOString()
            }));
            
            // Navegar si es necesario
            if (userData?.rol === 'admin_poli') {
              navigation.navigate('AdminReservas');
            } else {
              navigation.navigate('MisReservas');
            }
          }
        }
      ]
    );
  };

  // Función para reenviar email
  const reenviarEmail = async () => {
    if (!datosReserva || !datosReserva.id) {
      Alert.alert('Error', 'No hay datos de reserva válidos');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('📧 Reenviando email para reserva ID:', datosReserva.id);

      const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${datosReserva.id}/reenviar-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: userData?.id,
          forzar_envio: true
        }),
      });
      
      const data = await response.json();
      console.log('📨 Respuesta del servidor:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al reenviar el email');
      }
      
      Alert.alert('✅ Email Reenviado', data.message || 'El email de confirmación ha sido reenviado correctamente');
      
    } catch (error) {
      console.error('❌ Error reenviando email:', error);
      Alert.alert('Error', error.message || 'No se pudo reenviar el email');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cancelar reserva
  const cancelarReserva = async () => {
    if (!datosReserva || !datosReserva.id) {
      Alert.alert('Error', 'No hay datos de reserva válidos');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'No estás autenticado');
      return;
    }

    Alert.alert(
      'Confirmar Cancelación',
      '¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.',
      [
        { text: 'No, mantener reserva', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            
            try {
              console.log('❌ Cancelando reserva ID:', datosReserva.id);

              const response = await fetch(`https://tfgv2-production.up.railway.app/api/reservas/${datosReserva.id}/cancelar`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  cancelado_por: userData?.id,
                  motivo: 'Cancelado por el usuario'
                }),
              });
              
              const data = await response.json();
              console.log('📨 Respuesta del servidor:', data);
              
              if (!response.ok) {
                throw new Error(data.error || 'Error al cancelar la reserva');
              }
              
              Alert.alert(
                '✅ Reserva Cancelada',
                data.message || 'La reserva ha sido cancelada exitosamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setDatosReserva(prev => ({
                        ...prev,
                        estado: 'cancelada',
                        cancelado_en: new Date().toISOString()
                      }));
                      
                      if (userData?.rol === 'admin_poli') {
                        navigation.navigate('AdminReservas');
                      } else {
                        navigation.navigate('MisReservas');
                      }
                    }
                  }
                ]
              );
              
            } catch (error) {
              console.error('❌ Error cancelando reserva:', error);
              Alert.alert('Error', error.message || 'No se pudo cancelar la reserva');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Función para editar reserva
  const editarReserva = () => {
    Alert.alert(
      'Editar Reserva',
      '¿Qué deseas editar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cambiar Fecha/Hora',
          onPress: () => {
            // Navegar a pantalla de edición
            navigation.navigate('EditarReserva', { reservaId: datosReserva.id });
          }
        },
        {
          text: 'Cambiar Pista',
          onPress: () => {
            navigation.navigate('SeleccionarPista', { 
              reservaId: datosReserva.id,
              polideportivoId: datosReserva.polideportivo_id 
            });
          }
        }
      ]
    );
  };

  // Función para verificar permisos
  const tienePermisos = () => {
    if (!userData || !datosReserva) return false;
    
    // Admin puede hacer todo
    if (userData.rol === 'admin_poli') return true;
    
    // Usuario normal solo puede gestionar sus propias reservas
    if (userData.rol === 'usuario') {
      return userData.id === datosReserva.usuario_id;
    }
    
    return false;
  };

  // Determinar el color del estado
  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return '#059669';
      case 'pendiente':
        return '#f59e0b';
      case 'cancelada':
        return '#dc2626';
      case 'completada':
        return '#3b82f6';
      case 'en_curso':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  // Determinar el color de fondo del estado
  const getEstadoBackgroundColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return '#d1fae5';
      case 'pendiente':
        return '#fef3c7';
      case 'cancelada':
        return '#fee2e2';
      case 'completada':
        return '#dbeafe';
      case 'en_curso':
        return '#f3e8ff';
      default:
        return '#f3f4f6';
    }
  };

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  // Mostrar loading si no hay datos
  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Cargando detalles de la reserva...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!datosReserva) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={60} color="#dc2626" />
          <Text style={styles.errorTitle}>Reserva no encontrada</Text>
          <Text style={styles.errorText}>No se pudieron cargar los datos de la reserva</Text>
          <TouchableOpacity 
            style={styles.botonPrincipal}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.textoBotonPrincipal}>Volver atrás</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header con botón volver y título */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#1976D2" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Detalles de Reserva</Text>
          <Text style={styles.headerSubtitle}>{datosReserva.numero_reserva}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.botonRefresh}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Icon 
            name="refresh" 
            size={24} 
            color={refreshing ? '#94a3b8' : '#1976D2'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
      >
        {/* Tarjeta de Estado */}
        <View style={styles.tarjetaEstado}>
          <View style={styles.estadoHeader}>
            <View style={[
              styles.estadoBadge,
              { backgroundColor: getEstadoBackgroundColor(datosReserva.estado) }
            ]}>
              <Text style={[
                styles.estadoTexto,
                { color: getEstadoColor(datosReserva.estado) }
              ]}>
                {datosReserva.estado?.charAt(0).toUpperCase() + datosReserva.estado?.slice(1)}
              </Text>
            </View>
            
            {userData?.rol === 'admin_poli' && (
              <View style={styles.adminBadge}>
                <Icon name="admin-panel-settings" size={14} color="#ffffff" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.estadoDescripcion}>
            {datosReserva.estado === 'pendiente' 
              ? 'Reserva pendiente de confirmación y pago'
              : datosReserva.estado === 'confirmada'
              ? 'Reserva confirmada y pagada'
              : datosReserva.estado === 'cancelada'
              ? 'Reserva cancelada'
              : 'Estado de reserva'}
          </Text>
        </View>

        {/* Sección: Información Principal */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Icon name="sports-tennis" size={20} color="#1976D2" />
            <Text style={styles.seccionTitulo}>Información de la Reserva</Text>
          </View>
          
          <View style={styles.detalleItem}>
            <View style={styles.detalleIcono}>
              <Icon name="person" size={18} color="#64748b" />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Reservado por:</Text>
              <Text style={styles.detalleValor}>{datosReserva.usuario || 'No especificado'}</Text>
              {userData?.rol === 'admin_poli' && datosReserva.usuario_id && (
                <Text style={styles.detalleSubtexto}>ID Usuario: {datosReserva.usuario_id}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.detalleItem}>
            <View style={styles.detalleIcono}>
              <Icon name="location-on" size={18} color="#64748b" />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Instalación:</Text>
              <Text style={styles.detalleValor}>{datosReserva.polideportivo}</Text>
            </View>
          </View>
          
          <View style={styles.detalleItem}>
            <View style={styles.detalleIcono}>
              <Icon name="sports" size={18} color="#64748b" />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Pista/Cancha:</Text>
              <Text style={styles.detalleValor}>{datosReserva.pista}</Text>
              {datosReserva.deporte && (
                <Text style={styles.detalleSubtexto}>Deporte: {datosReserva.deporte}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.detalleItem}>
            <View style={styles.detalleIcono}>
              <Icon name="date-range" size={18} color="#64748b" />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Fecha:</Text>
              <Text style={styles.detalleValor}>{formatFecha(datosReserva.fecha)}</Text>
            </View>
          </View>
          
          <View style={styles.detalleItem}>
            <View style={styles.detalleIcono}>
              <Icon name="access-time" size={18} color="#64748b" />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Horario:</Text>
              <Text style={styles.detalleValor}>{datosReserva.horario}</Text>
              {datosReserva.duracion && (
                <Text style={styles.detalleSubtexto}>Duración: {datosReserva.duracion}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.detalleItem}>
            <View style={styles.detalleIcono}>
              <Icon name="email" size={18} color="#64748b" />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Email de contacto:</Text>
              <Text style={styles.detalleValor}>{datosReserva.email}</Text>
            </View>
          </View>
          
          {datosReserva.telefono && (
            <View style={styles.detalleItem}>
              <View style={styles.detalleIcono}>
                <Icon name="phone" size={18} color="#64748b" />
              </View>
              <View style={styles.detalleContenido}>
                <Text style={styles.detalleLabel}>Teléfono:</Text>
                <Text style={styles.detalleValor}>{datosReserva.telefono}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Sección: Precio y Pago */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Icon name="attach-money" size={20} color="#059669" />
            <Text style={styles.seccionTitulo}>Información de Pago</Text>
          </View>
          
          <View style={styles.precioContainer}>
            <Text style={styles.precioLabel}>Precio Total:</Text>
            <View style={styles.precioValorContainer}>
              <Text style={styles.precioValor}>€{datosReserva.precio?.toFixed(2) || '0.00'}</Text>
              {datosReserva.estado === 'confirmada' && (
                <View style={styles.pagoConfirmadoBadge}>
                  <Icon name="check-circle" size={14} color="#059669" />
                  <Text style={styles.pagoConfirmadoText}>Pagado</Text>
                </View>
              )}
            </View>
          </View>
          
          {datosReserva.creado_en && (
            <View style={styles.detalleItem}>
              <Text style={styles.detalleLabel}>Creado el:</Text>
              <Text style={styles.detalleValor}>
                {new Date(datosReserva.creado_en).toLocaleDateString('es-ES')} 
                {' a las '}
                {new Date(datosReserva.creado_en).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Botones de Acción */}
        {tienePermisos() && datosReserva.estado === 'pendiente' && (
          <View style={styles.accionesContainer}>
            <TouchableOpacity 
              style={[styles.botonAccionPrincipal, isLoading && styles.botonDisabled]}
              onPress={confirmarReserva}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#ffffff" style={styles.botonIcono} />
                  <Text style={styles.textoBotonAccionPrincipal}>
                    {userData?.rol === 'admin_poli' ? 'Confirmar Reserva' : 'Confirmar y Pagar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.botonesSecundarios}>
              <TouchableOpacity 
                style={[styles.botonAccionSecundario, isLoading && styles.botonDisabled]}
                onPress={editarReserva}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Icon name="edit" size={18} color="#1976D2" style={styles.botonIcono} />
                <Text style={styles.textoBotonAccionSecundario}>Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.botonAccionPeligro, isLoading && styles.botonDisabled]}
                onPress={cancelarReserva}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Icon name="cancel" size={18} color="#dc2626" style={styles.botonIcono} />
                <Text style={styles.textoBotonAccionPeligro}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {datosReserva.estado === 'confirmada' && (
          <View style={styles.accionesContainer}>
            <View style={styles.confirmacionContainer}>
              <View style={styles.confirmacionHeader}>
                <Icon name="verified" size={24} color="#059669" />
                <Text style={styles.confirmacionTitulo}>Reserva Confirmada</Text>
              </View>
              <Text style={styles.confirmacionTexto}>
                Tu reserva ha sido confirmada y pagada exitosamente. Se ha enviado un email de confirmación a {datosReserva.email}.
              </Text>
              
              <TouchableOpacity 
                style={[styles.botonAccionSecundario, isLoading && styles.botonDisabled]}
                onPress={reenviarEmail}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1976D2" size="small" />
                ) : (
                  <>
                    <Icon name="email" size={18} color="#1976D2" style={styles.botonIcono} />
                    <Text style={styles.textoBotonAccionSecundario}>Reenviar Email</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {datosReserva.estado === 'cancelada' && (
          <View style={styles.accionesContainer}>
            <View style={styles.cancelacionContainer}>
              <View style={styles.cancelacionHeader}>
                <Icon name="cancel" size={24} color="#dc2626" />
                <Text style={styles.cancelacionTitulo}>Reserva Cancelada</Text>
              </View>
              <Text style={styles.cancelacionTexto}>
                Esta reserva ha sido cancelada. Si necesitas hacer una nueva reserva, por favor visita la sección de reservas.
              </Text>
              
              <TouchableOpacity 
                style={styles.botonAccionSecundario}
                onPress={() => navigation.navigate('Reservas')}
                activeOpacity={0.7}
              >
                <Icon name="add" size={18} color="#1976D2" style={styles.botonIcono} />
                <Text style={styles.textoBotonAccionSecundario}>Nueva Reserva</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Información para Admin */}
        {userData?.rol === 'admin_poli' && (
          <View style={styles.adminInfoContainer}>
            <View style={styles.adminInfoHeader}>
              <Icon name="admin-panel-settings" size={18} color="#7c3aed" />
              <Text style={styles.adminInfoTitle}>Información para Administrador</Text>
            </View>
            
            <View style={styles.adminInfoContent}>
              <View style={styles.adminInfoItem}>
                <Text style={styles.adminInfoLabel}>ID Reserva:</Text>
                <Text style={styles.adminInfoValue}>{datosReserva.id}</Text>
              </View>
              
              <View style={styles.adminInfoItem}>
                <Text style={styles.adminInfoLabel}>ID Usuario:</Text>
                <Text style={styles.adminInfoValue}>{datosReserva.usuario_id || 'N/A'}</Text>
              </View>
              
              <View style={styles.adminInfoItem}>
                <Text style={styles.adminInfoLabel}>Creado:</Text>
                <Text style={styles.adminInfoValue}>
                  {datosReserva.creado_en 
                    ? new Date(datosReserva.creado_en).toLocaleString('es-ES')
                    : 'N/A'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.botonAdmin}
              onPress={() => navigation.navigate('AdminReservaDetalle', { reservaId: datosReserva.id })}
              activeOpacity={0.7}
            >
              <Icon name="visibility" size={18} color="#ffffff" style={styles.botonIcono} />
              <Text style={styles.textoBotonAdmin}>Ver Detalles Completos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTexto}>© Polideportivos App v1.0</Text>
          <Text style={styles.footerSubtexto}>ID Reserva: {datosReserva.numero_reserva}</Text>
          <Text style={styles.footerSubtexto}>
            {userData?.rol === 'admin_poli' ? 'Modo Administrador' : 'Modo Usuario'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botonVolver: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  botonRefresh: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  tarjetaEstado: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  estadoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  estadoTexto: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  estadoDescripcion: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  seccion: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  detalleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detalleIcono: {
    width: 32,
    alignItems: 'center',
    marginTop: 2,
  },
  detalleContenido: {
    flex: 1,
  },
  detalleLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  detalleValor: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  detalleSubtexto: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  precioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  precioLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  precioValorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  precioValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  pagoConfirmadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pagoConfirmadoText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  accionesContainer: {
    marginBottom: 24,
  },
  botonAccionPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  textoBotonAccionPrincipal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  botonesSecundarios: {
    flexDirection: 'row',
    gap: 12,
  },
  botonAccionSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  textoBotonAccionSecundario: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  botonAccionPeligro: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    gap: 8,
  },
  textoBotonAccionPeligro: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  botonIcono: {
    marginRight: 4,
  },
  botonDisabled: {
    opacity: 0.6,
  },
  confirmacionContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  confirmacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confirmacionTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#059669',
  },
  confirmacionTexto: {
    fontSize: 15,
    color: '#065f46',
    lineHeight: 22,
    marginBottom: 16,
  },
  cancelacionContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cancelacionTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  cancelacionTexto: {
    fontSize: 15,
    color: '#b91c1c',
    lineHeight: 22,
    marginBottom: 16,
  },
  adminInfoContainer: {
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  adminInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  adminInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
  },
  adminInfoContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  adminInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  adminInfoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  adminInfoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  botonAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  textoBotonAdmin: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerTexto: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  footerSubtexto: {
    fontSize: 12,
    color: '#cbd5e1',
  },
});

// Componente RefreshControl (si no está importado)
import { RefreshControl } from 'react-native';