import multer from 'multer';
// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.match(/image\/(jpeg|jpg|png|gif)$/)) {
            const err = new Error('Only image files (jpeg, jpg, png, gif) are allowed!');
            return cb(err, false);
        }
        cb(null, true);
    },
});
export default upload;
