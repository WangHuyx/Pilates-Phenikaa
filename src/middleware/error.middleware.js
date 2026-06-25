/**
 * error.middleware.js
 * ------------------------------------------------------------------
 *  - notFoundHandler: thực thi khi không có route nào khớp với yêu cầu.
 *  - errorHandler: thực thi khi một route hoặc middleware bất kỳ gọi `next(err)`
 *    hoặc ném ra lỗi
 * ------------------------------------------------------------------
 */

function notFoundHandler(req, res) {
  res.status(404).render('404', { title: 'Page not found' });
}

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Something went wrong',
    message: err.message || 'Unexpected server error.',
  });
}

module.exports = { notFoundHandler, errorHandler };
