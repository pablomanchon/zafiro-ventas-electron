import { StrictMode } from 'react'
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


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <ModalProvider>
            <SearchProvider>
              <HashRouter>
                <App />
                <Modal />
                <Toaster
                  containerAriaLabel="Notificaciones"
                  position="bottom-right"
                  duration={2400}
                  visibleToasts={3}
                  closeButton
                  swipeDirections={['right', 'left']}
                  theme="dark"
                  expand={false}
                />
              </HashRouter>
            </SearchProvider>
        </ModalProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>,
)

