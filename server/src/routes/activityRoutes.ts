import { Router } from 'express';
import { activityController } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get activities scoped by role
router.get('/', activityController.getActivities);

// Missed events endpoint: returns the latest 20 database activity events for the user
router.get('/recent', activityController.getRecentMissed);

export default router;
