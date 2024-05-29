const jwt = require('jsonwebtoken');
const appError = require('./appError');
const handleErrorAsync = require('./handErrorAsync');
const User = require("../model/UserModel");


const sendJWT = (user, statusCode, res) => {
  // 產生 JWT token (類似通行證)
  // jwt.sign(payload, secretOrPrivateKey, [options, callback])
  // payload 放自訂資料，例如：id，不放隱私資料

  /*
    JWT_SECRET=密鑰，任意自訂內容(混淆用)
    JWT_EXPIRES_DAY=過期時間，格式範例：5d
  */
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_DAY
  });

  // 清除密碼較安全
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    user: {
      token,
      name: user.name
    }
  });
}

const isAuth = handleErrorAsync(async (req, res, next) => {
  // 確認 token 是否存在
  // 判斷是否表頭有帶 authorization 且開頭為 Bearer
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(appError(401, '你尚未登入！', next));

  // 驗證 token 正確性
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        reject(err)
      } else {
        resolve(payload)
      }
    })
  })

  //上述驗證通過會回傳user.id，透過id找到使用者
  const currentUser = await User.findById(decoded.id);

  //自己自訂1個user屬性，以供後續使用
  req.user = currentUser;
  next();
});


module.exports = { sendJWT, isAuth };
