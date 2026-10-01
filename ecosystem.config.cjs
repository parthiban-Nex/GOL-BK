// module.exports = {
//   apps: [
//     {
//       name: 'DMS-SINGLE-DB-PV-BE',
//       script: './src/index.js',
//       watch: false,
//       env: {
//         NODE_ENV: 'development',
//         PORT : 7001
//       },
//       env_production: {
//         PORT: 7001,
//         NODE_ENV: 'production',
//       },
//     },
//   ],
// };


module.exports = {
  apps: [
    {
      name: 'dms-backend-uat',
      script: './src/index.js',
      // interpreter: './node_modules/.bin/babel-node',
      env: {
        APP_ENV: 'uat'
      }
    },
    {
      name: 'dms-backend-prod',
      script: './src/index.js',
      // interpreter: './node_modules/.bin/babel-node',
      env: {
        APP_ENV: 'production'
      }
    }
  ]
};
