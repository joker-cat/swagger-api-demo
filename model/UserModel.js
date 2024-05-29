const mongoose = require("mongoose");

const [schema, options] = [
  {
    name: {
      type: String,
      required: [true, "名稱 未填寫"],
    },
    email: {
      type: String,
      required: [true, "信箱 未填寫"],
      select: false,
    },
    password: {
      type: String,
      required: [true, "密碼 未填寫"],
      select: false,
    },
    confirmPassword: {
      type: String,
      select: false,
    },
    sex: {
      type: String,
      enum: ["male", "female"]
    },
    photo: {
      type: String,
      default:
        "https://storage.googleapis.com/vue-course-api.appspot.com/joooker/1713596762002.png?GoogleAccessId=firebase-adminsdk-zzty7%40vue-course-api.iam.gserviceaccount.com&Expires=1742169600&Signature=U4%2BEJO1DI3JZF%2F5SF6HvRgDdQTVT3qRYZZQtnxIPxe8HukumOIBRQhmOxr46wJFxSz3LCYvUCUuSKMNu1UP3F4%2F9XxQPsTEuDH%2F4TaP5XpMcKkoOh1YOvn31yUtF8dL%2Bk6ZbXJlvtmec49jkmNx9tAoMLpZsggHJrR9TpbGRwTxd9gk%2BYLuwaEgzDKwH%2FhtwupQ6kWz%2BbJn4ojqS80rCZylXu7DoIhv6WYH%2F45z2GYd5loJmnCO%2BaR6Q3%2FqQ1t2Su4lGdaBnkfuFpovd54qnaMQmu1GA1LaXqyAoo98%2FXlGNBCzMtqIGwluhAOTgA%2BOwrits1Y%2Fl6AiGWjdKgkfBqQ%3D%3D",
    },
    likes: {
      type: [mongoose.Schema.ObjectId],
      ref: "post",
      default: []
    },
    following: { //追蹤
      type: [mongoose.Schema.ObjectId],
      ref: "user",
      default: []
    },
    followers: { //被追蹤
      type: [mongoose.Schema.ObjectId],
      ref: "user",
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
  },
  {
    versionKey: false,
  },
];

const userSchema = new mongoose.Schema(schema, options); // 設定Schema
const User = mongoose.model("user", userSchema); // 關聯

module.exports = User;
