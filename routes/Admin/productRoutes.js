import express from 'express';
import { createProduct, deleteProduct, getAllProducts, updateProduct, getCustomHtmlByPid, saveCustomHtml, toggleShowDiscount, checkPrdTypeCount} from '../../controllers/Admin/productController.js'
import { protect } from '../../middleware/authMiddleware.js';
import { upload } from '../../middleware/uploadMiddleware.js';

const productAdminRouter = express.Router();

productAdminRouter.post('/add',protect(['admin']),upload.fields([{ name: 'imgMain', maxCount: 1 },{ name: 'imgMulti', maxCount: 4 }]),createProduct);

productAdminRouter.get('/check-prdtype', protect(['admin']), checkPrdTypeCount);

productAdminRouter.get('/view', protect(['admin']), getAllProducts);


productAdminRouter.put('/update/:pid',protect(['admin']),upload.fields([{ name: 'imgMain', maxCount: 1 },{ name: 'imgMulti', maxCount: 4 }]),updateProduct);

productAdminRouter.put('/delete/:pid', protect(['admin']), deleteProduct);

productAdminRouter.put('/toggle-show-discount/:pid', protect(['admin']), toggleShowDiscount);

productAdminRouter.get('/custom-html/:pid', protect(['admin']), getCustomHtmlByPid);
productAdminRouter.put('/custom-html/:pid', protect(['admin']), saveCustomHtml);


export default productAdminRouter;