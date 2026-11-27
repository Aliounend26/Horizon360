import { Router } from 'express';
import auth from './auth';
import users from './users';
import parks from './parks';
import vehicles from './vehicles';
import zones from './zones';
import clients from './clients';
import rentals from './rentals';
import expenses from './expenses';
import maintenance from './maintenance';
import notifications from './notifications';
import activityLogs from './activityLogs';
import dashboard from './dashboard';
import reports from './reports';
import settings from './settings';

const router = Router();

router.use('/auth', auth);
router.use('/users', users);
router.use('/parks', parks);
router.use('/vehicles', vehicles);
router.use('/zones', zones);
router.use('/clients', clients);
router.use('/rentals', rentals);
router.use('/expenses', expenses);
router.use('/maintenance', maintenance);
router.use('/notifications', notifications);
router.use('/activity-logs', activityLogs);
router.use('/dashboard', dashboard);
router.use('/reports', reports);
router.use('/settings', settings);

export default router;
