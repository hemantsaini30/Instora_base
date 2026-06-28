const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getDashboard, getDashboardStats } = require('../controllers/adminController');
const { getAllInquiries, updateInquiryStatus, deleteInquiry } = require('../controllers/inquiryController');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/stats', getDashboardStats);
router.get('/inquiries', getAllInquiries);
router.patch('/inquiries/:id', updateInquiryStatus);
router.delete('/inquiries/:id', deleteInquiry);

module.exports = router;