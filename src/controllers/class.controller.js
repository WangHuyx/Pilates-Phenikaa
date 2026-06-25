/**
 * class.controller.js
 * ------------------------------------------------------------------
 * CONTROLLER LAYER for the Pilates-class-facing pages: dashboard,
 * class catalog, booking action, and "my bookings".
 * ------------------------------------------------------------------
 */

//Dashboard, class, my-bookings pages. Có thể tách riêng ra làm từng phần 1 file .js
const classService = require('../services/class.service');

/** GET /dashboard */
async function showDashboard(req, res, next) {
  try {
    const classes = await classService.listClasses();
    res.render('dashboard', { title: 'Dashboard', user: req.session.user, classes });
  } catch (err) {
    next(err);
  }
}

/** GET /classes */
async function showClasses(req, res, next) {
  try {
    const classes = await classService.listClasses();
    res.render('classes', {
      title: 'Class schedule',
      user: req.session.user,
      classes,
      message: null,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /classes/:id/register */
async function registerClass(req, res, next) {
  try {
    const classId = req.params.id;
    const userId = req.session.user.id;

    const result = await classService.registerForClass(classId, userId);
    const classes = await classService.listClasses();

    res.render('classes', {
      title: 'Class schedule',
      user: req.session.user,
      classes,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /my-bookings */
async function showMyBookings(req, res, next) {
  try {
    const userId = req.session.user.id;
    const myClasses = await classService.myClasses(userId);
    res.render('my-bookings', { title: 'My bookings', user: req.session.user, myClasses });
  } catch (err) {
    next(err);
  }
}

module.exports = { showDashboard, showClasses, registerClass, showMyBookings };
