/**
 * Mengompres gambar base64 ke ukuran maksimal tertentu
 * Berguna untuk menjaga database tetap ringan dan PDF cepat dirender.
 */
export async function compressImage(base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Hitung rasio aspek
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(base64Str);

            ctx.drawImage(img, 0, 0, width, height);
            
            // Kembalikan sebagai base64 dengan kompresi jpeg (lebih ringan)
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
    });
}
