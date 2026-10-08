import React, { useState } from 'react';
import { 
  Lock, Mail, User, Phone, Eye, EyeOff, ShieldCheck, 
  Sparkles, CheckCircle2, AlertCircle, ArrowRight, MessageSquare, Layers
} from 'lucide-react';
import { authService, FOUNDING_MEMBERS } from '../services/authService';

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Estados para Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('+54 9 11 ');
  const [regNode, setRegNode] = useState('hogar');

  // Estados de retroalimentación
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manejar Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await authService.login(loginEmail, loginPassword);
      setSuccessMsg(`¡Bienvenido/a, ${user.name}! Ingresando...`);
      setTimeout(() => {
        if (onLogin) onLogin(user);
      }, 400);
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Verificá tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar Registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await authService.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        nodeId: regNode
      });

      setSuccessMsg(`¡Cuenta creada con éxito! Vinculado como ${user.name} con WhatsApp bot.`);
      setTimeout(() => {
        if (onLogin) onLogin(user);
      }, 600);
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrarte. Verificá los datos.');
    } finally {
      setLoading(false);
    }
  };

  // Acceso Rápido para Fundadores
  const handleQuickLogin = (founder) => {
    setLoginEmail(founder.email);
    setLoginPassword('abeja123'); // Contraseña default sugerida
    setErrorMsg('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.02) 60%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        
        {/* Cabecera de la Marca */}
        <div style={{
          padding: '2rem 2rem 1.25rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            backgroundColor: '#fffbeb',
            border: '2px solid #fde68a',
            fontSize: '2rem',
            marginBottom: '0.85rem',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
          }}>
            🐝
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Banca Abeja
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.35rem', lineHeight: 1.4 }}>
            Matriz de Autogestión, Trazabilidad & WhatsApp Bot
          </p>
        </div>

        {/* Selector de Pestañas (Iniciar Sesión / Registrarse) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: '6px',
          margin: '1.25rem 1.5rem 0.5rem 1.5rem',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            style={{
              padding: '8px 12px',
              fontSize: '0.88rem',
              fontWeight: mode === 'login' ? 700 : 500,
              color: mode === 'login' ? '#0f172a' : '#64748b',
              backgroundColor: mode === 'login' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '9px',
              boxShadow: mode === 'login' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            style={{
              padding: '8px 12px',
              fontSize: '0.88rem',
              fontWeight: mode === 'register' ? 700 : 500,
              color: mode === 'register' ? '#0f172a' : '#64748b',
              backgroundColor: mode === 'register' ? '#ffffff' : 'transparent',
              border: 'none',
              borderRadius: '9px',
              boxShadow: mode === 'register' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Darse de Alta
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.75rem 2rem 1.75rem' }}>
          
          {/* Mensajes de Alerta */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              color: '#15803d',
              fontSize: '0.84rem',
              marginBottom: '1rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORMULARIO DE INICIO DE SESIÓN */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Correo Electrónico o Usuario
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="ej: ramiro@bancaabeja.org"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 38px 9px 38px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '11px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Validando...' : (
                  <>
                    <span>Entrar a Mi Espacio</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Acceso Rápido / Cuentas Preconfiguradas */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed #e2e8f0' }}>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.65rem', textAlign: 'center', fontWeight: 500 }}>
                  Acceso directo para miembros activos:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {FOUNDING_MEMBERS.map(founder => (
                    <button
                      key={founder.id}
                      type="button"
                      onClick={() => handleQuickLogin(founder)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        color: '#334155',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                      title={`Ingresar como ${founder.name} (${founder.email})`}
                    >
                      👤 {founder.name}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            
            /* FORMULARIO DE REGISTRO / ALTA DE MIEMBRO */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Nombre y Apellido
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="ej: Ramiro Stein"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="ej: ramiro@ejemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Número de WhatsApp (con código de país)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={17} color="#10b981" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="+54 9 11 2745-2476"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      fontSize: '0.9rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  fontSize: '0.74rem',
                  color: '#059669',
                  lineHeight: 1.3
                }}>
                  <MessageSquare size={13} style={{ flexShrink: 0 }} />
                  <span>El bot usará este número para que anotes gastos por WhatsApp en lenguaje natural.</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Nodo Comunitario
                </label>
                <select
                  value={regNode}
                  onChange={(e) => setRegNode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '0.9rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="hogar">Comunidad Hogar (Convivencia & Familia)</option>
                  <option value="vrde">Nodo VRDE (Alimentos & Cocina)</option>
                  <option value="elementales">Nodo Elementales (Tierra & Bio-hábitat)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '0.5rem',
                  padding: '11px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Registrando...' : (
                  <>
                    <span>Darse de Alta & Conectar Bot</span>
                    <Sparkles size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Información de Identidad Única */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginTop: '1.25rem',
            padding: '10px 12px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            fontSize: '0.75rem',
            color: '#64748b',
            lineHeight: 1.4
          }}>
            <ShieldCheck size={16} color="#4f46e5" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Identidad Exclusiva:</strong> Quien inicia sesión opera únicamente bajo su perfil. No se permite alternar identidades sin antes cerrar la sesión.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
