import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Bila deteksi fitur di index.html menandai peramban tak didukung (mis. browser
// bawaan Kindle lama), jangan mount — pesan fallback statis sudah ditampilkan.
if (!(window as unknown as { __EPUB_UNSUPPORTED__?: boolean }).__EPUB_UNSUPPORTED__) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
