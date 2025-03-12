const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// File routes
router.route('/:id')
    .get(fileController.getFile);

router.route('/:id/raw')
    .get(fileController.getRawFileContent);

module.exports = router; 