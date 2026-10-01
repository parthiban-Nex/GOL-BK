
import logger from '../../config/logger.js';
import { check, validationResult } from 'express-validator';

const eInvoicePost = async (req, res, next) => {
    try {
        logger.info(
            'E-Invoice Controller requestData:' + JSON.stringify(req.body)
        );


        const errors = validationResult(req);

        // If validation fails, return errors
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }


        // Extract JSON body
        const invoiceData = req.body;

        // Business logic to store invoice data (Example: Saving to DB)
        console.log("Invoice Data:", invoiceData);

        return res.status(201).json({
            message: "Invoice created successfully",
            data: invoiceData,
        });
    } catch (err) {
        logger.error('E-Invoice Controller Json Validator Error:', err);
        next(err);
    }
};

const controller = {
    eInvoicePost
};

export default controller;
