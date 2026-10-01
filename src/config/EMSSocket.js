// // services/partnerSocket.js
// import { io } from "socket.io-client";
// const activeSockets = new Map(); // store per user/enquiry

// function createSocket({ token, enquiry_no, userId, onMessage }) {
//   const socket = io("https://uat-websprint.mytvspartsmart.in", {
//     path: "/backend/emsWebSocket/",
//     transports: ["websocket"],
//     auth: { token }
//   });

//   socket.on("connect", () => {
//     console.log(` Connected for user ${userId}`);

//     socket.emit("joinRoom", { enquiry_no });
//   });

//   socket.on("newMessage", (data) => {
//     console.log("📨 Message:", data);

//     onMessage?.(data); // callback to send to frontend
//   });

//   socket.on("connect_error", (err) => {
//     console.error("❌ Error:", err.message);
//   });

//   activeSockets.set(userId, socket);

//   return socket;
// }

// function disconnectSocket(userId) {
//   const socket = activeSockets.get(userId);
//   if (socket) {
//     socket.disconnect();
//     activeSockets.delete(userId);
//   }
// }

// export { createSocket, disconnectSocket };