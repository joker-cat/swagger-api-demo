const appError = require("./appError");

//驗證註冊是否有另外屬性
const signupKey = [
  "name",
  "email",
  "password",
  "confirmPassword",
  "photo",
];

// patch 驗證 key 是否有另外屬性
const postKey = [
  "user",
  "content",
  "type",
  "image",
  "tags",
];

function valPostKeyKey(keyParams) {
  if (keyParams.length === 0) return appError(400, "沒有傳入修改資料");
  for (const key of keyParams) {
    if (!postKey.includes(key)) return appError(400, "有非規定屬性值");
  }
  return true;
}

function valSignupKey(keyParams) {
  if (keyParams.length === 0) return appError(400, "沒有傳入修改資料");
  for (const key of keyParams) {
    if (!signupKey.includes(key)) return appError(400, "有非規定屬性值");
  }
  return true;
}


module.exports = { valPostKeyKey, valSignupKey };
