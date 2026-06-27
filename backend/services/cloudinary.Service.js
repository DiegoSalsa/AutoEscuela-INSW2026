const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function validarConfigCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary no esta configurado. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.');
  }
}

function subirImagenVehiculo(file, publicId) {
  validarConfigCloudinary();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'autodrive/vehiculos',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        format: 'webp',
        transformation: [
          { width: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'webp' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    upload.end(file.buffer);
  });
}

async function eliminarImagen(publicId) {
  if (!publicId) return;
  validarConfigCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = { subirImagenVehiculo, eliminarImagen };
