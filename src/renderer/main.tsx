import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
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
                <ToastContainer />
              </HashRouter>
            </SearchProvider>
        </ModalProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>,
)
