import db from '../index.js';
import notFoundException from '../../shared/notFoundException.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';

const MobileImage = db.mobileImages;


const saveImageToDB = async (req,type,imageLink) => {
    try{

    return await MobileImage.create({
            visit_id : req.body.VisitId,
            type : type,
            link: imageLink,
            created_by : String(req.user.id),
            updated_by : String(req.user.id)
        })

    } catch (err) {
    logger.error(
      'Images dao saveImageToDB Error:',
      err
    );
  }
}


const dao = {
    saveImageToDB
}

export default dao;
