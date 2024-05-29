// 連接資料庫
// 如果localhost連接失敗，請改成127.0.0.1，此問題可能為 node / npm 版本造成
const mongoose = require("mongoose");

const [schema, options] = [
  {
    comment: {
      type: String,
      required: [true, "留言 未填寫"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: [true, "使用者 未填寫"],
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: "post",
      required: [true, "貼文 未填寫"],
    }
  },
  {
    versionKey: false,
  },
];

const commentSchema = new mongoose.Schema(schema, options); // 設定Schema

//表示"主動"去做關聯
commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name -_id",
  });
  next();
});

const Comment = mongoose.model("comment", commentSchema); // 關聯

module.exports = Comment;
