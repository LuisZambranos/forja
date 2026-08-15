import { useState, useRef } from 'react';
import { Plus, Camera, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useBodyEvolution } from '@ui/hooks/useBodyEvolution';
import { compressImageToWebP, uploadToImgBB } from '@core/services/storage.service';
import { Button } from '@ui/components/ui/Button';
import { Input } from '@ui/components/ui/Input';

export function BodyEvolution() {
  const { metrics, isLoading, isAdding, addMetric, deleteMetric } = useBodyEvolution();
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFrontImage(file);
      const url = URL.createObjectURL(file);
      setFrontPreview(url);
    }
  };

  const handleSave = async () => {
    if (!weight) return;
    try {
      setUploading(true);
      let frontUrl = '';
      if (frontImage) {
        const webpBlob = await compressImageToWebP(frontImage);
        frontUrl = await uploadToImgBB(webpBlob);
      }

      await addMetric({
        date: new Date().toISOString().split('T')[0],
        weight_kg: Number(weight),
        ...(fat ? { body_fat_pct: Number(fat) } : {}),
        ...(frontUrl ? { photos: { front: frontUrl } } : {})
      });

      setShowModal(false);
      setWeight('');
      setFat('');
      setFrontImage(null);
      setFrontPreview('');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar el registro. Verifica tu conexión o API Key.');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10 text-text-muted animate-pulse">Cargando métricas...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-10">
      
      <div className="flex justify-between items-center bg-surface border border-border rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-text">Tus Registros</h3>
          <p className="text-xs text-text-muted">El peso y las fotos documentan tu esfuerzo.</p>
        </div>
        <Button onClick={() => setShowModal(true)} variant="primary" size="sm" className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center p-10 bg-surface/50 border border-border/50 rounded-2xl">
          <ImageIcon className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-text-muted">No tienes registros corporales.</p>
          <p className="text-xs text-text-muted/60 mt-1">Añade tu peso y foto inicial.</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border before:to-transparent">
          {metrics.map((m) => (
            <div key={m.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <div className="w-3 h-3 bg-primary rounded-full" />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface border border-border p-4 rounded-2xl shadow-sm relative hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg">{m.date}</span>
                  <button onClick={() => deleteMetric(m.id)} className="text-text-muted/50 hover:text-danger transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-2xl font-black text-text leading-none">{m.weight_kg}</span>
                      <span className="text-sm text-text-muted font-bold">kg</span>
                    </div>
                    {m.body_fat_pct && (
                      <p className="text-xs font-medium text-text-muted/80">Grasa: <span className="text-text">{m.body_fat_pct}%</span></p>
                    )}
                  </div>
                  {m.photos?.front && (
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-border/50 shrink-0">
                      <img src={m.photos.front} alt="Frontal" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Registro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 border border-border shadow-2xl animate-in slide-in-from-bottom-10">
            <h2 className="text-xl font-black text-text mb-4">Nuevo Registro</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Peso (kg) *"
                  type="number"
                  placeholder="Ej: 75.5"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  autoFocus
                />
                <Input
                  label="Grasa (%) opcional"
                  type="number"
                  placeholder="Ej: 15"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">
                  Foto Frontal (Opcional)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center text-text-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden"
                >
                  {frontPreview ? (
                    <img src={frontPreview} className="w-full h-full object-contain bg-black/10" alt="Preview" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm font-medium">Toque para añadir foto</span>
                      <span className="text-[10px] opacity-60">Se comprimirá y guardará segura.</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageChange} 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowModal(false)}
                className="flex-1"
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                className="flex-1"
                disabled={!weight || uploading || isAdding}
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                ) : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
