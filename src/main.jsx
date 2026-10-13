import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary detectó un error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('banca_abeja_elements_v2');
      localStorage.removeItem('banca_abeja_element_transactions_v2');
      localStorage.removeItem('banca_abeja_main_accounts_v2');
    } catch(e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🐝</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Actualización de Banca Abeja
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Se actualizaron los componentes de elementos y billetera. Presioná el botón para sincronizar tu vista.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              🔄 Sincronizar & Cargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
