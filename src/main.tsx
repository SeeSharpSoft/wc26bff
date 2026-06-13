import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './context/UserProvider'
import { BetsProvider } from './context/BetsProvider'
import { ResultsProvider } from './context/ResultsProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <ResultsProvider>
        <BetsProvider>
          <App />
        </BetsProvider>
      </ResultsProvider>
    </UserProvider>
  </StrictMode>,
)
