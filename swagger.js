const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: '個人作業 - 2024 六角學院春季 nodejs_HW8_swaggerAPI文件', // 標題
    version: '1.0.0', // 版本
    description: '僅作為撰寫示範使用', // 描述
  },
  host: 'localhost:3005',
  schemes: ['http', 'https'],
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./app.js']; //可多個進入點

swaggerAutogen(outputFile, endpointsFiles, doc);
