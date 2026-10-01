import axios from 'axios';
import logger from '../config/logger.js';
import { createMobileApiRemoteReq } from './mobileApiUtility.js';
import db from '../modules/index.js';

const Transaction = db.jobCard;
const ServiceBooking = db.servicebookings;
const Billings = db.billings;

const formatDateTime = (date) => {
  if (!date) return null;

  const d = new Date(date);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    d.getFullYear() + "-" +
    pad(d.getMonth() + 1) + "-" +
    pad(d.getDate()) + " " +
    pad(d.getHours()) + ":" +
    pad(d.getMinutes()) + ":" +
    pad(d.getSeconds())
  );
};

export const updateBridgeStatusCommon = async ( 
  transactionId,
  status,
  user = null
) => {
  const endpoint =
    'https://bridgeapi.mytvs.in/v1/update/sbk-status';

  try {
    const statusMapping = {
      1: "Open",
      2: "Work In Progress",
      3: "Ready For Billing",
      4: "Billing",
      5: "Delivered",
      6: "Cancelled",
    };

    const statusText =
      statusMapping[status] || "Unknown";

    /* -----------------------------
       STEP 1 — Get JobCard
    ----------------------------- */

    const jobCard = await Transaction.findOne({
      where: { id: transactionId }
    });
    console.log("jobCardTest", jobCard);
    if (!jobCard) {
      logger.warn(
        `Bridge API skipped — JobCard not found for id ${transactionId}`
      );
      return null;
    }

    const serviceBookingId =
      jobCard.service_booking_id;

    /* -----------------------------
       STEP 2 — Skip if no booking
    ----------------------------- */
    console.log("serviceBookingIdTest", serviceBookingId);
    if (!serviceBookingId || serviceBookingId === 0) {
      logger.info(
        `Bridge API skipped — No service_booking_id for transaction ${transactionId}`
      );
      return null;
    }

    /* -----------------------------
       STEP 3 — Get Service Booking
    ----------------------------- */

    const serviceBooking =
      await ServiceBooking.findOne({
        where: { id: serviceBookingId },
        attributes: [
            [
            db.sequelize.literal(
                "CAST(AES_DECRYPT(UNHEX(customerName), 'mytvs_dms') AS CHAR)"
            ),
            "decryptedCustomerName"
            ],
            "registrationNumber",
            "serviceBookingNumber"
        ],
        raw: true
      });
      console.log("serviceBookingTest", serviceBooking);
    if (!serviceBooking) {
      logger.warn(
        `Bridge API skipped — service booking not found`
      );
      return null;
    }

    /* -----------------------------
       STEP 4 — Get Billing
    ----------------------------- */

    const billing =
      await Billings.findOne({
        where: {
          transaction_id: transactionId
        }
      });
      console.log("billingTest", billing);
    /* -----------------------------
       STEP 5 — Build Payload
    ----------------------------- */

    const payload = {
      customer_name:
        serviceBooking.decryptedCustomerName  || '',

      vehicle_reg_no:
        serviceBooking.registrationNumber || '',

      service_booking_no:
        serviceBooking.serviceBookingNumber || '',

      job_card_no:
        jobCard.job_card_no || '',

        jobcard_created_date:
        formatDateTime(jobCard.createdAt),

        billed_date:
        formatDateTime(billing?.createdAt),

        updated_at:
        formatDateTime(jobCard.updatedAt),

        delivered_date:
        formatDateTime(billing?.delivery_date),

      job_card_status:
        statusText
    };
    console.log("payloadTest", payload);
    logger.info(
      'Bridge Status Payload: ' +
      JSON.stringify(payload)
    );

    /* -----------------------------
       STEP 6 — Call API
    ----------------------------- */

    const response = await axios.post(
      endpoint,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    console.log("responseTest", response);
    const responseData = response.data;
    console.log("responseDataTest", responseData);
    await createMobileApiRemoteReq(
      payload,
      responseData,
      user,
      endpoint
    );

    return responseData;

  }  catch (err) {
  console.error("FULL ERROR:", err);

  logger.error(
    "Bridge Status Error:",
    err?.stack || err?.message
  );

  await createMobileApiRemoteReq(
    { transactionId },
    err?.response?.data || {
      error: err.message
    },
    user,
    endpoint
  );

  return null;
}
};