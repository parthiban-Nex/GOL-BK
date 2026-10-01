// utils/notifications.js
import admin from "firebase-admin";

import serviceAccount from "../../tvs-dms-firebase-adminsdk-fbsvc-2e1e06717d.json" with { type: "json" };

  let webapp=  admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    },'webapp');


const sendNotification = async (token, message,data) => {
    const payload = {
        // notification: message,
        token,
    //   data: data,
        data: { ...data, title: message.title, body: message.body },
        android: {
            priority: "high",
        },
        apns: {
            headers: {
                "apns-priority": "10",
            },
            payload: {
                aps: {
                    sound: "default",
                },
            },
        },
    };

    try {
        const response = await admin.messaging(webapp).send(payload);
        console.log("FCM Response:", response);
    } catch (error) {
        console.error("Error sending FCM notification:", error);
    }
};

export default sendNotification;