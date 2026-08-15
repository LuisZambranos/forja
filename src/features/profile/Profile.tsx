import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../shared/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../../shared/firebase/config';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LogOut, Save, Bell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../../shared/types';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const AVATAR_MALE = (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* Camisa */}
    <path d="M 15 100 C 15 75 35 65 50 65 C 65 65 85 75 85 100" fill="#312E81" />
    {/* Cuello */}
    <rect x="42" y="55" width="16" height="20" fill="#FFCDB2" />
    <polygon points="42,65 50,78 58,65" fill="#FFCDB2" />
    {/* Orejas */}
    <circle cx="30" cy="50" r="6" fill="#FFB4A2" />
    <circle cx="70" cy="50" r="6" fill="#FFB4A2" />
    {/* Cara */}
    <rect x="32" y="25" width="36" height="42" rx="18" fill="#FFCDB2" />
    {/* Pelo */}
    <path d="M 28 45 C 25 15 75 15 72 45 C 72 25 60 15 50 15 C 40 15 28 25 28 45 Z" fill="#4A3B32" />
  </svg>
);

const AVATAR_FEMALE = (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    {/* Pelo trasero (Melena) */}
    <path d="M 28 40 C 28 80 20 85 35 85 L 65 85 C 80 85 72 80 72 40 Z" fill="#4A3B32" />
    {/* Vestido Rosa */}
    <path d="M 15 100 C 15 75 35 65 50 65 C 65 65 85 75 85 100" fill="#EC4899" />
    {/* Cuello */}
    <rect x="42" y="55" width="16" height="20" fill="#FFCDB2" />
    <polygon points="42,65 50,78 58,65" fill="#FFCDB2" />
    {/* Orejas */}
    <circle cx="32" cy="50" r="5" fill="#FFB4A2" />
    <circle cx="68" cy="50" r="5" fill="#FFB4A2" />
    {/* Cara */}
    <rect x="32" y="25" width="36" height="40" rx="18" fill="#FFCDB2" />
    {/* Pelo frontal */}
    <path d="M 26 45 C 26 15 74 15 74 45 C 74 20 60 18 50 18 C 40 18 26 25 26 45 Z" fill="#4A3B32" />
  </svg>
);

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data() as User);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'free',
      settings: { auto_timer: true },
      ...profile,
    }, { merge: true });
    setSaving(false);
    setSaved(true);
    if (user.uid) {
      queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });
    }
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span className="text-primary animate-pulse font-bold">Cargando...</span>
      </div>
    );
  }

  const sex = profile.sex || 'male';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-text">Perfil</h1>
          <p className="text-sm text-text-muted">{profile.display_name || user?.email}</p>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-danger transition-colors py-2 px-3 rounded-xl hover:bg-danger/10"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative">
          {/* Contenedor del degradado circular */}
          <div className="w-32 h-32 rounded-full bg-linear-to-tr from-primary to-highlight p-1">
            <div className="w-full h-full rounded-full bg-[#E2E8F0] overflow-hidden flex items-end justify-center shadow-inner pt-4">
              {sex === 'female' ? AVATAR_FEMALE : AVATAR_MALE}
            </div>
          </div>
        </div>
        
        {/* Selector de sexo */}
        <div className="flex gap-3 justify-center mt-5">
          <button
            onClick={() => setProfile(p => ({ ...p, sex: 'male' }))}
            className={`text-sm px-4 py-2 rounded-xl font-bold border transition-all flex items-center gap-2 ${
              sex === 'male'
                ? 'bg-primary/20 border-primary text-primary'
                : 'border-border text-text-muted hover:border-text-muted/50'
            }`}
          >
            <span>♂</span> Hombre
          </button>
          <button
            onClick={() => setProfile(p => ({ ...p, sex: 'female' }))}
            className={`text-sm px-4 py-2 rounded-xl font-bold border transition-all flex items-center gap-2 ${
              sex === 'female'
                ? 'bg-highlight/20 border-highlight text-highlight'
                : 'border-border text-text-muted hover:border-text-muted/50'
            }`}
          >
            <span>♀</span> Mujer
          </button>
        </div>
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-4 mb-6">
        <Input
          label="Correo Electrónico"
          value={user?.email || ''}
          disabled
          readOnly
        />
        <Input
          label="Nombre"
          placeholder="¿Cómo te llaman?"
          value={profile.display_name || ''}
          onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
        />
        <Input
          label="Altura (cm)"
          type="number"
          placeholder="175"
          value={profile.height_cm || ''}
          onChange={e => setProfile(p => ({ ...p, height_cm: Number(e.target.value) }))}
        />
      </div>

      {/* Configuración Notificaciones */}
      <div className="bg-surface border border-border p-4 rounded-2xl mb-8 flex items-center justify-between">
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <Bell className="w-4 h-4 text-highlight" /> Notificaciones Push
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Recordatorios semanales para no perder el hábito.
          </p>
        </div>
        <Button 
          variant={permission === 'granted' ? 'secondary' : 'highlight'}
          size="sm"
          onClick={requestPermission}
          disabled={permission === 'granted' || permission === 'denied'}
          className={permission === 'granted' ? 'opacity-50' : ''}
        >
          {permission === 'granted' ? 'Activadas' : permission === 'denied' ? 'Bloqueadas' : 'Activar'}
        </Button>
      </div>



      <Button
        variant="highlight"
        fullWidth
        size="lg"
        onClick={handleSave}
        disabled={saving}
        className="rounded-2xl h-14 font-black"
      >
        <Save className="mr-2 w-5 h-5" />
        {saving ? 'Guardando...' : saved ? '¡Guardado! ✓' : 'Guardar Perfil'}
      </Button>
    </div>
  );
}
