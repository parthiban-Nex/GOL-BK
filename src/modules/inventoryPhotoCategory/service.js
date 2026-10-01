import logger from '../../config/logger.js';
import InventoryPhotoCategoryDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import { Storage } from '@google-cloud/storage';
import { finished } from 'stream';
import { promisify } from 'util';

const finishedPromise = promisify(finished);

const addInventoryPhotoCategory = async (reqData, user, files) => {
  let result = '';
  let data = {};
  let recentActivityData = {};
  try {
    let link = '';
    let date = new Date();
    if (reqData.sortOrder === '') {
      reqData.sortOrder = 0;
    }
    if (!files) {
      data = await InventoryPhotoCategoryDao.addInventoryPhotoCategory(
        reqData,
        user,
        link
      );
      if (data) {
        recentActivityData['activity_type'] = 'Create';
        recentActivityData['menu_name'] = 'InventoryPhotoCategory';
        recentActivityData['createdBy'] = user.id;
        recentActivityData['username'] = user.employeeCode;
        recentActivityData['message'] =
          reqData.CATEGORY_NAME + ' InventoryPhotoCategory is created ';
        const recent =
          await RecentAcivityService.addFitMasterRecentActivity(
            recentActivityData
          );
        result = 'success';
        return result;
      }
    }
    //connect to gcs
    const storage = new Storage({
      projectId: 'open-source-prod',
      keyFilename: 'open-source-prod-3cfc5e95e6dd.json',
    });

    const bucketName = 'tvs-fit-storage-account'; // The name of your Cloud Storage bucket
    const bucket = storage.bucket(bucketName);

    //create new file in gcs
    const buffer = files.buffer;
    let newName =
      date.getTime().toString() +
      Math.random().toString(36).slice(2, 7) +
      files.originalname.replace(/\ /g, '_');
    const blob = bucket.file(`DMS/${newName}`);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => {
      return res.status(500).send({
        status: 'error',
        message: 'Error uploading file',
        error: err.message,
      });
    });

    blobStream.on('finish', () => {
      console.log(
        'file------------',
        `https://storage.googleapis.com/${bucketName}/DMS/${newName}`
      );
      link = `https://storage.googleapis.com/${bucketName}/DMS/${newName}`;
    });

    // Upload the file to Google Cloud Storage
    blobStream.end(buffer);

    await finishedPromise(blobStream);

    data = await InventoryPhotoCategoryDao.addInventoryPhotoCategory(
      reqData,
      user,
      link
    );
    if (data) {
      recentActivityData['activity_type'] = 'Create';
      recentActivityData['menu_name'] = 'InventoryPhotoCategory';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      recentActivityData['message'] =
        reqData.CATEGORY_NAME + ' InventoryPhotoCategory is created ';
      const recent =
        await RecentAcivityService.addFitMasterRecentActivity(
          recentActivityData
        );
      result = 'success';
    }
  } catch (err) {
    result = 'failed';
    logger.error(
      'InventoryPhotoCategory service addInventoryPhotoCategory Error:',
      err
    );
  }
  return result;
};

const updateInventoryPhotoCategory = async (id, reqData, user, files) => {
  let result = 'failed';
  let recentActivityData = {};
  let message = '';
  try {
    if (reqData.sortOrder === '') {
      reqData.sortOrder = 0;
    }
    const objExists =
      await InventoryPhotoCategoryDao.getInventoryPhotoCategory(id);
    if (objExists) {
      recentActivityData['activity_type'] = 'Update';
      recentActivityData['menu_name'] = 'InventoryPhotoCategory';
      recentActivityData['createdBy'] = user.id;
      recentActivityData['username'] = user.employeeCode;
      let link = objExists.ICON_LINK;
      logger.info('searched link: ' + link);
      logger.info('got link: ' + reqData.link);
      if (objExists.CATEGORY_NAME != reqData.categoryName) {
        message =
          message +
          ' categoryName changed from ' +
          objExists.CATEGORY_NAME +
          ' to ' +
          reqData.categoryName +
          ' ,';
      }
      if (objExists.ACTIVE != reqData.status) {
        message =
          message +
          ' status changed from ' +
          objExists.ACTIVE +
          ' to ' +
          reqData.status +
          ' ,';
      }
      if (objExists.IS_MANDATORY != reqData.isMandatory) {
        message =
          message +
          ' isMandatory changed from ' +
          objExists.IS_MANDATORY +
          ' to ' +
          reqData.isMandatory +
          ' ,';
      }
      if (objExists.MIN_COUNT != reqData.minCount) {
        message =
          message +
          ' minCount changed from ' +
          objExists.MIN_COUNT +
          ' to ' +
          reqData.minCount +
          ' ,';
      }
      if (objExists.MAX_COUNT != reqData.maxCount) {
        message =
          message +
          ' maxCount changed from ' +
          objExists.MAX_COUNT +
          ' to ' +
          reqData.maxCount +
          ' ,';
      }
      if (objExists.SORT_ORDER != reqData.sortOrder) {
        message =
          message +
          ' sortOrder changed from ' +
          objExists.SORT_ORDER +
          ' to ' +
          reqData.sortOrder +
          ' ,';
      }
      if (link === '' && typeof files === 'undefined') {
        let data = await InventoryPhotoCategoryDao.updateInventoryPhotoCategory(
          id,
          reqData,
          user,
          link
        );
        if (data) {
          if (message) {
            recentActivityData['message'] = message;
            const recent =
              await RecentAcivityService.addFitMasterRecentActivity(
                recentActivityData
              );
          }
          result = 'success';
          return result;
        }
      }
      if (typeof files != 'undefined') {
        message = message + ' image changed ,';
        logger.info('LINK IS CHANGED');

        let date = new Date();
        console.log(files);

        //connect to gcs
        const storage = new Storage({
          projectId: 'open-source-prod',
          keyFilename: 'open-source-prod-3cfc5e95e6dd.json',
        });
        const bucketName = 'tvs-fit-storage-account'; // The name of Cloud Storage bucket

        console.log('bucketName-----', bucketName);
        const bucket = storage.bucket(bucketName);

        //delete already existing file
        async function deleteFile() {
          await bucket
            .file(`DMS/${objExists.ICON_LINK.substring(59)}`)
            .delete();
          logger.info(
            `deleted------------- https://storage.googleapis.com/${bucketName}/DMS/${objExists.ICON_LINK.substring(59)}`
          );
        }
        deleteFile().catch(console.error);

        //create new file in gcs
        const buffer = files.buffer;
        let newName =
          date.getTime().toString() +
          Math.random().toString(36).slice(2, 7) +
          files.originalname.replace(/\ /g, '_');
        const blob = bucket.file(`DMS/${newName}`);
        const blobStream = blob.createWriteStream({
          resumable: false,
        });

        blobStream.on('error', (err) => {
          return res.status(500).send({
            status: 'error',
            message: 'Error uploading file',
            error: err.message,
          });
        });

        blobStream.on('finish', () => {
          console.log(
            'created------------',
            `https://storage.googleapis.com/${bucketName}/DMS/${newName}`
          );
          link = `https://storage.googleapis.com/${bucketName}/DMS/${newName}`;
        });

        // Upload the file to Google Cloud Storage
        blobStream.end(buffer);

        await finishedPromise(blobStream);
      }
      message = message.slice(0, -1);
      let data = await InventoryPhotoCategoryDao.updateInventoryPhotoCategory(
        id,
        reqData,
        user,
        link
      );
      if (data) {
        if (message) {
          recentActivityData['message'] = message;
          const recent =
            await RecentAcivityService.addFitMasterRecentActivity(
              recentActivityData
            );
        }
        result = 'success';
      }
    }
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory service updateInventoryPhotoCategory',
      err
    );
  }
  return result;
};

const listInventoryPhotoCategories = async (reqBody) => {
  try {
    const { totalItems, data } =
      await InventoryPhotoCategoryDao.listInventoryPhotoCategories(reqBody);
    return {
      totalItems: totalItems,
      data: data,
    };
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory Service listInventoryPhotoCategories Error:',
      err
    );
  }
};

const deleteInventoryPhotoCategory = async (id, user) => {
  let result = 'failed';
  try {
    const objExists =
      await InventoryPhotoCategoryDao.getInventoryPhotoCategory(id);
    if (objExists) {
      //connect to gcs
      const storage = new Storage({
        projectId: 'open-source-prod',
        keyFilename: 'open-source-prod-3cfc5e95e6dd.json',
      });
      const bucketName = 'tvs-fit-storage-account'; // The name of your Cloud Storage bucket
      const bucket = storage.bucket(bucketName);

      //delete already existing file
      async function deleteFile() {
        await bucket.file(`DMS/${objExists.ICON_LINK.substring(59)}`).delete();
        logger.info(
          `deleted------------- https://storage.googleapis.com/${bucketName}/DMS/${objExists.ICON_LINK.substring(59)}`
        );
      }
      await deleteFile().catch(console.error);
    }
    let data = await InventoryPhotoCategoryDao.deleteInventoryPhotoCategory(
      id,
      user
    );
    if (data) {
      result = 'success';
    }
  } catch (err) {
    logger.error(
      'InventoryPhotoCategory service deleteInventoryPhotoCategory',
      err
    );
  }
  return result;
};

const InventoryPhotoCategoryService = {
  addInventoryPhotoCategory,
  updateInventoryPhotoCategory,
  listInventoryPhotoCategories,
  deleteInventoryPhotoCategory,
};

export default InventoryPhotoCategoryService;
