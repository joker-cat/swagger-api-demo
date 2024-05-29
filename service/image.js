const multer = require('multer');
const path = require('path');
const appError = require("../service/appError");
const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024, //2MB
  },
  fileFilter(req, file, next) { //過濾格式
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg') {
      next(appError(400, "檔案格式錯誤，僅限上傳 jpg、jpeg 與 png 格式。"));
    }
    next(null, true);
  },
}).any();

module.exports = upload;
