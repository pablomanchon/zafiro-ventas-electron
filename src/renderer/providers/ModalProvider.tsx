import { createContext, useContext, useRef, useState, type ReactNode } from 'react'

interface ModalContextValue {
  isModalOpen: boolean
  modalStack: ReactNode[]
  openModal: (content: ReactNode) => void
  closeModal: () => void
  setFormDirty: (dirty: boolean) => void
  isFormDirty: () => boolean
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalStack, setModalStack] = useState<ReactNode[]>([])
  const isModalOpen = modalStack.length > 0
  const dirtyRef = useRef(false)

  const openModal = (content: ReactNode) => {
    setModalStack(stack => [...stack, content])
  }

  const closeModal = () => {
    setModalStack(stack => stack.slice(0, -1))
  }

  const setFormDirty = (dirty: boolean) => {
    dirtyRef.current = dirty
  }

  const isFormDirty = () => dirtyRef.current

  return (
    <ModalContext.Provider value={{ isModalOpen, modalStack, openModal, closeModal, setFormDirty, isFormDirty }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
