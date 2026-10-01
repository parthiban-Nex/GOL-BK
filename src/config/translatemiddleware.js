import axios from "axios";

async function translateText(text, targetLang = "ar") {
  if (!text) return text;
  try {
    const response = await axios.post(
      "http://localhost:5000/translate",
      { q: text, source: "en", target: targetLang },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data.translatedText;
  } catch (error) {
          throw new Error("Translation API error");

    // return text; // fallback
  }
}

async function translateObject(obj, targetLang = "ar") {
  if (typeof obj === "string") {
    return await translateText(obj, targetLang);
  } else if (Array.isArray(obj)) {
    return await Promise.all(obj.map(item => translateObject(item, targetLang)));
  } else if (obj !== null && typeof obj === "object") {
    const translated = {};
    for (const key in obj) {
      // Optionally skip certain keys like ids or numbers
      if (typeof obj[key] === "string") {
        translated[key] = await translateText(obj[key], targetLang);
      } else {
        translated[key] = await translateObject(obj[key], targetLang);
      }
    }
    return translated;
  } else {
    return obj; // number, boolean, null
  }
}

export function translateResponseMiddleware(req, res, next) {
  if (req.path.endsWith("/login") || req.path.endsWith("/logout") || req.path.endsWith("/menuList")) {
    return next();
  }

  const originalSend = res.send;

  res.send = async function (body) {
    try {
      let dataToTranslate = body;

      if (typeof body === "string") {
        try {
          dataToTranslate = JSON.parse(body);
        } catch {
          // not JSON, keep as string
        }
      }

      const translatedData = await translateObject(dataToTranslate, "ar");
      return originalSend.call(this, JSON.stringify(translatedData));
    } catch (err) {
      console.error("Middleware translation error:", err.message);
      return originalSend.call(this, body);
    }
  };

  next();
}
