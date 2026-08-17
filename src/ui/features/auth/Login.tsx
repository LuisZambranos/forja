import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@core/config/firebase';
import { Button } from '@ui/components/ui/Button';
import { Input } from '@ui/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import logoNoBg from '../../../assets/logo-removebg.png';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const translateFirebaseError = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Este correo ya está registrado.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Revisa tu internet.';
      default:
        return 'Ha ocurrido un error. Inténtalo de nuevo.';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(translateFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // const handleGoogleAuth = async () => {
  //   setError('');
  //   const provider = new GoogleAuthProvider();
  //   try {
  //     await signInWithPopup(auth, provider);
  //     navigate('/');
  //   } catch (err: any) {
  //     setError(translateFirebaseError(err.code));
  //   }
  // };

  return (
    <div className="min-h-dvh flex flex-col relative bg-bg overflow-hidden max-w-lg mx-auto">
      {/* Fondo con radial gradient sutil centrado arriba */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/20 via-bg to-bg opacity-80 pointer-events-none" />

      {/* Mitad superior: Logo y branding */}
      <div className="flex flex-col items-center justify-center py-8 px-6 relative z-10 gap-3">
        {/* Logo container: div decorativo con el hacha sin fondo */}
        <div className="w-24 h-24 bg-linear-to-br from-primary/20 to-highlight/10 rounded-3xl border border-primary/25 flex items-center justify-center shadow-2xl glow-primary backdrop-blur-sm overflow-hidden">
          <img 
            src={logoNoBg} 
            alt="Forja Logo" 
            className="w-full h-full object-contain scale-125 drop-shadow-[0_0_14px_rgba(139,92,246,0.6)]" 
          />
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-r from-text to-text-muted mb-2 uppercase">
            Forja
          </h1>
          <p className="text-sm font-medium text-text-muted text-center max-w-xs">
            Forja tu disciplina. Registra tu progreso. Supera tus límites.
          </p>
        </div>
      </div>

      {/* Mitad inferior: Card de login (glassmorphism) flotante */}
      <div className="w-full p-4 relative z-10 pb-8">
        <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-text mb-6">
            {isRegister ? 'Comienza tu viaje' : 'Bienvenido de vuelta'}
          </h2>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <Input 
              type="email" 
              placeholder="Tu correo electrónico" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="bg-bg/50"
            />
            <Input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Tu contraseña" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="bg-bg/50"
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              }
            />
            
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger text-xs font-semibold px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              fullWidth 
              variant="highlight"
              className="mt-1 h-14 rounded-2xl text-lg font-bold glow-highlight"
              disabled={loading}
            >
              {loading ? 'Cargando...' : (isRegister ? 'Crear Cuenta' : 'Entrar')}
            </Button>
          </form>

          {/* Google Auth — comentado hasta activar en Firebase Console
          <div className="my-6 relative flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-border/50" />
            <span className="relative bg-surface px-4 text-xs font-bold uppercase tracking-widest text-text-muted">
              O usa
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleGoogleAuth}
            className="w-full h-14 rounded-2xl border border-border bg-bg/50 hover:bg-surface-alt transition-colors flex items-center justify-center gap-3 font-semibold text-text active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
          */}

          <div className="mt-6 text-center">
            <button 
              type="button" 
              className="text-text-muted hover:text-primary transition-colors text-sm font-semibold inline-flex items-center gap-1 active:scale-95"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
            >
              {isRegister ? '¿Ya tienes cuenta?' : '¿Nuevo en Forja?'} 
              <span className="text-primary underline underline-offset-4 decoration-primary/30">
                {isRegister ? 'Inicia Sesión' : 'Crea una'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


