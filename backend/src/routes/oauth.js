import express from 'express';
import * as oauthController from '../controllers/oauthController.js';

const router = express.Router();

// Social login endpoint - no auth required
router.post('/social-login', oauthController.socialLogin);

export default router;
