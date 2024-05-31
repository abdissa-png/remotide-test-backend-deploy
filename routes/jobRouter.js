const express = require('express');
const jobController = require('./../controllers/JobController');
const isCompany = require('../middleware/companyMiddleware');
const {isAdmin} = require("../middleware/adminMiddleware")
const auth = require('../middleware/auth');

const router = express.Router();

router.route('/').post(auth, isCompany,jobController.createJobPosting).get(auth,isCompany,jobController.getJobPostings);
router.route("/allJobs").get(auth,isAdmin,jobController.getAllJobPostings);
router.route('/:id').get(jobController.getJobPostingById).patch(auth,isCompany,jobController.updateJobPostingById).delete(auth,jobController.deleteJobPostingById);

module.exports = router;
/**
 * @swagger
 * tags:
 *   name: JobPostings
 *   description: Endpoints for managing job postings
 */

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting
 *     description: Create a new job posting
 *     tags: [JobPostings]
 *     parameters:
 *       - in: header
 *         name: auth-token
 *         required: true
 *         description: Authentication token
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobPosting'
 *     responses:
 *       '201':
 *         description: Job posting created successfully
 *       '400':
 *         description: Invalid request body or token
 *       '401':
 *         description: Unauthorized, user is not a company
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all job postings
 *     description: Retrieve a list of all job postings
 *     tags: [JobPostings]
 *     responses:
 *       '200':
 *         description: A list of job postings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JobPosting'
 */

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a job posting by ID
 *     description: Retrieve a job posting by its ID
 *     tags: [JobPostings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the job posting to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A single job posting object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobPosting'
 */

/**
 * @swagger
 * /api/jobs/{id}:
 *   patch:
 *     summary: Update a job posting by ID
 *     description: Update a job posting by its ID
 *     tags: [JobPostings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the job posting to update
 *         schema:
 *           type: string
 *       - in: header
 *         name: auth-token
 *         required: true
 *         description: Authentication token
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobPosting'
 *     responses:
 *       '200':
 *         description: Job posting updated successfully
 *       '400':
 *         description: Invalid request body or token
 *       '401':
 *         description: Unauthorized, user is not a company
 *       '404':
 *         description: Job posting not found
 */

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job posting by ID
 *     description: Delete a job posting by its ID
 *     tags: [JobPostings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the job posting to delete
 *         schema:
 *           type: string
 *       - in: header
 *         name: auth-token
 *         required: true
 *         description: Authentication token
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Job posting deleted successfully
 *       '400':
 *         description: Invalid request body or token
 *       '401':
 *         description: Unauthorized, user is not a company
 *       '404':
 *         description: Job posting not found
 */
