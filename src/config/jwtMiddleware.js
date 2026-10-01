import JwtConfig from '../config/jwtConfig.js';
import JWT from 'jsonwebtoken';
import db from '../../src/modules/index.js';
const User = db.users;
// import { doubleCsrfProtection } from './csrfmiddleware.js';
//   const JWTTokenHandler=(req,res,next)=>{
  
// }
let checkToken = (req, res, next) => {
  // doubleCsrfProtection(req, res, (err) => {
  //   if (err) return res.status(403).json({ message: 'csrf protection failed', error: err });

  //   JWTTokenHandler(req, res, next);
  // });

  let userToken = 
  // req.cookies?.auth_token 
  req.headers['authorization']
  || req.body.authenticationToken;
  if (userToken) {
    JWT.verify(userToken, JwtConfig.secret, { algorithm: JwtConfig.algorithm }, async (error, data) => {
      if (error) {
        return res.status(401).json({
          type: 'Authentication Error',
          message: 'Token is not valid or has expired',
          data: error,
        });
      } else {
        try {
          const user = await User.findOne({ where: { id: data.id } });
          
          if (!user) {
            return res.status(401).json({
              type: 'Authentication Error',
              message: 'User not found',
            });
          };

          if (user.token !== userToken && user.mobile_token !== userToken) {
            return res.status(401).json({
              type: 'Authentication Error',
              message: 'Invalid session or token has been replaced',
            });
          };

          req.user = data;
          next();
        } catch (err) {
          return res.status(500).json({
            message: 'Error verifying token',
            error: err,
          });
        }
      }
    });
  } else {
    return res.status(401).json({
      message: 'Please provide authentication token value',
      type: 'Authentication Error',
    });
  }

};

//this middleware only for mobile auth
let MobileCheckToken = (req, res, next) => {
  let userToken = req.headers['authorization'] || req.body.authenticationToken;
  if (userToken) {
    JWT.verify(userToken, JwtConfig.secret, { algorithm: JwtConfig.algorithm }, async (error, data) => {
      if (error) {
        return res.status(401).json({
           requestSuccessful: false,
           type: 'Authentication Error',
          errorDescription: 'Authentication Error',
          // data: error,
        });
      } else {
        try {
          const user = await User.findOne({ where: { id: data.id } });
          
          if (!user) {
            return res.status(401).json({
              requestSuccessful: false,
              type: 'Authentication Error',
              errorDescription: 'User not found',
            });
          };

          // future only need to check mobile_token
          if (user.mobile_token !== userToken) {
            return res.status(401).json({
               requestSuccessful: false,
               errorDescription: 'Authentication Error',
              type: 'Authentication Error',
            });
          };

          req.user = data;
          next();
        } catch (err) {
          return res.status(500).json({
            message: 'Error verifying token',
            error: err,
          });
        }
      }
    });
  } else {
    return res.status(401).json({
      type: 'Authentication Error',
      requestSuccessful: false,
      errorDescription: 'Please provide authentication token value',
    });
  }
};

const JwtMiddleware = {
  checkToken: checkToken,
  MobileCheckToken
};

export default JwtMiddleware;
