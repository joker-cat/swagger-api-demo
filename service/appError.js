const appError = (httpStatus, errMessage, next) => {
  const error = new Error(errMessage); // 此建構為error.message
  error.statusCode = httpStatus;
  error.isOperational = true;
  return error;
};

module.exports = appError;
