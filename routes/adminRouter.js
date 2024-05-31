const express = require('express');
const GuideController = require('./../controllers/GuideController');
const packageController = require('../controllers/packageController');
const skillController = require('../controllers/skillController');
const adminController = require("../controllers/adminController")
const jobController = require("../controllers/JobController")
const router = express.Router();
const auth = require('../middleware/auth');
const {isAdmin,isSuperAdmin} = require('../middleware/adminMiddleware');


/**
 * swagger: '2.0'
*info:
* title: Your API
*version: 1.0.0
*securityDefinitions:
* BearerAuth:
*    type: apiKey
*   name: Authorization
*    in: header
*    description: Enter your auth token in the format 'Bearer <token>'
*tags:
* - name: Packages
   description: Endpoints for managing packages
  - name: Guides
    description: Endpoints for managing guides
  - name: Skills
    description: Endpoints for managing skills
 */
/**
 * @swagger
 * /api/admin/packages:
 *   post:
 *     summary: Create a new package
 *     description: Create a new package
 *     tags: [Packages]
 *     parameters:
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       '201':
 *         description: Package created successfully
 *       '400':
 *         description: Invalid request body
 */


/**
 * @swagger
 * /api/admin/packages:
 *   get:
 *     summary: Get all packages
 *     description: Retrieve a list of all packages
 *     tags: [Packages]
 *     responses:
 *       '200':
 *         description: A list of packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Package'
 */

/**
 * @swagger
 * /api/admin/packages/{id}:
 *   get:
 *     summary: Get a package by ID
 *     description: Retrieve a package by its ID
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the package to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A single package object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 */

/**
 * @swagger
 * /api/admin/packages/{id}:
 *   patch:
 *     summary: Update a package by ID
 *     description: Update a package by its ID
 *     tags: [Packages]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the package to update
 *         required: true
 *         type: string
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       '200':
 *         description: Package updated successfully
 *       '400':
 *         description: Invalid request body or package ID
 *       '404':
 *         description: Package not found
 */

/**
 * @swagger
 * /api/admin/packages/{id}:
 *   delete:
 *     summary: Delete a package by ID
 *     description: Delete a package by its ID
 *     tags: [Packages]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the package to delete
 *         required: true
 *         type: string
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: Package deleted successfully
 *       '404':
 *         description: Package not found
 */

/**
 * @swagger
 * tags:
 *   name: Guides
 *   description: Endpoints for managing guides
 */

/**
 * @swagger
 * /api/admin/guides:
 *   post:
 *     summary: Create a new guide
 *     description: Create a new guide
 *     tags: [Guides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Guide'
 *     responses:
 *       '201':
 *         description: Guide created successfully
 *       '400':
 *         description: Invalid request body
 */

/**
 * @swagger
 * /api/admin/guides:
 *   post:
 *     summary: Create a new guide
 *     description: Create a new guide
 *     tags: [Guides]
 *     parameters:
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Guide'
 *     responses:
 *       '201':
 *         description: Guide created successfully
 *       '400':
 *         description: Invalid request body
 */

/**
 * @swagger
 * /api/admin/guides:
 *   get:
 *     summary: Get all guides
 *     description: Retrieve a list of all guides
 *     tags: [Guides]
 *     responses:
 *       '200':
 *         description: A list of guides
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Guide'
 */

/**
 * @swagger
 * /api/admin/guides/{id}:
 *   get:
 *     summary: Get a guide by ID
 *     description: Retrieve a guide by its ID
 *     tags: [Guides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the guide to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A single guide object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Guide'
 */
/**
 * @swagger
 * /api/admin/guides/{id}:
 *   patch:
 *     summary: Update a guide by ID
 *     description: Update a guide by its ID
 *     tags: [Guides]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the guide to update
 *         required: true
 *         type: string
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Guide'
 *     responses:
 *       '200':
 *         description: Guide updated successfully
 *       '400':
 *         description: Invalid request body or guide ID
 *       '404':
 *         description: Guide not found
 */

/**
 * @swagger
 * /api/admin/guides/{id}:
 *   delete:
 *     summary: Delete a guide by ID
 *     description: Delete a guide by its ID
 *     tags: [Guides]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the guide to delete
 *         required: true
 *         type: string
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: Guide deleted successfully
 *       '404':
 *         description: Guide not found
 */


/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: Endpoints for managing skills
 */
/**
 * @swagger
 * /api/admin/skills:
 *   post:
 *     summary: Create a new skill
 *     description: Create a new skill
 *     tags: [Skills]
 *     parameters:
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Skill'
 *     responses:
 *       '201':
 *         description: Skill created successfully
 *       '400':
 *         description: Invalid request body
 */


/**
 * @swagger
 * /api/admin/skills:
 *   get:
 *     summary: Get all skills
 *     description: Retrieve a list of all skills
 *     tags: [Skills]
 *     responses:
 *       '200':
 *         description: A list of skills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 */

/**
 * @swagger
 * /api/admin/skills/{id}:
 *   get:
 *     summary: Get a skill by ID
 *     description: Retrieve a skill by its ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the skill to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A single skill object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 */

/**
 * @swagger
 * /api/admin/skills/{id}:
 *   patch:
 *     summary: Update a skill by ID
 *     description: Update a skill by its ID
 *     tags: [Skills]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the skill to update
 *         required: true
 *         type: string
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Skill'
 *     responses:
 *       '200':
 *         description: Skill updated successfully
 *       '400':
 *         description: Invalid request body or skill ID
 *       '404':
 *         description: Skill not found
 */

/**
 * @swagger
 * /api/admin/skills/{id}:
 *   delete:
 *     summary: Delete a skill by ID
 *     description: Delete a skill by its ID
 *     tags: [Skills]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the skill to delete
 *         required: true
 *         type: string
 *       - name: auth-token
 *         in: header
 *         description: Authentication token
 *         required: true
 *         type: string
 *     responses:
 *       '200':
 *         description: Skill deleted successfully
 *       '404':
 *         description: Skill not found
 */

router.route("/manage")
  .get(auth,isSuperAdmin,adminController.getAllAdmins)
  .post(auth,isSuperAdmin,adminController.createAdmin)
router.route("/manage/:id")
  .get(auth,isSuperAdmin,adminController.getAdmin)
  .patch(auth,isSuperAdmin,adminController.updateAdmin)
  .delete(auth,isSuperAdmin,adminController.deleteAdmin)

// Package routes
router.route('/packages')
  .post(auth, isAdmin, packageController.createPackage)
  .get(packageController.getPackages);

router.route('/packages/:id')
  .get(packageController.getPackageById)
  .patch(auth, isAdmin, packageController.updatePackageById)
  .delete(auth, isAdmin, packageController.deletePackageById);

// Guide routes
router.route('/guides')
  .post(auth, isAdmin, GuideController.createGuide)
  .get(GuideController.getAllGuides);

router.route('/guides/:id')
  .get(GuideController.getGuideById)
  .patch(auth, isAdmin, GuideController.updateGuideById)
  .delete(auth, isAdmin, GuideController.deleteGuideById);

// Skill routes
router.route('/skills')
  .post(auth, isAdmin, skillController.createSkills)
  .get(skillController.getAllSkills);

router.route('/skills/:id')
  .get(skillController.getSkillById)
  .patch(auth, isAdmin, skillController.updateSkillById)
  .delete(auth, isAdmin, skillController.deleteSkillById);
router.route('/getActiveUsers').get(auth,isAdmin,adminController.getActiveUsers);
router.route('/getInActiveUsers').get(auth,isAdmin,adminController.getInActiveUsers);
router.route("/activateUser/:id").post(adminController.activateUser)
router.route("/deactivateUser/:id").post(adminController.deactivateUser)


// route to get sttatus
router.route('/stats').get(auth,isAdmin,adminController.getAdminStats);
router.route('/users-stats').get(auth,isAdmin,adminController.getUserStatsByDate);
router.route('/talent-stats').get(auth,isAdmin,adminController.getTalentStatsByDate);
router.route('/company-stats').get(auth,isAdmin,adminController.getCompanyStatsByDate);
router.route('/job-stats').get(auth,isAdmin,adminController.getJobStatsByDate);

// route to flag jobs 
router.route('/job-flag/:id').get(auth,isAdmin,jobController.flagJobPostingById);
// route to un-flag jobs
router.route('/job-unflag/:id').get(auth,isAdmin,jobController.UnflagJobPostingById);

module.exports = router;