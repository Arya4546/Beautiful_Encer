import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary environment variables are not set. Please check your .env file.');
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log('✅ Cloudinary configuration loaded.');

  // Ping Cloudinary to verify connection and credentials
  cloudinary.api.ping()
    .then(result => {
      if (result.status === 'ok') {
        console.log('✅ Cloudinary connection verified successfully.');
      }
    })
    .catch(error => console.error('❌ Failed to connect to Cloudinary. Please check your credentials.', error.message));
}

export default cloudinary;