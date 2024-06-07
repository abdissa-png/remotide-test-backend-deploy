/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints for user authentication
 */

/**
 * @swagger
 * /api/users/signup:
 * 
 *   post:
 *     summary: Register a new user
 *     description: Register a new user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User registered successfully
 *       '400':
 *         description: Invalid request body
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     description: Log in with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User logged in successfully
 *       '400':
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/users/talent/profile/{id}:
 *   patch:
 *     summary: Update talent profile
 *     description: Update the profile of a talent user
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the talent user
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
 *             type: object
 *             properties:
 *               // Add properties to be updated in the talent profile
 *     responses:
 *       '200':
 *         description: Talent profile updated successfully
 *       '400':
 *         description: Invalid request body or user ID
 *       '404':
 *         description: Talent profile not found
 */


/**
 * @swagger
 * /api/users/company/profile/{id}:
 *   patch:
 *     summary: Update company profile
 *     description: Update the profile of a company user
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the talent user
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
 *             type: object
 *             properties:
 *               // Add properties to be updated in the company profile
 *     responses:
 *       '200':
 *         description: Company profile updated successfully
 *       '400':
 *         description: Invalid request body or user ID
 *       '404':
 *         description: Company profile not found
 */


// Route definitions
const express = require('express');
const userController = require('../controllers/userController'); // Corrected path
const authController = require('../controllers/authController'); // Corrected path
const isCompany = require('../middleware/companyMiddleware');
const isTalent = require('../middleware/talentMiddleware');

const auth = require('../middleware/auth');
const forgotPassword = require('../controllers/forgotPasswordControllers');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login',authController.login);

router.route('/talent/profile/:id').patch(auth,isTalent,userController.updateTalentProfile).get(auth,userController.getTalentProfile);
router.route('/company/profile/:id').patch(auth,isCompany,userController.updateCompanyProfile).get(auth,isCompany,userController.getCompanyProfile);

// edit profile
router.route('/edit-profile').post(auth,authController.editProfile);
//change password
router.route('/change-password').post(auth,authController.changePassword);
// Endpoint to request password reset
router.route('/forgot-password').post(forgotPassword.forgotPassword);

// Endpoint to handle password reset
router.route('/reset-password/:token').post(forgotPassword.resetPassword);

module.exports = router;
