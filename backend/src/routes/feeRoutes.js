const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { generateMonthlyFees, getAllFees, getMyFees, getFeeSummary, deleteFeeRecord } = require('../controllers/feeController');

router.use(protect);

router.get('/my', getMyFees);
router.get('/summary', authorize('admin'), getFeeSummary);
router.get('/', authorize('admin'), getAllFees);
router.post('/generate', authorize('admin'), generateMonthlyFees);
router.delete('/:id', authorize('admin'), deleteFeeRecord);

module.exports = router;