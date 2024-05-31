const express = require('express');
const router = express.Router();
const { getResumesId, getAllResumes } = require('../controllers/resumeJsonController');
const bestmatchfinder = require('../controllers/bestMatchController');

// Endpoint to access a resume by its ID
router.get('/resumes/:resumeId', getResumesId);

// Endpoint to get all resumes
router.get('/resumes', getAllResumes);
router.get('/bestcandidates/:JobId', bestmatchfinder.identifyBestCandidates);

module.exports = router;