import logger from '../../config/logger.js';
import ImageDao from './dao.js';
import RecentAcivityService from '../recentActivity/service.js';
import { Storage } from '@google-cloud/storage';
import { finished } from 'stream';
import { promisify } from 'util';

const finishedPromise = promisify(finished);

// https://storage.googleapis.com/tvs-fit-storage-account/myTVSService/727064/inventory/24_03_86_11_29_18_956_Dashboard cluster.jpg
// https://storage.googleapis.com/tvs-fit-storage-account/DMS/1732097204779ukvpgapplication.png
const saveImages = async (req, res) => {
    let result = '';
    let data = {};
    try {
        let link = '';
        let type = '';
        let newName = '';
        //connect to gcs
        const storage = new Storage({
            projectId: 'open-source-prod',
            keyFilename: 'open-source-prod-3cfc5e95e6dd.json',
        });

        const bucketName = 'tvs-fit-storage-account'; // The name of your Cloud Storage bucket
        const bucket = storage.bucket(bucketName);

        //create new file in gcs
        const buffer = req.file.buffer;

        if (req.file.originalname.includes('ins')) {
            newName = "myTVSService/newFit/" + req.body.VisitId + "/inspection/" + req.file.originalname;
            type = "inspection";
        } else if (req.file.originalname.includes('pdc')) {
            newName = "myTVSService/newFit/" + req.body.VisitId + "/pdc/" + req.file.originalname;
            type = "pdc";
        } else if (req.file.originalname.includes('security')) {
            newName = "myTVSService/newFit/" + req.body.VisitId + "/security/" + req.file.originalname;
            type = "security";
        } else if (req.file.originalname.includes('gateout')) {
            newName = "myTVSService/newFit/" + req.body.VisitId + "/gateout/" + req.file.originalname;
            type = "gateout";
        } else if (req.file.originalname.includes('vehiclePickup')) {
            newName = "myTVSService/newFit/" + req.body.VisitId + "/vehiclePickup/" + req.file.originalname;
            type = "vehiclePickup";
        } else if (!req.file.originalname.toLowerCase().includes("signature.jpg")) {
            newName = "myTVSService/newFit/" + req.body.VisitId + "/inventory/" + req.file.originalname;
            type = "inventory";
        } else {
            newName = "myTVSService/newFit/" + req.body.VisitId + "/signature/" + req.file.originalname;
            type = "signature";
        }

        const blob = bucket.file(newName);
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
                `https://storage.googleapis.com/${bucketName}/${newName}`
            );
            link = `https://storage.googleapis.com/${bucketName}/${newName}`;
        });

        // Upload the file to Google Cloud Storage
        blobStream.end(buffer);

        await finishedPromise(blobStream);

        data = await ImageDao.saveImageToDB(req, type, link);
        if (data) {
            result = 'success';
        }


    } catch (err) {
        result = 'failed';
        logger.error(
            'Image service saveImages Error:',
            err
        );
    }
    return result;
}


const ImageService = {
    saveImages,
}

export default ImageService;