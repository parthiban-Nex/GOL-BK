import db from '.././index.js';
import logger from './../../config/logger.js';



const FeedbackQn=db.feedback_questions




const getFeedbackQn = async (reqData,user) => {
  try {
    

      const feedbackqns = await FeedbackQn.findAll({
          attributes: [
              'id',
              "question"
          ],        

      // Group by the GRN to calculate sum correctly for each GRN
    });
    return feedbackqns
  } catch (err) {
    logger.error(' FeedbackQn fetching error', err);
  }
};




const FeedbackQnService={
    getFeedbackQn
}
  export default  FeedbackQnService;
