const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("morgan");

const postRouter = require("./routes/posts");
const userRouter = require("./routes/users");
const uploadRouter = require("./routes/upload");
const { resErrorProd, resErrorDev } = require("./service/nodeEnvError");
const app = express();
app.use(express.json());
app.use(cors());
app.use(logger("dev"));
app.use(postRouter);
app.use('/upload', uploadRouter);
app.use('/users', userRouter);
app.all("*", (req, res) => {
  res.send(`找不到 ${req.originalUrl} 路徑`);
});

// 未捕捉到的 catch
// 記錄於後端 log 上
process.on("unhandledRejection", (reason, promise) => {
  console.error("未捕捉到的 rejection：", promise, "原因：", reason);
});

// 記錄錯誤下來，等到服務都處理完後，停掉該 process
process.on("uncaughtException", (err) => {
  console.error("Uncaughted Exception！");
  console.log(err.name);
  console.log(err.message);
  console.error(err);
  process.exit(1);
});

// 引用環境變數檔
dotenv.config({ path: "./config.env" });
// 遠端資料庫
const dbUrl = process.env.URL.replace("<password>", process.env.PASSWORD);
// 本地測試
const localUrl = process.env.LOCAL_URL;

mongoose
  // .connect(localUrl)
  .connect(dbUrl)
  .then(() => console.log("資料庫連線成功"))
  .catch(() => console.error("資料庫連線失敗"));

app.use(function (err, req, res, next) {
  // dev
  err.statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV === "dev") {
    return resErrorDev(err, res);
  }

  // production
  // 如果錯誤名稱為欄位驗證
  if (err.name === "ValidationError") {
    const errorObj = err.errors;
    const errorArray = [];
    for (const iError in errorObj) {
      // 確保屬性是 errors 自身的屬性而不是繼承來的
      if (errorObj.hasOwnProperty(iError)) {
        errorArray.push(errorObj[iError].message);
      }
    }
    err.message = errorArray;
    err.isOperational = true; // 表示為欄位驗證錯誤
    return resErrorProd(err, res);
  }

  if (err.name === "MulterError" && err.message === "File too large") {
    return res.status(400).json({
      status: "error",
      message: "圖片限制2MB以內",
    });
  }
  resErrorProd(err, res);
});

module.exports = app;
