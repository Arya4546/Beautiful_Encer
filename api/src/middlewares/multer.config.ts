import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Multer configuration for file uploads
const storage = multer.memoryStorage(); 

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Accept images only
    if (!file.mimetype.match(/image\/(jpeg|jpg|png|gif)$/)) {
      const err = new Error('Only image files (jpeg, jpg, png, gif) are allowed!');
      return cb(err as unknown as null, false);
    }
    cb(null, true);
  },
});

export default upload;