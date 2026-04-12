// src/layout/Confirmation.tsx
import { useEffect, useRef } from 'react';
import { useModal } from '../providers/ModalProvider';
import DangerBtn from '../components/DangerButton';
import PrimaryButton from '../components/PrimaryButton';
import Title from './Title';

interface ConfirmationProps {
  mensaje?: string;
  onConfirm?: () => void;
}

export default function Confirmation({
  mensaje = "¿Estás seguro?",
  onConfirm,
}: ConfirmationProps) {
  const { closeModal } = useModal();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const confirmButton = containerRef.current?.querySelector('button:last-of-type') as HTMLButtonElement | null;
    confirmButton?.focus();
  }, []);

  const confirmar = () => {
    onConfirm?.();
    closeModal();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      e.stopPropagation();
      confirmar();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmar();
    }
  };

  return (
    <div
      className="text-white outline-none p-4"
      tabIndex={0}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <Title>Confirmar acción</Title>
      <p className="mb-6">{mensaje}</p>

      <div className="flex justify-end gap-3">
        <DangerBtn functionClick={closeModal} title="Cancelar" />
        <PrimaryButton functionClick={confirmar} title="Confirmar" />
      </div>
    </div>
  );
}
