import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useModal } from '../providers/ModalProvider'
import Confirmation from './Confirmation'

export default function Modal() {
  const { isModalOpen, modalStack, openModal, closeModal } = useModal()
  const closeConfirmOpenRef = useRef(false)

  const requestClose = () => {
    if (closeConfirmOpenRef.current) {
      closeConfirmOpenRef.current = false
      closeModal()
      return
    }

    closeConfirmOpenRef.current = true
    openModal(
      <Confirmation
        mensaje="¿Seguro que querés salir del modal?"
        onConfirm={() => {
          closeConfirmOpenRef.current = false
          closeModal()
        }}
      />
    )
  }

  useEffect(() => {
    if (!isModalOpen) {
      closeConfirmOpenRef.current = false
      return
    }

    const handleKeyDown = (e) => {
      e.stopPropagation()
      if (e.key !== 'Escape') return
      e.preventDefault()
      requestClose()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isModalOpen, openModal, closeModal])

  if (!isModalOpen || modalStack.length === 0) return null

  return (
    <div className="modal-overlay fixed inset-0 z-50 p-2 sm:p-4">
      <div className="modal-backdrop absolute inset-0" onClick={requestClose} />
      {modalStack.map((modalContent, index) => (
        <div
          key={index}
          className={`modal-shell relative mx-auto my-auto max-h-[94vh] min-w-0 max-w-[96vw] w-fit ${
            index !== modalStack.length - 1 ? 'hidden' : ''
          }`}
        >
          <button
            type="button"
            aria-label="Cerrar modal"
            className="modal-close"
            onClick={requestClose}
          >
            <X size={18} strokeWidth={2.2} />
          </button>
          <div className="modal-content">{modalContent}</div>
        </div>
      ))}
    </div>
  )
}
