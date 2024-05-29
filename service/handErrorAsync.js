const handleErrorAsync = function (func) {
  return function (req, res, next) {
    // express middleware
    // async 本身就是 promise，所以可用 catch 去捕捉
    func(req, res, next).catch(function (error) {
      console.log(error);
      return next(error);
    });
  };
};

module.exports = handleErrorAsync;
