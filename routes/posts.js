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
  /**
 * #swagger.tags = ['貼文']
 * #swagger.description = '取得所有貼文'
 * #swagger.responses[200] = {
    description: '所有貼文資訊',
    schema: {
      "status": 200,
      "data": [
        {
          "_id": "文章id",
          "user": {
              "name": "作者名稱",
              "photo": "作者頭像"
          },
          "image": "文章圖片",
          "content": "文章內容",
          "likes": "讚數",
          "type": "文章類型",
          "tags": ["標籤1", "標籤2"],
          "createdAt": "發文時間",
          "comments": ["留言1", "留言2"]
        }
      ]
    }
  }
 */
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
  /**
 * #swagger.tags = ['貼文']
 * #swagger.description = '取得個人所有貼文'
 * #swagger.parameters['authorization'] = {
    in: 'header',
    required: true,
    type: 'string'
  }
 * #swagger.responses[200] = {
    description: '個人所有貼文資訊',
    schema: {
      "status": 200,
      "data": [
        {
          "_id": "文章id",
          "user": "使用者id",
          "image": "文章圖片",
          "content": "文章內容",
          "likes": "讚數",
          "type": "文章類型",
          "tags": ["標籤1", "標籤2"],
          "createdAt": "發文時間",
        }
      ]
    }
  }
 */
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
  /**
 * #swagger.tags = ['貼文']
 * #swagger.description = '查看單一貼文'
 * #swagger.responses[200] = {
    description: '單一貼文資訊',
    schema: {
      "status": 200,
      "data": [
        {
          "_id": "文章id",
          "user": {
              "_id": "發文者id",
              "name": "發文者名稱",
              "photo": "發文者頭像"
          },
          "image": "文章圖片",
          "content": "文章內容",
          "likes": "讚數",
          "type": "文章類型",
          "tags": ["標籤1", "標籤2"],
          "createdAt": "發文時間",
          "comments": [
            {
              "_id": "留言id",
              "comment": "留言內容",
              "user": {
                  "name": "留言者名稱",
              },
              "post": "留言貼文id",
              "createdAt": "留言時間"
            }
          ]
        }
      ]
    }
  }
 */

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
  /**
   * #swagger.tags = ['貼文']
   * #swagger.description = '使用者發文'
   * #swagger.parameters['authorization'] = {
      in: 'header',
      required: true,
      type: 'string'
    }
   * #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      type: 'object',
      description: '資料格式',
      schema: {
        "$user": "使用者id",
        "$content": "文章內容",
        "$type": "文章類型",
        "image": "文章圖片",
        "tags": ['標籤1', '標籤2']
      }
    }
   * #swagger.responses[200] = {
      description: '發文資訊',
      schema: {
        "status": 200,
        "data": [
          {
            "user": "使用者id",
            "content": "文章內容",
            "type": "文章類型",
            "image": "文章圖片",
            "tags": ["標籤1", "標籤2"],
            "likes": 0,
            "_id": "文章id",
            "createdAt": "發文時間",
          }
        ]
      }
    }
  */
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
  /**
    * #swagger.tags = ['留言']
    * #swagger.description = '新增貼文留言'
    * #swagger.parameters['authorization'] = {
      in: 'header',
      required: true,
      type: 'string'
    }
    * #swagger.responses[200] = {
      description: '新增留言資訊',
      schema: {
        "status": 200,
        "data": [
          {
            "comment": "留言內容",
            "user": "留言者id",
            "post": "留言貼文id",
            "_id": "留言id",
            "createdAt": "留言時間"
          }
        ]
      }
    }
    */
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
  /**
    * #swagger.tags = ['按讚及追蹤']
    * #swagger.description = '按讚貼文'
    * #swagger.parameters['authorization'] = {
      in: 'header',
      required: true,
      type: 'string'
    }
    * #swagger.responses[200] = {
      description: '按讚',
      schema: {
        "status": 200,
        "message": "按讚成功"
      }
    }
    */
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
  /**
   * #swagger.tags = ['按讚及追蹤']
   * #swagger.description = '取消按讚貼文'
   * #swagger.parameters['authorization'] = {
      in: 'header',
      
      required: true,
      type: 'string'
    }
  * #swagger.responses[200] = {
      description: '取消按讚',
      schema: {
        "status": 200,
        "message": "取消按讚成功"
      }
    }
  */
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
  /**
  * #swagger.tags = ['貼文']
  * #swagger.description = '修改個人貼文'
  * #swagger.parameters['authorization'] = {
     in: 'header',
     
     required: true,
     type: 'string'
   }
  * #swagger.parameters['body'] = {
     in: 'body',
     required: true,
     type: 'object',
     description: '資料格式',
     schema: {
       "$content": "文章內容",
       "$type": "文章類型",
       "image": "文章圖片",
       "tags": ['標籤1', '標籤2']
     }
   }
  * #swagger.responses[200] = {
     description: '更新資訊',
     schema: {
       "status": 200,
       "message": "更新成功"
     }
   }
 */
  const patchUser = await Post.findById(req.params.postId.trim());
  if (patchUser === null) return next(appError(400, "找不到資料"));
  if (req.user._id.toString() !== patchUser.user.toString()) {
    return next(appError(400, "請確認使用者"));
  }
  const reqObj = Object.keys(req.body);
  const postId = req.params.postId;
  const notFoundKey = valPostKeyKey(reqObj);
  if (notFoundKey?.name === 'Error') return next(notFoundKey);
  if (reqObj.includes('user')) return next(appError(400, '不允許修改發文者'));
  const isNull = await Post.findByIdAndUpdate(postId, req.body);
  if (isNull === null) return next(appError(400, "修改失敗"));

  resSuccess(res, 200, "更新成功");
})
);

//刪除特定貼文
postRouter.delete("/post/:postId", isAuth, handErrorAsync(async (req, res, next) => {
  /**
    * #swagger.tags = ['貼文']
    * #swagger.description = '刪除個人貼文'
    * #swagger.parameters['authorization'] = {
       in: 'header',
       
       required: true,
       type: 'string'
     }
   * #swagger.responses[200] = {
       description: '刪除資訊',
       schema: {
         "status": 200,
         "message": "刪除成功"
       }
     }
   */
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
  /**
   * #swagger.tags = ['貼文']
   * #swagger.description = '刪除個人所有貼文'
   * #swagger.parameters['authorization'] = {
      in: 'header',
      required: true,
      type: 'string'
    }
   * #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      type: 'object',
      description: '資料格式',
      schema: {
        "$password": "使用者密碼",
      }
    }
  * #swagger.responses[200] = {
      description: '刪除資訊',
      schema: {
        "status": 200,
        "message": "全部清空"
      }
    }
  */
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
