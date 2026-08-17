export async function compressImageToWebP(file: File, maxWidth = 1080): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo obtener el contexto del canvas'));

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al comprimir la imagen'));
          },
          'image/webp',
          0.8 // Calidad de 0 a 1
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export async function uploadToImgBB(imageBlob: Blob): Promise<string> {
  const IMGBB_API_KEY = "7140d37e8484d08573eba92545a6ed38";

  const formData = new FormData();
  formData.append('image', imageBlob, 'photo.webp');
  
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });
  
  const data = await res.json();
  if (data.success) {
    return data.data.url;
  } else {
    throw new Error(data.error?.message || 'Error al subir la imagen a ImgBB');
  }
}
