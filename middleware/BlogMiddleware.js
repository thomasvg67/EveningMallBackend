import multer from 'multer';
import fs from 'fs';
import path from 'path';

const blogFolder = './uploads/blogs';

if (!fs.existsSync(blogFolder)) {
  fs.mkdirSync(blogFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, blogFolder),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

export const uploadBlogImage = multer({ storage });
