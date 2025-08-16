// middleware/uploadSliderMiddleware.js    
// import multer from 'multer';  //by jerry
// import fs from 'fs';
// import path from 'path';

// const sliderFolder = './uploads/sliders';

// if (!fs.existsSync(sliderFolder)) {
//   fs.mkdirSync(sliderFolder, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, sliderFolder),
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, unique + path.extname(file.originalname));
//   }
// });

// export const uploadSliderImage = multer({ storage });

//by thomas

// middleware/uploadSliderMiddleware.js
import multer from 'multer';

// Store files in memory instead of saving to backend folder
const storage = multer.memoryStorage();

export const uploadSliderImage = multer({ storage });
