import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Folder path
const testimonialFolder = './uploads/testimonials';

// Ensure directory exists
if (!fs.existsSync(testimonialFolder)) {
  fs.mkdirSync(testimonialFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, testimonialFolder);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

export const uploadTestimonial = multer({ storage });
