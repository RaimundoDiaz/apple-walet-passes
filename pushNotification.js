const fs = require("fs");
const http2 = require("http2");
const jwt = require("jsonwebtoken");

async function sendApplePushNotification(deviceToken, payload = {}) {
  const tokenData = {
    header: {
      alg: "ES256",
      kid: process.env.APPLE_KEY_ID, // Key ID
    },
    payload: {
      iss: process.env.APPLE_TEAM_ID, // Issuer key
      iat: Math.floor(Date.now() / 1000), // Issued at time (EPOCH)
    },
  };

  const privateKey = fs.readFileSync("./.certificates/AuthKey_ABC123DEF1.p8");
  const options = {
    cert: fs.readFileSync("./.certificates/signerCert.pem"),
    key: fs.readFileSync("./.certificates/signerKey.pem"),
    ca: fs.readFileSync("./.certificates/wwdr.pem"),
    passphrase: process.env.PASS_TYPE_IDENTIFIER,
  };

  const encodedToken = jwt.sign(tokenData.payload, privateKey, {
    algorithm: "ES256",
    header: tokenData.header,
  });

  const headers = {
    ":method": "POST",
    ":path": `/3/device/${deviceToken}`,
    authorization: `bearer ${encodedToken}`,
    "apns-push-type": "background",
    "apns-expiration": "0",
    "apns-priority": "10",
    "apns-topic": process.env.APPLE_TOPIC, // the topic must be the same as you used on `passTypeIdentifier` to create the pass
    "Content-Type": "application/json",
  };

  const client = http2.connect("https://api.push.apple.com");

  client.on("error", (error) => {
    console.error("Client connection error:", error);
  });

  const connectPromise = new Promise((resolve, reject) => {
    client.on("connect", () => {
      resolve();
    });

    client.on("error", (error) => {
      reject(error);
    });
  });

  await connectPromise;

  const req = client.request(headers, options);
  req.setEncoding("utf8");
  req.write(JSON.stringify(payload)); // Empty payload as necessary, see apple documentation.
  req.end();

  const responsePromise = new Promise((resolve, reject) => {
    req.on("response", (responseHeaders) => {
      resolve();
    });

    req.on("data", (chunk) => {});

    req.on("end", () => {
      client.close();
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.error("Request timed out");
      req.close();
      reject(new Error("Request timed out"));
    });

    req.on("socket", (socket) => {
      socket.on("timeout", () => {
        console.error("Socket timeout");
        req.close();
        reject(new Error("Socket timeout"));
      });
      socket.on("error", (error) => {
        console.error("Socket error:", error);
        reject(error);
      });
      socket.on("close", () => {});
    });
  });

  await responsePromise;

  client.on("close", () => {});
}

module.exports = { sendApplePushNotification };
