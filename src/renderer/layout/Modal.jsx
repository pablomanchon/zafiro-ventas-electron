import React, { useEffect } from 'react';
import { useModal } from '../providers/ModalProvider';
import { X } from 'lucide-react';

export default function Modal() {
  const { isModalOpen, modalStack, closeModal } = useModal();

  // 💡 Cierra el modal al presionar ESC
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen || modalStack.length === 0) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-50 p-2 sm:p-4">
      <div className="modal-backdrop absolute inset-0" onClick={closeModal} />
      {modalStack.map((modalContent, index) => (
        <div
          key={index}
          className={`modal-shell relative mx-auto my-auto w-fit min-w-0 max-w-[96vw] max-h-[94vh] ${index !== modalStack.length - 1 ? 'hidden' : ''}`}
        >
          <button
            type="button"
            aria-label="Cerrar modal"
            className="modal-close"
            onClick={closeModal}
          >
            <X size={18} strokeWidth={2.2} />
          </button>
          <div className="modal-content">{modalContent}</div>
        </div>
      ))}
    </div>
  );
}
