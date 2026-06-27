const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createBatch, getAllBatches, deleteBatch } = require('../controllers/batchController');

router.use(protect, authorize('admin'));

router.get('/', getAllBatches);
router.post('/', createBatch);
router.delete('/:id', deleteBatch);

module.exports = router;