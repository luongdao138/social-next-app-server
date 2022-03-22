const notFoundMiddleware = (req, res) => {
  return res.status(404).json({ msg: 'Route not found!' });
};

module.exports = notFoundMiddleware;
