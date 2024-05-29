const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: '春季nodejs_finaly_API文件',
    description: '示範撰寫API文件',
  },
  host: 'localhost:3005',
  schemes: ['http', 'https'],
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./app.js']; //可多個進入點

swaggerAutogen(outputFile, endpointsFiles, doc);
