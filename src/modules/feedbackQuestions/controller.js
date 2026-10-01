import FeedbackQnService from './service.js';

import logger from './../../config/logger.js';
const GetFeedbackQn= async (req, res, next) => {
  try {
    let data = await FeedbackQnService.getFeedbackQn();
    console.log(data, "data")
    
    return res.status(200).json({
      requestSuccessful: true,
      message: "Feedback Questionn in data Fetched Successfully ",
      data,
    });

  } catch (err) {
    logger.error('Feedback Qn Contrller Error:', err);
    next(err);
  }
}



const controller = {
  GetFeedbackQn
}




export default controller;
