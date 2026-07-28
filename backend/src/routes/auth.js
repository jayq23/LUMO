import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware, verifyOwnership } from '../middleware/authMiddleware.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, validateRequest(schemas.register), authController.register);
router.post('/login', loginLimiter, validateRequest(schemas.login), authController.login);
router.get('/profile/:id', authMiddleware, verifyOwnership, authController.getProfile);
router.put('/profile/:id', authMiddleware, verifyOwnership, validateRequest(schemas.updateProfile), authController.updateProfile);
router.put('/password/:id', authMiddleware, verifyOwnership, validateRequest(schemas.changePassword), authController.changePassword);
router.delete('/account/:id', authMiddleware, verifyOwnership, authController.deleteAccount);
router.post('/forgot-password', forgotPasswordLimiter, validateRequest(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password/:token', validateRequest(schemas.resetPassword), authController.resetPassword);

export default router;
