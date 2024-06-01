const express = require('express');
const { v4: uuidv4 } = require('uuid');
const appError = require("../service/appError");
const handleErrorAsync = require("../service/handErrorAsync");
const firebaseAdmin = require('../service/firebase');
const upload = require('../service/image');
const { isAuth, sendJWT } = require('../service/statusHandles');

const router = express.Router();
const bucket = firebaseAdmin.storage().bucket();


// 上傳圖片
router.post('/upload/file', isAuth, upload, handleErrorAsync(async (req, res, next) => {
  /**
   * #swagger.tags = ['上傳圖片']
   * #swagger.description = '上傳圖片'
   * #swagger.parameters['authorization'] = {
     in: 'header',
     description: '使用者認證',
     required: true,
     type: 'string'
   }
   * #swagger.parameters['file'] = {
      in: 'formData',
      name: 'upfile',
      type: 'file',
      description: '要上傳的檔案',
      required: true
    }
   * #swagger.responses[200] = {
       description: '上傳成功',
       schema: {
         "status": "success",
         "imgUrl": "圖片網址"
     }
   }
   */
  if (!req.user) return next(appError(400, "尚未登入"));
  if (!req.files.length) return next(appError(400, "尚未上傳檔案"));
  if (req.files.length > 1) return next(appError(400, "每次上傳限一個檔案"));

  // 取得上傳的檔案資訊列表裡面的第一個檔案
  const file = req.files[0];
  // 基於檔案的原始名稱建立一個 blob 物件
  const blob = bucket.file(`nodejs_hw8/${uuidv4()}.${file.originalname.split('.').pop()}`);
  // 建立一個可以寫入 blob 的物件
  const blobStream = blob.createWriteStream()

  // 監聽上傳狀態，當上傳完成時，會觸發 finish 事件
  blobStream.on('finish', () => {
    // 設定檔案的存取權限
    const config = {
      action: 'read', // 權限
      expires: '12-31-2500', // 網址的有效期限
    };
    // 取得檔案的網址
    blob.getSignedUrl(config, (err, fileUrl) => {
      res.status(200).json({
        status: "success",
        imgUrl: fileUrl
      })
    });
  });

  // 如果上傳過程中發生錯誤，會觸發 error 事件
  blobStream.on('error', (err) => {
    next(appError(400, "上傳失敗"));
  });

  // 將檔案的 buffer 寫入 blobStream
  blobStream.end(file.buffer);

}));

module.exports = router;
