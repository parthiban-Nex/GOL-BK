import logger from '../../config/logger.js';
import {
  ACTION_GET,
  ACTION_ADD,
  ACTION_UPDATE,
} from '../../shared/applicationConstants.js';
import auditLog from '../../shared/auditLog.js';
import ImageService from './service.js';
import { Storage } from '@google-cloud/storage';

const addImage = async (req, res,next) => {
    try {
        const auditData = {};
        let result = await ImageService.saveImages(req);
        auditData["menu_name"] = "Images";
        auditData["submenu_name"] = "Mobile Images ";
        auditData["access"] = "Mobile";
        if (result == 'success') {
            auditData['message'] = 'Image Saved successfully ';
            auditData['result'] = 'success ';
            auditData["action"] = ACTION_ADD;
            auditLog.createAuditLog(req, auditData);
            return res.status(200).json({
                requestSuccessful: true,
                message: 'Data Saved Successfully',
                PictureId : req.body.PictureId
            });
        } else {
            auditData['message'] = 'Image not added';
            auditData['result'] = 'failed ';
            auditData["action"] = ACTION_ADD;
            auditLog.createAuditLog(req, auditData);
            return res.status(200).send({
                requestSuccessful: true,
                message: 'Data not Saved ',
            });
        }
    } catch (err) {
        logger.error(
        'Image Controller addImage Error:',
        err
        );
        next(err);
    }

}

const controller = {
 addImage
};

export default controller;