import React, { useEffect } from 'react';
import { useModal } from '../providers/ModalProvider';
import { X } from 'lucide-react';
import Glass from './Glass';

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
    <div className="fixed p-2 inset-0 max-h-screen overflow-y-auto bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Glass styles='min-w-96 p-2 rounded border-black border-2 bg-cyan-800 bg-opacity-30'>

      {modalStack.map((modalContent, index) => (
        <div
        key={index}
        className={`rounded-md shadow-lg max-w-lg w-full relative ${index !== modalStack.length - 1 ? 'hidden' : ''}`}
        >
          <X
            className="absolute cursor-pointer top-0 right-2 text-xl text-white hover:text-orange-600 transition-colors"
            onClick={closeModal}
            />
          <div>{modalContent}</div>
        </div>
      ))}
      </Glass>
    </div>
  );
}
