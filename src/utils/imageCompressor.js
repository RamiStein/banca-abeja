/**
 * Utilidad para comprimir y procesar imágenes de comprobantes / tickets.
 * Reduce fotos de cámaras de celular (que suelen pesar 5-10 MB) a una miniatura
 * optimizada WebP/JPEG (80-150 KB) ideal para almacenamiento en localStorage y Firestore.
 */

export const compressReceiptImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    // Si no es imagen (ej: PDF), leemos como data URL directo
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          dataUrl: e.target.result,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          isImage: false
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular relación de aspecto
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir preferentemente a image/jpeg para máxima compatibilidad
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve({
          dataUrl,
          fileName: file.name,
          fileType: 'image/jpeg',
          fileSize: Math.round((dataUrl.length * 3) / 4),
          isImage: true,
          width,
          height
        });
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
