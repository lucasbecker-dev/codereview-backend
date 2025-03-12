const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const fileController = require('../controllers/file.controller');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Project routes
router.route('/')
    .get(projectController.getProjects)
    .post(authorize('student', 'admin', 'superadmin'), projectController.createProject);

router.route('/:id')
    .get(projectController.getProject)
    .put(projectController.updateProject);

router.route('/:id/status')
    .put(authorize('reviewer', 'admin', 'superadmin'), projectController.updateProjectStatus);

router.route('/:id/feedback')
    .post(authorize('reviewer', 'admin', 'superadmin'), projectController.addFeedback);

// File routes related to projects
router.route('/:projectId/files')
    .get(fileController.getProjectFiles)
    .post(
        authorize('student', 'admin', 'superadmin'),
        fileController.uploadMiddleware,
        fileController.uploadFiles
    );

module.exports = router; 