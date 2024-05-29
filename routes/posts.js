const express = require("express");
const bcrypt = require("bcryptjs");
const { resSuccess } = require("../service/resModule");
const { sendJWT, isAuth } = require("../service/statusHandles");
const { valPostKeyKey } = require("../service/validateModule");
const Post = require("../model/PostModel");
const User = require("../model/UserModel");
const Comment = require("../model/CommentModel");
const appError = require("../service/appError");
const handErrorAsync = require("../service/handErrorAsync");
const postRouter = express.Router();

//查看所有貼文
postRouter.get(`/posts`, handErrorAsync(async (req, res) => {
  const timeSort = req.query.timeSort == "asc" ? "createdAt" : "-createdAt";
  const q = req.query.q !== undefined ? { content: new RegExp(req.query.q) } : {};
  const data = await Post.find(q)
    .populate({
      path: "user",
      select: "name photo -_id",
    })
    .populate({
      path: "comments",
      select: "comment user createdAt -_id -post",
    })
    .sort(timeSort);

  resSuccess(res, 200, data);
})
);

//取得個人所有貼文列表
postRouter.get(`/post/user/:userId`, isAuth, handErrorAsync(async (req, res, next) => {
  const regex = /^[A-Za-z0-9]+$/;
  const userId = req.params.userId;
  const authId = req.user._id.toString();
  if (typeof userId !== 'string' || !regex.test(userId)) return next(appError(400, "路徑缺少使用者"));
  if (userId !== authId) return next(appError(400, "請確認使用者"));
  const data = await Post.find({ user: userId })
  if (data.length === 0) return next(appError(400, "使用者無貼文"));
  resSuccess(res, 200, data);
})
);

//查看單一貼文
postRouter.get(`/posts/:postId`, handErrorAsync(async (req, res, next) => {
  const data = await Post.find({ _id: req.params.postId.trim() })
    .populate({
      path: "user",
      select: "name photo",
    })
    .populate({
      path: "comments",
      select: "comment user createdAt",
    })
  if (data.length === 0) return next(appError(400, "找不到貼文"));

  resSuccess(res, 200, data);
})
);

//貼文
postRouter.post("/post", isAuth, handErrorAsync(async (req, res, next) => {
  const reqObj = req.body;
  const notFoundKey = valPostKeyKey(Object.keys(reqObj));
  if (notFoundKey?.name === 'Error') return next(notFoundKey);
  if (req.user._id.toString() !== req.body.user) return next(appError(400, "請確認使用者"));
  if (req.body.content == undefined || req.body.content.trim() === "") {
    return next(appError(400, "你沒有填寫 content 資料"));
  }
  if (req.body.type == undefined || req.body.type.trim() === "") {
    return next(appError(400, "你沒有填寫 type 資料"));
  }

  const newPost = await Post.create(req.body);
  resSuccess(res, 200, [newPost]);
})
);

//新增貼文留言
postRouter.post("/posts/:postId/comment", isAuth, handErrorAsync(async (req, res, next) => {
  const data = await Post.find({ _id: req.params.postId.trim() })
  if (data.length === 0) return next(appError(400, "找不到貼文"));
  const comment = req.body.comment;
  if (typeof comment !== 'string' || comment.trim() === "") return next(appError(400, "請填寫留言"));
  const newComment = await Comment.create({
    comment,
    user: req.user._id,
    post: req.params.postId
  });

  resSuccess(res, 200, [newComment]);
})
);

//新增一則貼文的讚
postRouter.post("/posts/:postId/like", isAuth, handErrorAsync(async (req, res, next) => {
  const data = await Post.find({ _id: req.params.postId.trim() })
  if (data.length === 0) return next(appError(400, "找不到貼文"));
  const userId = req.user._id;
  const postId = req.params.postId;
  const includeLike = await User.find({ _id: userId, likes: { $in: [postId] } });
  if (includeLike.length !== 0) return next(appError(400, "已經按過讚了"));
  await User.updateOne({ _id: userId }, { $push: { likes: postId } })

  resSuccess(res, 200, '按讚成功');
})
);

//取消一則貼文的讚
postRouter.delete("/posts/:postId/unlike", isAuth, handErrorAsync(async (req, res, next) => {
  const data = await Post.find({ _id: req.params.postId.trim() })
  if (data.length === 0) return next(appError(400, "找不到貼文"));
  const userId = req.user._id;
  const postId = req.params.postId;
  const includeLike = await User.find({ _id: userId, likes: { $in: [postId] } });
  if (includeLike.length === 0) return next(appError(400, "尚未按讚"));
  await User.updateOne({ _id: userId }, { $pull: { likes: postId } })

  resSuccess(res, 200, '取消按讚成功');
})
);

//修改貼文
postRouter.patch("/post/:postId", isAuth, handErrorAsync(async (req, res, next) => {
  const patchUser = await Post.findById(req.params.postId.trim());
  if (patchUser === null) return next(appError(400, "找不到資料"));
  if (req.user._id.toString() !== patchUser.user.toString()) {
    return next(appError(400, "請確認使用者"));
  }
  const reqObj = Object.keys(req.body);
  const postId = req.params.postId;
  const notFoundKey = valPostKeyKey(reqObj);
  if (notFoundKey?.name === 'Error') return next(notFoundKey);
  if (reqObj.includes('user')) return next(appError(400, '不允許修改使用者'));
  const isNull = await Post.findByIdAndUpdate(postId, req.body);
  if (isNull === null) return next(appError(400, "修改失敗"));

  resSuccess(res, 200, "更新成功");
})
);

//刪除特定貼文
postRouter.delete("/post/:postId", isAuth, handErrorAsync(async (req, res, next) => {
  const postId = req.params.postId.trim();
  if (postId === '') return next(appError(400, "路徑錯誤"));
  const delPost = await Post.findById(postId);
  if (delPost === null) return next(appError(400, "找不到資料"));
  if (req.user._id.toString() !== delPost.user.toString()) {
    return next(appError(400, "請確認使用者"));
  }
  const isNull = await Post.findByIdAndDelete(postId);
  if (isNull === null) return next(appError(400, "找不到資料"));

  resSuccess(res, 200, "刪除成功");
})
);

//清空使用者所有貼文
postRouter.delete("/posts", isAuth, handErrorAsync(async (req, res, next) => {
  if (req.originalUrl !== "/posts") return next(appError(400, "清空失敗"));
  if (!(req.body.password && typeof req.body.password === 'string')) {
    return next(appError(400, "密碼格式錯誤"));
  }

  // password原本為隱藏，透過select('+password')顯示取得
  const user = await User.findOne({ _id: req.user._id.toString() }).select('+password');
  // 輸入密碼與雜湊密碼比對
  const auth = await bcrypt.compare(req.body.password, user.password);
  if (!auth) return next(appError(400, "密碼錯誤"));

  await Post.deleteMany({ user: req.user._id });

  resSuccess(res, 200, "全部清空");
})
);

module.exports = postRouter;
