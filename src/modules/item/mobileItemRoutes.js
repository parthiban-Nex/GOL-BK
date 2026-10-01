import controller from './controller.js';
import JwtMiddleware from './../../config/jwtMiddleware.js';

import express from 'express';

const router = express.Router();


router.post('/', JwtMiddleware.MobileCheckToken, controller.getAllItemsMobile);
router.all('/', (req, res) => {
  if (req.method !== 'POST') {
      return res.status(400).json({ 
        requestSuccessful: false,
        code: 400,
        message: 'Bad Request'
      });
  }
});


const mobileItemRouter = router;

export default mobileItemRouter;