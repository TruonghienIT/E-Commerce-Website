const router = require('express').Router();
const productCtrl = require('../controllers/product');
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken');
const uploader = require('../configs/Cloudinary')
const Product = require('../models/product');

router.post('/', [verifyAccessToken, isAdmin], productCtrl.createProduct);
router.get('/', productCtrl.getAllProduct);
router.put('/ratings', [verifyAccessToken], productCtrl.ratings);


router.get('/rating/average', async (req, res) => {
  try {
    const result = await Product.aggregate([
      { $unwind: "$rating" },
      {
        $group: {
          _id: null,    
          avgRating: { $avg: "$rating.star" }
        }
      }
    ]);

    const avgRating = result.length ? result[0].avgRating : 0;

    res.json({ averageRating: avgRating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/upload/:pid', [verifyAccessToken, isAdmin], uploader.array('images', 10), productCtrl.uploadImageProduct);
router.get('/:pid', productCtrl.getProduct);
router.put('/:pid', [verifyAccessToken, isAdmin], productCtrl.updateProduct);
router.delete('/:pid', [verifyAccessToken, isAdmin], productCtrl.deleteProduct);

module.exports = router