import React from 'react';
import { useModal } from '../providers/ModalProvider';
import DangerBtn from '../components/DangerButton';
import PrimaryButton from '../components/PrimaryButton';
import Title from './Title';

export default function Confirmation({ mensaje = "¿Estás seguro?", onConfirm }) {
  const { closeModal } = useModal();

  const confirmar = () => {
    onConfirm?.();
    closeModal();
  };

  return (
    <div>
      <Title>Confirmar acción</Title>
      <p className="mb-6">{mensaje}</p>

      <div className="flex justify-end gap-3">
        <DangerBtn functionClick={closeModal} title={"Cancelar"}/>
        <PrimaryButton functionClick={confirmar} title={"Confirmar"}/>
        </div>
    </div>
  );
}
