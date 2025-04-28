import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Provider} from "@/components/ui/provider.tsx";
import {CookiesProvider} from "react-cookie";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Provider>
          <CookiesProvider>
            <App />
          </CookiesProvider>
      </Provider>
  </StrictMode>,
)
