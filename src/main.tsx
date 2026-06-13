import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './context/UserProvider'
import { BetsProvider } from './context/BetsProvider'
import { ResultsProvider } from './context/ResultsProvider'
import { BracketProvider } from './context/BracketProvider'
import { ViewerModeProvider } from './context/ViewerModeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <ResultsProvider>
        <BracketProvider>
          <BetsProvider>
            <ViewerModeProvider>
              <App />
            </ViewerModeProvider>
          </BetsProvider>
        </BracketProvider>
      </ResultsProvider>
    </UserProvider>
  </StrictMode>,
)
