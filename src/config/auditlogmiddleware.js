import auditLog from '../shared/auditLog.js';
export const captureResponse = (req, res, next) => {
  const oldJson = res.json;
  const oldSend = res.send;

  res.locals.responseBody = null;

  res.json = function (body) {
    res.locals.responseBody = body;
    return oldJson.call(this, body);
  };

  res.send = function (body) {
    res.locals.responseBody = body;
    return oldSend.call(this, body);
  };

  next();
};

export const auditLogMiddleware = (req, res, next) => {
  res.on("finish", async () => {
    try {
      if (!req.user) return;

      // URL parsing
      const parts = req.originalUrl.split("?")[0].split("/").filter(Boolean);
      // ['api', 'purchaseorder', 'create']

      const menu_name = parts[1] || null;
      const submenu_name = parts[2] || null;

      // Message from response
      const response = res.locals.responseBody;
      const message =
        response?.message ||
        response?.resultText ||
        `${req.method} ${menu_name}`;

      const auditData = {
        message,
        url: req.originalUrl,
        menu_name,
        submenu_name,
        action: req.method,
        result: res.statusCode < 400 ? "success" : "failed",
        access: req.headers["user-agent"]?.includes("Mobile")
          ? "Mobile"
          : "Portal",
        createdAt: new Date()
      };

        auditLog.createAuditLog(req, auditData);
    } catch (err) {
      console.error("Audit log error:", err);
    }
  });

  next();
};




    