
import express from 'express';
import cors from 'cors';
import ErrorHandler from './error/errorHandler.js';
//import swaggerSpec from './config/swaggerConfig.js';
//import swaggerUi from 'swagger-ui-express';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import axios from "axios";
// import { generateCsrfToken } from './config/csrfmiddleware.js';
import { xsssanitize } from './config/xssmiddleware.js';
import { translateResponseMiddleware } from './config/translatemiddleware.js';
import { CHAT_ALLOWED_ROLES } from './shared/applicationConstants.js';
import { Server } from 'socket.io';
import http from "node:http"
import client from 'prom-client';
import responseTime from 'response-time';
import carpmRouter from './modules/carpm/mobileroutes.js';

import { configDotenv } from 'dotenv';
configDotenv();
const app = express();


// 🔹 Create Registry
const register = new client.Registry();

// 🔹 Default metrics (CPU, memory, event loop, etc)
client.collectDefaultMetrics({ register });



// 🔹 Custom HTTP request counter
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

// 🔹 Response time histogram
const httpResponseTime = new client.Histogram({
  name: "http_response_time_seconds",
  help: "Response time in seconds",
  labelNames: ["method", "route", "status"],
});


// Register metrics
register.registerMetric(httpRequestCounter);
register.registerMetric(httpResponseTime);


//--> Swagger
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// app.get('/api/hello', (req, res) => {
//   /**
//    * @swagger
//    * /api/hello:
//    *   get:
//    *     description: Returns a hello message
//    *     responses:
//    *       200:
//    *         description: A hello message
//    */
//   res.send({ message: 'Hello, World!' });
// });

// //--> Swagger
// let corOptions = {
//   origin: 'https://localhost:3001',
// };

//middleware
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:5173", // Your frontend URL
  // credentials: true, // Allow cookies
  // methods: ["GET", "POST", "PUT", "DELETE"],
  // allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
};


app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);
app.use(compression())
app.use(helmet())
app.use(xsssanitize)
// app.use(translateResponseMiddleware);
app.set('etag', 'strong'); // or 'strong'

// 🔹 Middleware to track response time
app.use(
  responseTime((req, res, time) => {
    const route = req.route ? req.route.path : req.path;

    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status: res.statusCode,
    });

    httpResponseTime.observe(
      {
        method: req.method,
        route: route,
        status: res.statusCode,
      },
      time / 1000
    );
  })
);

// 🔹 Metrics endpoint
app.get("/api/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use((req, res, next) => {
  // Set default cache for safe GET requests
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=10');
  } else {
    res.set('Cache-Control', 'no-store'); // avoid caching sensitive or dynamic data
  }
  next();
});
//static images folder
//console.log("test----->", __dirname + 'images')
app.use('/images', express.static('src/images'));
// app.use('/api/uploads', express.static('src/uploads'));
app.post("/get-base64-files", async (req, res) => {
  try {
    const { urls } = req.body; // Array of signed URLs
    const result = [];

    await Promise.all(
      urls.map(async (url) => {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const contentType = response.headers["content-type"] || "application/octet-stream";
        const base64 = Buffer.from(response.data, "binary").toString("base64");
        result.push({ contentType, base64 });
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Failed to fetch base64 files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});
//socket
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
  path: "/api/socket.io",

});

let partsmartNamespace = io.of("/dmspartsmartchat");
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized Soket Connection: No token provided----------------"));

  socket.user = token;
  next();
});

partsmartNamespace.use((socket, next) => {
  const apiKey = socket.handshake.auth?.apiKey;
  console.log(apiKey, process.env.PARTNER_SECRET_KEY, "apikey")
  if (apiKey !== process.env.PARTNER_SECRET_KEY) {
    return next(new Error("Unauthorized Partner Connection"));
  }

  socket.partner = true;
  next();
});


io.on("connection", (socket) => {
  const { id, roleName, employeeCode } = socket.user;

  if (!CHAT_ALLOWED_ROLES.includes(roleName) && !CHAT_ALLOWED_ROLES.includes(employeeCode)) {
    console.log("Chat not allowed:", roleName, employeeCode);
    return;
  }

  // socket.emit("server_ready", {
  //   message: "Hello from server",
  // });
  socket.on("join_enquiry_room", ({ enquiryNo }) => {
    socket.join(`enquiry_${enquiryNo}`);
    console.log(enquiryNo, "teshsash")
  });

  socket.on("create_partner_chat", (data) => {
    console.log("create_partner_chat received:", data);

    partsmartNamespace.emit("enquiry_chat", {
      data
    });
  });

  socket.on("join_room", ({ outletCode }) => {
    if (!CHAT_ALLOWED_ROLES.includes(roleName)) {
      console.log("Chat not allowed:", roleName);
      return;
    }
    socket.join(`jobcard_${outletCode}`);
    console.log(`Joined room jobcard_${outletCode}`);
  });

  socket.on("send_chat_message", ({ outletCode, message }) => {
    io.to(`jobcard_${outletCode}`).emit("receive_chat_message", {
      message,
      senderId: socket.user.id,
      senderRole: socket.user.roleName,
      createdAt: new Date(),
    });
  });

  // Account Statement - Join room by statement ID
  socket.on("join_statement_room", ({ statementId }) => {
    socket.join(`accountStatement_${statementId}`);
    console.log(`User ${socket.user.employeeCode} joined room accountStatement_${statementId}`);
  });

  // Account Statement - Leave room
  socket.on("leave_statement_room", ({ statementId }) => {
    socket.leave(`accountStatement_${statementId}`);
    console.log(`User ${socket.user.employeeCode} left room accountStatement_${statementId}`);
  });

  // Account Statement - Send chat message
  socket.on("send_statement_message", ({ statementId, message, enquiry_no }) => {
    io.to(`accountStatement_${statementId}`).emit("receive_statement_message", {
      message,
      enquiry_no,
      statementId,
      senderId: socket.user.id,
      senderName: socket.user.employeeName,
      senderRole: socket.user.employeeCode,
      createdAt: new Date(),
    });
  });

  // Notification bell - join/leave rooms
  socket.on("join_notification_room", ({ room }) => {
    socket.join(room);
    console.log(`User joined notification room: ${room}`);
  });

  socket.on("send_notification_update", ({ room }) => {
    socket.to(room).emit("notification_update");
    console.log(`Notification update sent to room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

partsmartNamespace.on("connection", (socket) => {
  console.log("Partner connected");

  socket.on("join_partner_room", ({ enquiryNo }) => {
    socket.join(`enquiry_${enquiryNo}`); // partner-side room
  });

  socket.on("send_partner_message", ({ message, enquiryNo }) => {
    console.log(message, "chat message")
    const payload = {
      message,
      sender: "partner",
      createdAt: new Date(),
    };

    // //  Emit inside partner namespace (optional)
    // partsmartNamespace
    //   .to(`jobcard_${jobCardNo}`)
    //   .emit("receive_partner_message", payload);

    //  Forward to your internal enquiry room
    io.to(`enquiry_${enquiryNo}`)
      .emit("receive_partner_message", payload);
  });
  socket.on("enquiry_chat", ({ jobCardNo, message, enquiryNo }) => {
    console.log("Received enquiry_chat for:", jobCardNo, message, enquiryNo);

  });

  socket.on("disconnect", () => {
    console.log("Partner disconnected");
  });
});


// routers
import userRouter from './modules/user/routes.js';
import itemRouter from './modules/item/routes.js';
import itemGroupRouter from './modules/itemGroup/routes.js';
import itemcategorieRouter from './modules/itemCategory/routes.js';
import hsnRouter from './modules/hsn/routes.js';
import companyRouter from './modules/company/routes.js';
import uomRouter from './modules/uom/routes.js';
import aggregateRouter from './modules/aggregate/routes.js';
import subAggregateRouter from './modules/subaggregate/routes.js';
import logApiRouter from './modules/logApi/routes.js';
import makeRouter from './modules/make/routes.js';
import varientRouter from './modules/varient/routes.js';
import serviceTypeRouter from './modules/serviceType/routes.js';
import modelRouter from './modules/model/routes.js';
import repairTypeRouter from './modules/repairType/routes.js';
import sourceRouter from './modules/source/routes.js';
import sourceTypeRouter from './modules/sourceType/routes.js';
import vendorRouter from './modules/vendor/routes.js';
import disPositionRouter from './modules/disPosition/routes.js';
import subDisPositionRouter from './modules/subDisPosition/routes.js';
import laborScheduleRouter from './modules/laborSchedule/routes.js';
import dsaAgentRouter from './modules/dsaAgent/routes.js';
import outletRouter from './modules/outlet/routes.js';
import franchiseRouter from './modules/franchise/routes.js';
import binLocationRouter from './modules/binLocation/routes.js';
import employeeRoleRouter from './modules/employeeRole/routes.js';
import employeeRouter from './modules/employee/routes.js';
import technicianRouter from './modules/technician/routes.js';
import customerRouter from './modules/customer/routes.js';
import vehicleRouter from './modules/vehicle/routes.js';
import insuranceRouter from './modules/insurance/routes.js';
import serviceBookingRouter from './modules/serviceBooking/routes.js';
import serviceEstimateRouter from './modules/serviceEstimate/routes.js';
import pickupDropoffRouter from './modules/pickupDropoff/routes.js';
import tyreOemRouter from './modules/tyreOEM/routes.js';
import tyreSizeRouter from './modules/tyreSize/routes.js';
import batteryOemRouter from './modules/batteryOem/routes.js';
import clickInPartsRouter from './modules/clickInParts/routes.js';
import vehiclePreDeliveryCheckListRouter from './modules/vehiclePredeliveryChecklist/routes.js';
import pickupTypeRouter from './modules/pickupType/routes.js';
import dockFieldRouter from './modules/dockFields/routes.js';
import checkListTypeRouter from './modules/checkListType/routes.js';
import inspectionSubsystemMapRouter from './modules/inspectionSubsystemMap/routes.js';
import inspectionCheckListRouter from './modules/inspectionCheckList/routes.js';
import inspectionRatingReasonRouter from './modules/inspectionRatingReason/routes.js';
import dockAbuseFieldRouter from './modules/dockAbuseFields/routes.js';
import gateinVehicleInventoryRouter from './modules/gateInVehicleInventory/routes.js';
import inventoryCheckListRouter from './modules/inventoryCheckList/routes.js';
import jobCardRouter from './modules/jobCard/routes.js';
import leaderboardRouter from './modules/leaderboard/routes.js';
import paramAlertScheduleRouter from './modules/paramAlertSchedule/routes.js';
import inventoryPhotoCategoryRouter from './modules/inventoryPhotoCategory/routes.js';
import partIssueRouter from './modules/Parts/partsissue/routes.js';
import partsRouter from './modules/Parts/GRN/routes.js';
import menuSettingsRouter from './modules/menuSettings/routes.js';
import receiptRouter from './modules/receipts/routes.js';
import partReturnRouter from "./modules/Parts/partsreturn/routes.js";
import bulkUploadRouter from "./modules/bulkUpload/routes.js";
import counterSaleRouter from './modules/Parts/counterSale/routes.js';
import StockTransferRouter from './modules/Parts/stockTransfer/routes.js';
import casualGatePassRouter from './modules/casualGatepass/routes.js';
import creditRouter from './modules/cdNotes/routes.js';
import creditNotesDetailsRouter from './modules/creditNotesDetails/routes.js';
import PORouter from './modules/Parts/PurchaseOrder/routes.js';
import approvedEstimates from './modules/approvedEstimates/routes.js';
import mastersRouter from './modules/masters/routes.js';
import serviceReminderRouter from './modules/ServiceReminder/routes.js';
import GateinRouter from './modules/Parts/gateIn/routes.js';
import leadRouter from './modules/leadManagement/routes.js';
import schemeRouter from './modules/scheme/routes.js';
import vehicleContractRouter from './modules/vehicleContract/routes.js';
import eInvoice from './modules/eInvoice/routes.js';
import feedbackQnRouter from './modules/feedbackQuestions/routes.js';
import psfreviewrouter from './modules/psfreview/routes.js'
import StockTransferOracleRouter from './modules/Parts/stockTransferOracle/routes.js';
import partsCatalogueRouter from './modules/Parts/partsCatalogue/routes.js';
import partsCatalogueRouterDms from './modules/Parts/partsCatalogue/oldDmsRoutes.js';
import TaslAutoGrnRouter from './modules/Parts/taslAutoGrn/routes.js';
import accountStatementRouter from './modules/accountStatement/routes.js';
//  mobile routes declare here 
import mobileMastersRouter from './modules/masters/mobileMasterRoutes.js';
import mobileLaborScheduleRouter from './modules/laborSchedule/mobileLaborScheduleRoute.js';
import mobileItemRouter from './modules/item/mobileItemRoutes.js';
import mobileServiceEstimateRouter from './modules/serviceEstimate/mobileServiceEstimateRoute.js';
import MobileJobCardRouter from './modules/jobCard/mobileJobCardRoute.js';
import mobileUserRouter from './modules/user/mobileroutes.js';
import mobileCustomerRouter from './modules/customer/mobileroutes.js';
import mobileVehicleRouter from './modules/vehicle/mobileRoutes.js';
import EnquiryRouter from './modules/Parts/enquiry/routes.js'
import enquiryRouter from './modules/Parts/enquiry/routes.js';
import nmsaAgentRouter from './modules/nmsaAgent/routes.js';
import mobilePartsRouter from './modules/Parts/GRN/mobileGrnRoutes.js';
import { auditLogMiddleware, captureResponse } from './config/auditlogmiddleware.js';
import mobileBeatPlanRouter from './modules/beatPlan/mobileroutes.js';
import mobileNmsaAgentRouter from './modules/nmsaAgent/mobileroutes.js';
import mobileVendorRouter from './modules/vendor/mobileroutes.js';
import mobileFranchiseOnboardingRouter from './modules/franchiseOnboarding/mobileroutes.js';
import franchiseOnboardingRouter from './modules/franchiseOnboarding/routes.js';
import mobileSoaRouter from './modules/accountStatement/mobileSoaRoutes.js';
import partsGptRouter from './modules/Parts/partsGpt/route.js';
import erpStockTransferRouter from './modules/Parts/erpStockTransfer/routes.js';
import mobileErpRouter from './modules/Parts/erpStockTransfer/mobileErpRoutes.js';
import mobilePartIssueRouter from './modules/Parts/partsissue/mobilePartIssueRoute.js';
import checkListsRouter from './modules/mobilechecklists/checklistRouter.js';
import mobileImageRouter from './modules/images/mobileroute.js';
// import clickRouter from './modules/clickins/mobileroute.js'; case-sensitive issue 
import clickRouter from './modules/clickins/mobileRoute.js';
import roughEstimateRouter from './modules/roughEstimate/routes.js';
import PartsCatalogueMobileRouter from './modules/Parts/partsCatalogue/mobileRoutes.js';
import expenseVendorRouter from './modules/expenseVendor/routes.js';
import expenseRouter from './modules/expense/routes.js';

app.use('/api/users', userRouter);
app.use('/api/items', itemRouter);
app.use('/api/itemgroups', itemGroupRouter);
app.use('/api/itemcategories', itemcategorieRouter);
app.use('/api/hsns', hsnRouter);
app.use('/api/companies', companyRouter);
app.use('/api/uom', uomRouter);
app.use('/api/aggregates', aggregateRouter);
app.use('/api/subaggregates', subAggregateRouter);
app.use('/api/logs', logApiRouter);
app.use('/api/makes', makeRouter);
app.use('/api/varient', varientRouter);
app.use('/api/models', modelRouter);
app.use('/api/servicetypes', serviceTypeRouter);
app.use('/api/repairtypes', repairTypeRouter);
app.use('/api/sources', sourceRouter);
app.use('/api/sourcetypes', sourceTypeRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/expenseVendor', expenseVendorRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/disposition', disPositionRouter);
app.use('/api/subdisposition', subDisPositionRouter);
app.use('/api/laborSchedules', laborScheduleRouter);
app.use('/api/dsaagent', dsaAgentRouter);
app.use('/api/outlets', outletRouter);
app.use('/api/franchise', franchiseRouter);
app.use('/api/binLocations', binLocationRouter);
app.use('/api/employeerole', employeeRoleRouter);
app.use('/api/employee', employeeRouter);
app.use('/api/technician', technicianRouter);
app.use('/api/customer', customerRouter);
app.use('/api/vehicle', vehicleRouter);
app.use('/api/insurance', insuranceRouter);
app.use('/api/serviceBooking', serviceBookingRouter);
app.use('/api/pickupDropoff', pickupDropoffRouter);
app.use('/api/serviceEstimate', serviceEstimateRouter);


app.use('/api/batteryOem', batteryOemRouter);
app.use('/api/clickInParts', clickInPartsRouter);
app.use('/api/vehiclePredeliveryCheckList', vehiclePreDeliveryCheckListRouter);


app.use('/api/tyreOem', tyreOemRouter);
app.use('/api/tyreSize', tyreSizeRouter);
app.use('/api/pickupType', pickupTypeRouter);
app.use('/api/dockField', dockFieldRouter);
app.use('/api/checkListTypes', checkListTypeRouter);
app.use('/api/inspectionSubsystemMap', inspectionSubsystemMapRouter);
app.use('/api/inspectionCheckList', inspectionCheckListRouter);
app.use('/api/inspectionRatingReason', inspectionRatingReasonRouter);
app.use('/api/dockAbuseField', dockAbuseFieldRouter);
app.use('/api/gateInVehicle', gateinVehicleInventoryRouter);
app.use('/api/inventoryCheckList', inventoryCheckListRouter);
app.use('/api/jobCard', jobCardRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/paramAlertSchedule', paramAlertScheduleRouter);
app.use('/api/inventoryPhotoCategory', inventoryPhotoCategoryRouter);
app.use('/api/menuSettings', menuSettingsRouter);
app.use('/api/receipt', receiptRouter);
app.use("/api/bulkUpload", bulkUploadRouter)

app.use("/api/jobCard", casualGatePassRouter);
app.use("/api/creditNotes", creditRouter);
app.use("/api/creditNotesDetails", creditNotesDetailsRouter);
app.use("/api/approvedEstimates", approvedEstimates);
app.use("/api/masters", mastersRouter);
app.use("/api/service_reminder", serviceReminderRouter);
app.use("/api/leadManagement", leadRouter);
app.use('/api/scheme', schemeRouter);
app.use('/api/vehicleContract', vehicleContractRouter);
app.use('/api/eInvoice', eInvoice);
app.use('/api/feedbackqn', feedbackQnRouter)
app.use('/api/psfreview', psfreviewrouter)
app.use('/api/stock_transfer_oracles', StockTransferOracleRouter)
app.use('/api/partsCatalogue', partsCatalogueRouter)
app.use('/api/enquiry', enquiryRouter)
app.use('/api/taslAutoGrn', TaslAutoGrnRouter)
app.use('/api/nmsaagent', nmsaAgentRouter)
app.use('/api/franchiseonboarding', franchiseOnboardingRouter)
app.use('/api/partsGpt', partsGptRouter);
app.use('/api/erp_stock_transfer', erpStockTransferRouter);
app.use('/api/roughEstimate', roughEstimateRouter);
app.use('/api/partsCatalogueDms', partsCatalogueRouterDms) // old dms routes with dms token validation

// Mobile Routes
app.use("/api/apis/masters", mobileMastersRouter);
app.use('/api/apis/labor_master', mobileLaborScheduleRouter);
app.use('/api/apis/parts_master', mobileItemRouter);
app.use('/api/apis', mobileServiceEstimateRouter);
app.use('/api/apis', MobileJobCardRouter);
app.use('/api/apis', mobileUserRouter);
app.use('/api/apis', mobileCustomerRouter);
app.use('/api/apis', mobileVehicleRouter);
app.use('/api/apis', mobilePartsRouter)
app.use('/api/apis', mobileBeatPlanRouter);
app.use('/api/apis', mobileNmsaAgentRouter);
app.use('/api/apis', mobileVendorRouter);
app.use('/api/apis', mobileFranchiseOnboardingRouter);
app.use('/api/apis', mobileSoaRouter);
app.use('/api/apis', mobileErpRouter);

app.use('/api/apis', mobilePartIssueRouter)
// app.get("/api/csrf-token", (req, res) => {
//   const token = generateCsrfToken(req, res); // Sets cookie + returns token
//   // res.json({ csrfToken: token });
//     res.sendStatus(204); // No Content

// });
//parts api without audit log
app.use(captureResponse);
app.use(auditLogMiddleware);
app.use('/api/parts', partsRouter);
app.use('/api/partissue', partIssueRouter);
app.use("/api/partreturn", partReturnRouter)
app.use("/api/countersale", counterSaleRouter)
app.use("/api/stocktransfer", StockTransferRouter)
app.use("/api/purchaseOrder", PORouter);
app.use("/api/gateIn", GateinRouter);
app.use('/api/psfreview', psfreviewrouter)
app.use('/api/eInvoice', eInvoice);
app.use('/api/feedbackqn', feedbackQnRouter)
app.use('/api/stock_transfer_oracles', StockTransferOracleRouter)
app.use('/api/partsCatalogue', partsCatalogueRouter)
app.use('/api/enquiry', enquiryRouter)
app.use('/api/taslAutoGrn', TaslAutoGrnRouter)
app.use('/api/accountStatement', accountStatementRouter)
app.use(ErrorHandler);
app.use('/api/apis', carpmRouter);
app.use('/api/apis', checkListsRouter)
app.use('/api/apis', mobileImageRouter);
app.use('/api/apis', gateinVehicleInventoryRouter);
app.use('/api/apis', clickRouter);
app.use('/api/apis', PartsCatalogueMobileRouter)

//testing api

app.get('/api/health', (req, res) => {
  // res.send('Welcome');
  res.json({
    message: 'Backend running successfully',
    environment: process.env.APP_ENV,
  });
});

//port

const PORT = 7001;

//server

server.listen(PORT, () => {
  console.log('--------->', process.env.NODE_ENV);
  console.log(`Server running siva at port ${PORT}`);
});

export default server;
