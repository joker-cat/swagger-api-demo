const express = require("express");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const User = require("../model/UserModel");
const { resSuccess } = require("../service/resModule");
const appError = require("../service/appError");
const { valSignupKey } = require("../service/validateModule");
const handErrorAsync = require("../service/handErrorAsync");
const { sendJWT, isAuth } = require("../service/statusHandles");
const userRouter = express.Router();


// 註冊
userRouter.post("/users/sign_up", handErrorAsync(async (req, res, next) => {
  /**
   * #swagger.tags = ['使用者']
   * #swagger.description = '註冊'
   * #swagger.reponse[200] = {
   *  description: '註冊成功',
   *  schema: {
   *  status: "success",
        user: {
          "token": "token",
          "name": "user"
        }
   *  },
   * }
  */
  let { name, email, password, confirmPassword, photo } = req.body;
  const notFoundKey = valSignupKey(Object.keys(req.body));
  if (notFoundKey?.name === 'Error') return next(notFoundKey);
  if (!(name && email && password && confirmPassword)) return next(appError(400, "請確實填寫資訊", next));
  if (password.trim() !== confirmPassword.trim()) return next(appError(400, "密碼不一致！", next));
  const validateName = validator.isEmpty(name.trim());
  if (validateName) return next(appError(400, "名稱未填寫"));
  const validateEmail = validator.isEmail(email.trim());
  if (!validateEmail) return next(appError(400, "信箱格式錯誤"));
  const validatePsd = validator.isByteLength(password.trim(), { min: 6, max: 18 });
  if (!validatePsd) return next(appError(400, "密碼需介於 6-18 字元之間"));

  //信箱是否註冊過
  const user = await User.findOne({ email });
  if (user) return next(appError(400, "信箱已註冊過"));

  //通過驗證後，將密碼加密
  password = await bcrypt.hash(password, 12);

  //建立使用者
  const data = await User.create({ name, email, password, photo });
  sendJWT(data, 201, res);
}
));

// 登入
userRouter.post("/users/sign_in", handErrorAsync(async (req, res, next) => {
  let { email, password } = req.body;
  const validateEmail = validator.isEmpty(email.trim());
  if (validateEmail) return next(appError(400, "郵件未填寫"));
  const validatePsd = validator.isEmail(password.trim());
  if (validatePsd) return next(appError(400, "密碼未填寫"));
  const isUser = await User.findOne({ email });
  if (!isUser) return next(appError(400, "帳號或密碼錯誤"));

  // password原本為隱藏，透過select('+password')顯示取得
  const user = await User.findOne({ email }).select('+password');

  // 輸入密碼與雜湊密碼比對
  const auth = await bcrypt.compare(password, user.password);
  if (!auth) return next(appError(400, "密碼錯誤"));

  sendJWT(user, 201, res);
}
));

//重設密碼
userRouter.post("/users/updatePassword", isAuth, handErrorAsync(async (req, res, next) => {
  let newPassword = null;
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword || typeof password !== 'string' || typeof confirmPassword !== 'string') return next(appError(400, "請確實填寫資訊", next));
  if (password.trim() !== confirmPassword.trim()) return next(appError(400, "密碼不一致！", next));
  if (!validator.isByteLength(password.trim(), { min: 6, max: 18 })) return next(appError(400, "密碼需介於 6-18 字元之間"));

  //加密密碼
  newPassword = await bcrypt.hash(password, 12);

  //更新密碼
  const user = await User.findByIdAndUpdate(req.user.id, {
    password: newPassword
  });

  resSuccess(res, 200, '成功更改密碼');
}
));

//查詢個人資料
userRouter.get("/users/profile", isAuth, handErrorAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(201).json({
    status: 'success',
    user
  });
}
));

//更新個人資料
userRouter.patch("/users/profile", isAuth, handErrorAsync(async (req, res, next) => {
  const updateKeys = Object.keys(req.body);
  const notFoundKey = valSignupKey(updateKeys);
  if (notFoundKey?.name === 'Error') return next(notFoundKey);
  if (updateKeys.includes('password')) return next(appError(400, '只允許修改名稱、信箱、頭貼'));
  if (updateKeys.includes('confirmPassword')) return next(appError(400, '只允許修改名稱、信箱、頭貼'));
  await User.findByIdAndUpdate(req.user.id, req.body);
  resSuccess(res, 200, '成功更新個人資料');
}
));

//追蹤
userRouter.post("/users/:userId/follow", isAuth, handErrorAsync(async (req, res, next) => {
  const regex = /^[A-Za-z0-9]+$/;
  const userId = req.params.userId;
  const authId = req.user._id.toString();
  if (typeof userId !== 'string' || !regex.test(userId)) return next(appError(400, "路徑缺少使用者"));
  const isUser = await User.find({ _id: userId });
  if (isUser.length === 0) return next(appError(400, "無此使用者"));
  if (userId === authId) return next(appError(400, "無法追蹤自己"));
  const includeFollowing = await User.find({ _id: authId, following: { $in: [userId] } });
  if (includeFollowing.length !== 0) return next(appError(400, "已經追蹤了"));
  await User.updateOne({ _id: authId }, { $push: { following: userId } })
  await User.updateOne({ _id: userId }, { $push: { followers: authId } })
  resSuccess(res, 201, '追蹤成功');
}
));

//取消追蹤
userRouter.delete("/users/:userId/unfollow", isAuth, handErrorAsync(async (req, res, next) => {
  const regex = /^[A-Za-z0-9]+$/;
  const userId = req.params.userId;
  const authId = req.user._id.toString();
  if (typeof userId !== 'string' || !regex.test(userId)) return next(appError(400, "路徑缺少使用者"));
  const isUser = await User.find({ _id: userId });
  if (isUser.length === 0) return next(appError(400, "無此使用者"));
  if (userId === authId) return next(appError(400, "無法取消追蹤自己"));
  const includeFollowing = await User.find({ _id: authId, following: { $in: [userId] } });
  if (includeFollowing.length === 0) return next(appError(400, "還沒追蹤"));
  await User.updateOne({ _id: authId }, { $pull: { following: userId } })
  await User.updateOne({ _id: userId }, { $pull: { followers: authId } })
  resSuccess(res, 201, '取消追蹤成功');
}
));

//取得個人追蹤列表
userRouter.get("/users/following", isAuth, handErrorAsync(async (req, res, next) => {
  if (req.user === undefined) return next(appError(401, '你尚未登入！', next));
  const followingData = await User.findById(req.user.id, "following -_id")
    .populate({
      path: "following",
      select: "name photo -_id",
    });
  resSuccess(res, 201, followingData.following === undefined ? '沒有追蹤' : [followingData.following]);
}
));

//取得個人按讚列表
userRouter.get("/users/getLikeList", isAuth, handErrorAsync(async (req, res, next) => {
  if (req.user === undefined) return next(appError(401, '你尚未登入！', next));
  console.log(req.user.id);
  const likesData = await User.findById(req.user.id, "likes -_id")
    .populate({
      path: "likes",
      select: "-_id",
    });
  console.log(likesData);
  resSuccess(res, 201, likesData.likes === undefined ? '沒有按讚' : [likesData.likes]);
}
));


module.exports = userRouter;
