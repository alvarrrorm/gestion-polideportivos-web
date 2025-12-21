// Configuración para APIs - Usa proxy en producción
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const BASE_URL = IS_PRODUCTION 
  ? '' // Rutas relativas para el proxy en Vercel
  : 'https://tfgv2-production.up.railway.app/api';

export const API_ENDPOINTS = {
  // Para autenticación
  LOGIN: IS_PRODUCTION ? '/api/proxy/login' : `${BASE_URL}/login`,
  REGISTER: IS_PRODUCTION ? '/api/proxy/registro' : `${BASE_URL}/registro`,
  RECUPERAR_PASSWORD: IS_PRODUCTION ? '/api/proxy/recupera' : `${BASE_URL}/recupera`,

  // Para datos
  POLIDEPORTIVOS: IS_PRODUCTION ? '/api/proxy/polideportivos' : `${BASE_URL}/polideportivos`,
  PISTAS: IS_PRODUCTION ? '/api/proxy/pistas' : `${BASE_URL}/pistas`,
  RESERVAS: IS_PRODUCTION ? '/api/proxy/reservas' : `${BASE_URL}/reservas`,
  
  // Endpoints específicos de reservas
  CONFIRMAR_RESERVA: (id) => IS_PRODUCTION ? `/api/proxy/reservas/${id}/confirmar` : `${BASE_URL}/reservas/${id}/confirmar`,
  CANCELAR_RESERVA: (id) => IS_PRODUCTION ? `/api/proxy/reservas/${id}/cancelar` : `${BASE_URL}/reservas/${id}/cancelar`,
  REENVIAR_EMAIL: (id) => IS_PRODUCTION ? `/api/proxy/reservas/${id}/reenviar-email` : `${BASE_URL}/reservas/${id}/reenviar-email`,
};

export default API_ENDPOINTS;