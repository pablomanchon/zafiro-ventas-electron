import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Toaster } from 'sonner';
import App from './App'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ModalProvider } from './providers/ModalProvider'
import { SearchProvider } from './providers/SearchProvider'
import Modal from './layout/Modal'
import { AuthProvider } from './providers/AuthProvider'

function AppToaster() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)')
    const onChange = () => setIsMobile(media.matches)

    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <Toaster
      containerAriaLabel="Notificaciones"
      position={isMobile ? 'top-center' : 'bottom-right'}
      duration={2400}
      visibleToasts={3}
      closeButton
      swipeDirections={isMobile ? ['up', 'right', 'left'] : ['right', 'left']}
      theme="dark"
      expand={false}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <ModalProvider>
            <SearchProvider>
              <HashRouter>
                <App />
                <Modal />
                <AppToaster />
              </HashRouter>
            </SearchProvider>
        </ModalProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>,
)

