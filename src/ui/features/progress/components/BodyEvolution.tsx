import { useState, useRef } from 'react';
import { Plus, Camera, Trash2, Edit2, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useBodyEvolution } from '@ui/hooks/useBodyEvolution';
import { compressImageToWebP, uploadToImgBB } from '@core/services/storage.service';
import { Button } from '@ui/components/ui/Button';
import { Input } from '@ui/components/ui/Input';
import type { BodyMetric } from '@core/models';

export function BodyEvolution() {
  const { metrics, isLoading, isAdding, isUpdating, addMetric, updateMetric, deleteMetric } = useBodyEvolution();
  const [showModal, setShowModal] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  
  // Medidas
  const [arm, setArm] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [legs, setLegs] = useState('');

  // Fotos
  const [images, setImages] = useState<{ front: File | null; side: File | null; back: File | null }>({ front: null, side: null, back: null });
  const [previews, setPreviews] = useState<{ front: string; side: string; back: string }>({ front: '', side: '', back: '' });

  const [uploading, setUploading] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleOpenNew = () => {
    setEditingId(null);
    setWeight(''); setFat(''); setArm(''); setChest(''); setWaist(''); setLegs('');
    setImages({ front: null, side: null, back: null });
    setPreviews({ front: '', side: '', back: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (m: BodyMetric) => {
    setEditingId(m.id);
    setWeight(String(m.weight_kg || ''));
    setFat(m.body_fat_pct ? String(m.body_fat_pct) : '');
    setArm(m.measurements?.arm ? String(m.measurements.arm) : '');
    setChest(m.measurements?.chest ? String(m.measurements.chest) : '');
    setWaist(m.measurements?.waist ? String(m.measurements.waist) : '');
    setLegs(m.measurements?.legs ? String(m.measurements.legs) : '');
    
    setImages({ front: null, side: null, back: null });
    setPreviews({ 
      front: m.photos?.front || '', 
      side: m.photos?.side || '', 
      back: m.photos?.back || '' 
    });
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImages(prev => ({ ...prev, [type]: file }));
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [type]: url }));
    }
  };

  const handleSave = async () => {
    if (!weight) return;
    try {
      setUploading(true);
      
      const uploadPromises: Promise<{ type: string, url: string }>[] = [];
      
      const uploadImage = async (file: File, type: string) => {
        const webpBlob = await compressImageToWebP(file);
        const url = await uploadToImgBB(webpBlob);
        return { type, url };
      };

      if (images.front) uploadPromises.push(uploadImage(images.front, 'front'));
      if (images.side) uploadPromises.push(uploadImage(images.side, 'side'));
      if (images.back) uploadPromises.push(uploadImage(images.back, 'back'));

      const results = await Promise.all(uploadPromises);
      
      const photos: any = {};
      // Mantener las URLs anteriores si no subimos una nueva
      if (previews.front && !images.front) photos.front = previews.front;
      if (previews.side && !images.side) photos.side = previews.side;
      if (previews.back && !images.back) photos.back = previews.back;

      // Añadir las URLs recién subidas
      results.forEach(res => { photos[res.type] = res.url; });

      const measurements: any = {};
      if (arm) measurements.arm = Number(arm);
      if (chest) measurements.chest = Number(chest);
      if (waist) measurements.waist = Number(waist);
      if (legs) measurements.legs = Number(legs);

      // Usar objetos limpios o undefined/null para que Firebase sobreescriba correctamente
      const metricData: any = {
        weight_kg: Number(weight),
      };
      
      if (fat) metricData.body_fat_pct = Number(fat);
      if (Object.keys(measurements).length > 0) metricData.measurements = measurements;
      if (Object.keys(photos).length > 0) metricData.photos = photos;

      if (editingId) {
        // Al actualizar, se mandan los campos limpios. 
        // Si borraste el fat, mandamos un update para borrarlo del doc.
        await updateMetric({ 
          id: editingId, 
          data: {
            ...metricData,
            body_fat_pct: fat ? Number(fat) : null,
            measurements: Object.keys(measurements).length > 0 ? measurements : null,
            photos: Object.keys(photos).length > 0 ? photos : null
          }
        });
      } else {
        await addMetric({
          date: new Date().toISOString().split('T')[0],
          ...metricData
        });
      }

      setShowModal(false);
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
        <Button onClick={handleOpenNew} variant="primary" size="sm" className="rounded-xl">
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
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-linear-to-b before:from-primary/50 before:via-border/50 before:to-transparent">
          {metrics.map((m, index) => (
            <div key={m.id} className="relative flex flex-col md:flex-row md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              
              {/* Nodo del Timeline Elegante */}
              <div className="flex items-center justify-center w-6 h-6 rounded-full border border-border/80 bg-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm absolute left-5 top-5 -translate-x-1/2 md:static md:top-auto">
                <div className="relative w-2.5 h-2.5">
                  <div className={`absolute inset-0 rounded-full ${index === 0 ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.8)]' : 'bg-text-muted/30'}`} />
                  {index === 0 && (
                    <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                  )}
                </div>
              </div>
              
              {/* Tarjeta de Registro */}
              <div className="w-[calc(100%-3.2rem)] ml-12 md:ml-0 md:w-[calc(50%-2.5rem)] bg-surface border border-border p-4 rounded-3xl shadow-lg relative hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg">{m.date}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(m)} className="text-text-muted/50 hover:text-primary transition-colors p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMetric(m.id)} className="text-text-muted/50 hover:text-danger transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-end gap-1 mb-1 flex-wrap">
                    <span className="text-2xl font-black text-text leading-none">{m.weight_kg}</span>
                    <span className="text-sm text-text-muted font-bold">kg</span>
                    {m.body_fat_pct && (
                      <span className="text-xs font-medium text-text-muted/80 ml-2 mb-0.5 px-2 py-0.5 bg-bg rounded-md border border-border">
                        Grasa: <span className="text-text">{m.body_fat_pct}%</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid de Medidas (Si existen) */}
                {m.measurements && Object.keys(m.measurements).length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3 bg-bg/50 p-2 rounded-xl text-xs">
                    {m.measurements.arm && <div><span className="text-text-muted">Brazo:</span> <span className="font-bold text-text">{m.measurements.arm}cm</span></div>}
                    {m.measurements.chest && <div><span className="text-text-muted">Pecho:</span> <span className="font-bold text-text">{m.measurements.chest}cm</span></div>}
                    {m.measurements.waist && <div><span className="text-text-muted">Cintura:</span> <span className="font-bold text-text">{m.measurements.waist}cm</span></div>}
                    {m.measurements.legs && <div><span className="text-text-muted">Pierna:</span> <span className="font-bold text-text">{m.measurements.legs}cm</span></div>}
                  </div>
                )}

                {/* Grid de Fotos Centrado */}
                {m.photos && Object.keys(m.photos).length > 0 && (
                  <div className="flex justify-center gap-2 mt-2">
                    {['front', 'side', 'back'].map(type => {
                      const url = (m.photos as any)[type];
                      if (!url) return null;
                      return (
                        <div key={type} onClick={() => setFullscreenImage(url)} className="w-16 h-20 rounded-xl overflow-hidden border border-border/50 shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity">
                          <img src={url} alt={type} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visor de Imágenes en Pantalla Completa */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-100 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors" onClick={() => setFullscreenImage(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={fullscreenImage} alt="Fullscreen" className="max-w-full max-h-[90dvh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Modal Formulario */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex flex-col justify-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="bg-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 border border-border shadow-2xl animate-in slide-in-from-bottom-10 max-h-[95dvh] overflow-y-auto">
            <h2 className="text-xl font-black text-text mb-4 sticky top-0 bg-surface z-10 pb-2">
              {editingId ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            
            <div className="space-y-6">
              {/* Peso y Grasa */}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Peso (kg) *" type="number" placeholder="Ej: 75.5" value={weight} onChange={e => setWeight(e.target.value)} autoFocus />
                <Input label="Grasa (%) opcional" type="number" placeholder="Ej: 15" value={fat} onChange={e => setFat(e.target.value)} />
              </div>

              {/* Medidas */}
              <div>
                <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wide">Medidas (cm) opcional</label>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Brazo" type="number" value={arm} onChange={e => setArm(e.target.value)} />
                  <Input placeholder="Pecho" type="number" value={chest} onChange={e => setChest(e.target.value)} />
                  <Input placeholder="Cintura" type="number" value={waist} onChange={e => setWaist(e.target.value)} />
                  <Input placeholder="Piernas" type="number" value={legs} onChange={e => setLegs(e.target.value)} />
                </div>
              </div>

              {/* Fotos */}
              <div>
                <label className="block text-xs font-bold text-text-muted mb-3 uppercase tracking-wide">
                  Fotos de Progreso (Opcional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Foto Frontal */}
                  <div onClick={() => frontInputRef.current?.click()} className="aspect-3/4 border-2 border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center text-text-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden group bg-surface">
                    {previews.front ? (
                      <img src={previews.front} className="w-full h-full object-cover bg-black/10" alt="Front" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-1 opacity-50 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium uppercase">Frontal</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" ref={frontInputRef} onChange={e => handleImageChange(e, 'front')} />
                  </div>

                  {/* Foto Lateral */}
                  <div onClick={() => sideInputRef.current?.click()} className="aspect-3/4 border-2 border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center text-text-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden group bg-surface">
                    {previews.side ? (
                      <img src={previews.side} className="w-full h-full object-cover bg-black/10" alt="Side" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-1 opacity-50 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium uppercase">Lateral</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" ref={sideInputRef} onChange={e => handleImageChange(e, 'side')} />
                  </div>

                  {/* Foto Trasera */}
                  <div onClick={() => backInputRef.current?.click()} className="aspect-3/4 border-2 border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center text-text-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden group bg-surface">
                    {previews.back ? (
                      <img src={previews.back} className="w-full h-full object-cover bg-black/10" alt="Back" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-1 opacity-50 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium uppercase">Trasera</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" ref={backInputRef} onChange={e => handleImageChange(e, 'back')} />
                  </div>

                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 sticky bottom-0 bg-surface pt-4 pb-2">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1" disabled={uploading}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} className="flex-1" disabled={!weight || uploading || isAdding || isUpdating}>
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
