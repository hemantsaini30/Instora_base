const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createFeeRecord, getAllFees, recordPayment, getFeeSummary, deleteFeeRecord, getMyFees } = require('../controllers/feeController');

router.use(protect);

router.get('/my', getMyFees);
router.get('/summary', authorize('admin'), getFeeSummary);
router.get('/', authorize('admin'), getAllFees);
router.post('/', authorize('admin'), createFeeRecord);
router.patch('/:id/pay', authorize('admin'), recordPayment);
router.delete('/:id', authorize('admin'), deleteFeeRecord);

module.exports = router;