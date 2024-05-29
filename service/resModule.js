function resSuccess(res, status, data) {
  const isArray = Array.isArray(data);
  const resObj = isArray ? { status, data } : { status, message: data };
  res.status(status).json(resObj);
}

function resFaildWrite(res, status, message) {
  res.status(status).json({
    status,
    message,
  });
}

module.exports = { resSuccess, resFaildWrite };
