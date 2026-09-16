function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message: status >= 500 ? 'Something went wrong. Please try again.' : err.message,
    code: err.code || undefined,
    receiverEmail: err.receiverEmail || undefined,
  });
}

module.exports = { errorHandler };
