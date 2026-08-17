const CACHE_NAME = 'forja-image-cache-v1';

export const imageCacheService = {
  /**
   * Obtiene una imagen desde la caché local. Si no existe, la descarga,
   * la guarda en la caché y la devuelve como un ObjectURL local.
   */
  async getCachedImage(url: string): Promise<string> {
    if (!url) return '';
    
    // Si no es una URL http/https (por ejemplo un object url de preview), lo devolvemos tal cual
    if (!url.startsWith('http')) return url;

    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return URL.createObjectURL(blob);
      }
      
      // Si no está en caché, la pedimos
      const response = await fetch(url);
      if (response.ok) {
        // Guardamos una copia en la caché
        await cache.put(url, response.clone());
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      
      // Si falla la petición (ej. 404), devolvemos la url original como fallback
      return url;
    } catch (err) {
      console.warn('Error en el servicio de caché de imágenes:', err);
      return url;
    }
  },

  /**
   * Limpia URLs de objetos para liberar memoria
   */
  revokeUrl(objectUrl: string) {
    if (objectUrl && objectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(objectUrl);
    }
  }
};
