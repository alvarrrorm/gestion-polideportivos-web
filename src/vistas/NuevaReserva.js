import React from 'react';
import FormularioReserva from '../componentes/FormularioReserva';
import './CrearReserva.css';

export default function CrearReserva() {
  return (
    <div className="crear-reserva-container">
      <div className="crear-reserva-content">
        <FormularioReserva />
      </div>
    </div>
  );
}