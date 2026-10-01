// utils/notifications.js
import admin from "firebase-admin";

import fitServiceAccount from "../../fit_fcm_service_account.json" with { type: "json" };

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(fitServiceAccount)
    });
}

const sendNotificationDataToToken = async function (token, data) {
    const message = {
        "token": token,
        "data": data
    };

    console.log("message",message)
    var returnVal;
    try {
        returnVal = await admin.messaging().send(message);
        console.log("FCM Response:", returnVal);
    } catch (err) {
        console.log("FCM Response throw Error :", err);
        return null;
    }
    console.log("FCM Response Outside :", returnVal);
    return returnVal;
}

export default sendNotificationDataToToken;