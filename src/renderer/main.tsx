import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ModalProvider } from './providers/ModalProvider'
import { SearchProvider } from './providers/SearchProvider'
import Modal from './layout/Modal'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <SearchProvider>
          <Router>
            <App />
            <Modal />
          </Router>
        </SearchProvider>
      </ModalProvider>
    </Provider>
  </StrictMode>,
)
