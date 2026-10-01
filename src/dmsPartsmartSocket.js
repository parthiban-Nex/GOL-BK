import express from "express";
import dotenv from "dotenv";
import { ConfidentialClientApplication } from "@azure/msal-node";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const cca = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  },
});

/* ================= SESSION ================= */
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );

/* ================= LOGIN ================= */

app.get("/auth/login", async (req, res) => {
  const authCodeUrlParameters = {
    scopes: ["openid", "profile", "email"],
    redirectUri: process.env.REDIRECT_URI,
    // prompt: "none"
  };

  const url = await cca.getAuthCodeUrl(authCodeUrlParameters);
  console.log(url,"url")
  res.redirect(url);
});

app.post("/auth/login", async (req, res) => {
    console.log(req.body,"body")
  // const { ecode, password } = req.body;

    const { email, password } = req.body;

  try {

//     const appToken = await cca.acquireTokenByClientCredential({
//   scopes: ["https://graph.microsoft.com/.default"]
// });

// console.log(appToken,"appToken")
// const graphRes = await fetch(
//   `https://graph.microsoft.com/v1.0/users?$search="employeeId:k02104"`,
//   {
//     headers: {
//       Authorization: `Bearer ${appToken.accessToken}`,
//       "ConsistencyLevel": "eventual"
//     }
//   }
// );

// const data = await graphRes.json();
//    console.log(data,"dataa")
// const user = data.value[0]; 
// const email = user.mail || user.userPrincipalName;
    const result = await cca.acquireTokenByUsernamePassword({
      scopes: ["openid", "profile", "email"],
      username: email,
      password: password,
    });
      console.log(result,"resultt")
    res.json({
      message: "Login success",
      account: result.account,
      accessToken: result.accessToken,
      idToken: result.idToken,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({
      message: "Login failed",
      error: err.message,
    });
  }
});

/* ================= REDIRECT ================= */
app.get("/dms_auth/callback", async (req, res) => {
  const tokenResponse = await cca.acquireTokenByCode({
    code: req.query.code,
    scopes: ["openid", "profile", "email"],
    redirectUri: process.env.REDIRECT_URI
  });

  console.log(tokenResponse.account);
  res.send("Logged in silently");
});

/* ================= PROTECTED ================= */
app.get("/profile", (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");

  res.json(req.session.user);
});

/* ================= LOGOUT ================= */
app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(7001, () =>
  console.log("Server running on", 7001)
);