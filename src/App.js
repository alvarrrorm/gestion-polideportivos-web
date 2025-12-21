import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexto/AuthProvider';
import Inicio from './vistas/inicio';
import Login from './vistas/login';
import Registro from './vistas/registro';
import Selector from './vistas/selector';
import CrearReserva from './vistas/NuevaReserva';
import AdminPanel from './vistas/admin';           
import AdminPoli from './vistas/AdminPoli';       
import ResumenReserva from './vistas/ResumenReserva';
import FormularioReserva from './componentes/FormularioReserva';
import RecuperarPassword from './vistas/recuperacion';
import MisReservas from './vistas/MisReservas';
import './App.css';

// Componente ProtectedRoute actualizado con validación de roles específicos
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.rol)) {
    console.log(`⚠️ Acceso denegado: Rol ${user?.rol} no tiene permiso para esta ruta`);
    return <Navigate to="/reservas" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* 👇 RUTA PRINCIPAL - TODOS ven la página de INICIO */}
            <Route path="/" element={<Inicio />} />
            
            {/* 👇 RUTAS PÚBLICAS */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            
            {/* 👇 RUTA PROTEGIDA PRINCIPAL - Selector (con redirección interna) */}
            <Route path="/reservas" element={
              <ProtectedRoute>
                <Selector />
              </ProtectedRoute>
            } />
            
            {/* 👇 RUTAS PROTEGIDAS NORMALES */}
            <Route path="/crear-reserva" element={
              <ProtectedRoute>
                <CrearReserva />
              </ProtectedRoute>
            } />
            
            <Route path="/formulario-reserva" element={
              <ProtectedRoute>
                <FormularioReserva />
              </ProtectedRoute>
            } />
            
            <Route path="/resumen-reserva" element={
              <ProtectedRoute>
                <ResumenReserva />
              </ProtectedRoute>
            } />
            
            <Route path="/mis-reservas" element={
              <ProtectedRoute>
                <MisReservas />
              </ProtectedRoute>
            } />
            
            {/* 👇 RUTAS DE ADMINISTRACIÓN - CON VALIDACIÓN DE ROLES ESPECÍFICOS */}
            
            {/* RUTA PARA ADMIN_POLI - DEBE IR PRIMERO */}
            <Route path="/admin-poli" element={
              <ProtectedRoute allowedRoles={['admin_poli']}>
                <AdminPoli /> {/* 👈 AHORA APUNTA AL COMPONENTE CORRECTO */}
              </ProtectedRoute>
            } />
            
            {/* RUTA PARA SUPER_ADMIN Y ADMIN GENERAL */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            
            {/* 👇 Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;