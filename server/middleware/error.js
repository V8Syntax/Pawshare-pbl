export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Server error';
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  if (err.code === 11000) { status = 409; message = 'That value is already in use'; }
  if (err.name === 'MulterError') status = 400;
  if (status === 500) console.error(err);
  res.status(status).json({ message });
};
