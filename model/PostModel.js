// 連接資料庫
// 如果localhost連接失敗，請改成127.0.0.1，此問題可能為 node / npm 版本造成
const mongoose = require("mongoose");

const [schema, options] = [
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: [true, "編號 未填寫"],
    },
    image: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: [true, "內容 未填寫"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    likes: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      required: [true, "類別 未填寫"],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    /*
      在 Mongoose 中，當你將一個文檔轉換為 JSON 或者將其傳送到客戶端時，
      Mongoose 會自動添加一個名為 "id" 的虛擬屬性。這個 "id" 屬性是 "_id" 屬性的字串形式。
    */
    id: false, // 不生成 "id" 虛擬屬性
  },
];

const postSchema = new mongoose.Schema(schema, options); // 設定Schema

//虛擬欄位，防止留言過多造成collection過大
postSchema.virtual("comments", {
  ref: "comment",
  foreignField: "post",
  localField: "_id",
});

const Post = mongoose.model("post", postSchema); // 關聯

module.exports = Post;
