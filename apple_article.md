# Building a Web Service for Apple Wallet Passes with Node.js: A Comprehensive Guide

## Introduction

Digital wallet passes have become increasingly popular for loyalty programs, event tickets, and more, offering convenience for both users and businesses. After spending a couple months of development and research into creating a web service for Google and Apple Wallet using Node.js, I noticed a significant gap in available online resources on this topic. This article aims to bridge that gap by providing a comprehensive guide for developers interested in implementing similar services.

For those interested in Google Wallet implementation, I've also created a companion repository with a complete Node.js implementation: [Google Wallet Passes](https://github.com/RaimundoDiaz/google-wallet-passes).

In this article, I will walk you through the process of creating and updating passes for Apple Wallet, including detailed implementation guides, code examples, and best practices for pass distribution and automatic updates.

## Table of Contents

- [Building a Web Service for Apple Wallet Passes with Node.js: A Comprehensive Guide](#building-a-web-service-for-apple-wallet-passes-with-nodejs-a-comprehensive-guide)
  - [Introduction](#introduction)
  - [Table of Contents](#table-of-contents)
  - [Apple Wallet Integration](#apple-wallet-integration)
    - [Prerequisites](#prerequisites)
      - [Certificate Setup](#certificate-setup)
    - [Required Dependencies](#required-dependencies)
    - [Pass Creation Process](#pass-creation-process)
    - [Implementation Guide](#implementation-guide)
    - [Usage Example](#usage-example)
    - [Pass Distribution](#pass-distribution)
    - [Setting up Automatic Updates](#setting-up-automatic-updates)
      - [Pass Update Mechanism](#pass-update-mechanism)
        - [1. Server Configuration](#1-server-configuration)
        - [2. Database Structure](#2-database-structure)
        - [3. Device Registration Process](#3-device-registration-process)
        - [4. Pass Update Process](#4-pass-update-process)
        - [5. Device Unregistration](#5-device-unregistration)
        - [6. Automatic Pass Updates](#6-automatic-pass-updates)
          - [6.1 Establishing APNs Connection](#61-establishing-apns-connection)
          - [6.2 Creating and Encrypting JSON Token](#62-creating-and-encrypting-json-token)
          - [6.3 Sending Push Notifications](#63-sending-push-notifications)
          - [6.4 Getting List of Updatable Passes](#64-getting-list-of-updatable-passes)
  - [Conclusion](#conclusion)

## Apple Wallet Integration

The Apple Wallet integration differs significantly from Google's approach. While Google provides a dedicated API for pass creation and updates, Apple's implementation requires you to:
1. Create passes on your server
2. Maintain a database of registered devices
3. Integrate with Apple Push Notification Service (APNs) for pass updates

### Prerequisites

Before implementing the pass system, you'll need to set up the necessary certificates.

#### Certificate Setup

For detailed certificate creation instructions, I recommend following these resources:
- [passkit-generator wiki](https://github.com/alexandercerutti/passkit-generator/wiki/Generating-Certificates) for certificate generation
- [YouTube tutorial](https://www.youtube.com/watch?v=rJZdPoXHtzI&t) on pass creation (focus on the certificate setup section)

### Required Dependencies

Add the following dependencies to your project:
```json
{
  "axios": "^1.7.9",
  "dotenv": "^16.4.7",
  "file-system": "^2.2.2",
  "get-image-colors": "^4.0.1",
  "jsonwebtoken": "^9.0.2",
  "passkit-generator": "^3.2.0"
}
```

### Pass Creation Process

The `passkit-generator` library allows you to create passes either from a JSON file or programmatically. I've implemented two models for different pass types, which can be customized based on your requirements.

Key configuration parameters:
- `passTypeIdentifier`: Your Apple-registered pass type identifier (must match your distribution certificate)
- `teamIdentifier`: Your Apple Developer Program Team ID

**Important**: Store your certificates securely on your server for pass signing.

You can download pass model templates from the [Apple Developer Portal](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/index.html#//apple_ref/doc/uid/TP40012195-CH1-SW1). Look for the _"developer downloads area"_ link.

Example pass model (`models/Custom.pass/pass.json`):
```json
{
  "formatVersion" : 1,
  "passTypeIdentifier" : "pass.com.example.app",
  "teamIdentifier" : "1ABC123456",
  "generic" : {
    "primaryFields" : [],
    "secondaryFields" : [],
    "auxiliaryFields" : [],
    "backFields" : []
  }
}
```

Example store card model (`models/StoreCard.pass/pass.json`):
```json
{
  "formatVersion" : 1,
  "passTypeIdentifier" : "pass.com.example.app",
  "teamIdentifier" : "1ABC123456",
  "storeCard" : {
    "primaryFields" : [],
    "secondaryFields" : [],
    "auxiliaryFields" : [],
    "backFields" : []
  }
}
```

### Implementation Guide

I've defined types for pass properties. In this example, I'll demonstrate a `StampPass` implementation, which includes image support for a loyalty program. You can modify these properties based on your specific requirements.

`stampPass.js`:
```js
/**
 * @typedef {object} StampPassProperties
 * @property {string} programName
 * @property {string} organizationName
 * @property {string} logoUri
 * @property {string} qrCodeLink
 * @property {string} accountId
 * @property {string} fullName
 * @property {string} authenticationToken
 * @property {string?} stampImageUri
 */
```

And a class for each pass type, for example, what I call a stamp pass:

`stampPass.js`

`StampPass`


```js
class StampPass {
	constructor() {
		/**
		 * The certificates used to sign the pass. Environment
		 * variable: PASS_PHRASE.
		 */
		this.certificates = {
			wwdr: fs.readFileSync("./.certificates/wwdr.pem"),
			signerCert: fs.readFileSync("./.certificates/signerCert.pem"),
			signerKey: fs.readFileSync("./.certificates/signerKey.pem"),
			signerKeyPassphrase: process.env.PASS_PHRASE,
		}
	}
  ...
  async createPass(...)
  ...
}
```

`stampPass.js`

`StampPass.createPass`

```js
/**
   * Create a pass.
   *
   * @param {string} serialNumber Developer-defined unique ID for this pass.
   * @param {StampPassProperties} stampPassProperties The properties for the pass to create.
   *
   * @returns {Promise<void>}
   */
async createPass(serialNumber, stampPassProperties) {
    // First we get the image from the URL
    const logoResp = await axios.get(
      stampPassProperties.logoUri,
      { responseType: "arraybuffer" });
    // Then we convert the image to a buffer
    const buffer = Buffer.from(logoResp.data, "uft-8");

    const stampImageResp = await axios.get(
      stampPassProperties.stampImageUri,
      { responseType: "arraybuffer" });
    const stampBuffer = Buffer.from(stampImageResp.data, "uft-8");

    // We create the pass from the model
    const pass = await PKPass.from(
      {
        model: "./models/StoreCard.pass",
        certificates: {
          wwdr: this.certificates.wwdr,
          signerCert: this.certificates.signerCert,
          signerKey: this.certificates.signerKey,
          signerKeyPassphrase: this.certificates.signerKeyPassphrase,
        },
      },
      {
        serialNumber,
        authenticationToken: stampPassProperties.authenticationToken,
        webServiceURL: process.env.WEB_SERVICE_URL,

        organizationName: stampPassProperties.organizationName,
        description: stampPassProperties.organizationName,
        logoText: stampPassProperties.programName,
      }
    );

    // We add the images to the pass
    pass.addBuffer("logo.png", buffer);
    pass.addBuffer("logo@2x.png", buffer);
    pass.addBuffer("icon@.png", buffer);
    pass.addBuffer("icon@2x.png", buffer);
    pass.addBuffer("strip.png", stampBuffer);
    pass.addBuffer("strip@2x.png", stampBuffer);


    // We set the barcode and fields of the pass
    pass.setBarcodes({
      "message": stampPassProperties.qrCodeLink,
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1",
      "altText": stampPassProperties.accountId,
    });

    // We set the fields of the pass
    pass.secondaryFields.push({
      "key": "fullName",
      "label": "Name",
      "value": stampPassProperties.fullName,
    });
    pass.secondaryFields.push({
      "key": "accountId",
      "label": "",
      "value": stampPassProperties.accountId,
      "textAlignment": "PKTextAlignmentRight"
    });

    const bufferPass = pass.getAsBuffer();

    // We can save the pass to the file system
    fs.writeFileSync("YourPassName.pkpass", bufferPass);
  }
```

### Usage Example

Create a `main.js` file to test the implementation:

`main.js`

```js
require('dotenv').config();
const { LoyaltyPass } = require('./loyaltyPass');
const { StampPass } = require('./stampPass');

const PassTypeEnum = {
    STAMPS: "<stamps>",
    POINTS: "<points>",
    SIMPLE: "<simple>"
};

async function main() {
	// Properties for the loyalty pass
	const passProperties = {
    programName: "My program name",
    organizationName: "My organization",
    logoUri:
      "https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg?t=st=1734533689~exp=1734537289~hmac=40f57aec2d4cb95a9fc0bd8e8f5e3bd279ac78ea24ff326d4a8e69d241e81937&w=1380",
      qrCodeLink: "https://www.example.com/",
      accountId: "SQ-12345A",
    fullName: "Gon Freecss",
    authenticationToken: "1234567890123456",
    stampImageUri:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1032&h=336"
  };

	// Create the pass
	const pass = new StampPass();
	await pass.createPass("1234", passProperties);
}

main().catch(console.error);
```

### Pass Distribution

Once you've created the pass file, you have two main options for distribution:
1. Email the `.pkpass` file as an attachment
2. Host the file online and share the download link

For production environments, I recommend using a service like Vercel Blob for file hosting. When users access the link on their iOS devices, they'll be prompted to add the pass to their Apple Wallet.

### Setting up Automatic Updates

Apple Wallet passes can be automatically updated to reflect changes in loyalty points, stamps, or other information. This requires setting up a web service that communicates with Apple's Push Notification Service (APNs). When a pass is added to Apple Wallet, the device registers with your web service, enabling you to push updates.

Key components needed:
- A web service endpoint to handle device registration/unregistration 
- Apple Push Notification Service (APNS) integration
- Secure storage for device tokens and pass information
- Logic to determine when passes need updating

The web service should implement the [Apples Server Configuration](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes#Server-Configuration) to handle device registration and pass updates properly.


#### Pass Update Mechanism

To implement automatic pass updates, you need to set up a complete web service that handles device registration, pass updates, and push notifications. Here's a comprehensive guide to implementing this system:

##### 1. Server Configuration

When a user adds your pass to their Apple Wallet, their device automatically communicates with your web service. This communication is essential for enabling automatic updates. The device registration process relies on three key pieces of information that you provide when creating the pass:

- `serialNumber`: A unique identifier for each pass
- `authenticationToken`: A security token used to authenticate API requests
- `webServiceURL`: The base URL of your server's API endpoints

These parameters are configured when creating the pass using the `PKPass.from()` method:

```js
async createPass(serialNumber, stampPassProperties) {
    ...
    const pass = await PKPass.from(
      ...
      {
        serialNumber,
        authenticationToken: stampPassProperties.authenticationToken,
        webServiceURL: process.env.WEB_SERVICE_URL,
        ...
      }
    );
    ...
  }
```

Once these parameters are set, Apple Wallet will automatically attempt to register the device with your web service when the user adds the pass. Your server should implement the necessary endpoints to handle this registration process securely.

The endpoint that the device will call to register is:

```
POST https://yourpasshost/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
```

Your server should authenticate every request using the `authenticationToken` provided in the Authorization header:
```
ApplePass {authenticationToken}
```

##### 2. Database Structure

Apple recommends using a relational database to store device and pass information. Here's the recommended schema:

**Device Table**
Stores information about devices that contain updatable passes.

| Attribute               | Type     | Description                                                                                  |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------- |
| id                      | `int`    | Primary key                                                                                  |
| deviceLibraryIdentifier | `string` | Unique ID to identify and authenticate a device                                              |
| pushToken               | `string` | Push token used to send update notifications to the device                                   |

**Pass Table**
Stores information about updatable passes.

| Attribute          | Type     | Description                                                       |
| ------------------ | -------- | ----------------------------------------------------------------- |
| id                 | `int`    | Primary key                                                       |
| passTypeIdentifier | `string` | Your pass type identifier                                         |
| serialNumber       | `string` | Unique identifier for the pass                                    |
| lastUpdateTag      | `date`   | Timestamp of the last pass update                                 |

**Registration Table**
Manages the many-to-many relationship between devices and passes.

| Attribute                | Type     | Description                               |
| ------------------------ | -------- | ----------------------------------------- |
| id                       | `int`    | Primary key                               |
| deviceId                 | `int`    | Foreign key referencing the Device table  |
| passId                   | `int`    | Foreign key referencing the Pass table    |

##### 3. Device Registration Process

When a device attempts to register, your server should:

1. Authenticate the request using the provided `authenticationToken`
2. Find or create the device record using the `deviceLibraryIdentifier` and `pushToken`
3. Find or create the pass record using the `passTypeIdentifier` and `serialNumber`
4. Find or create the registration relationship between the device and pass
5. Return appropriate status codes:
   - `200`: Pass already registered
   - `201`: Registration successful
   - `401`: Unauthorized request

Here's an example implementation using Next.js:

```typescript
export const POST = async (request: NextRequest, { params }: { params: PathParams }): Promise<Response> => {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = params;
  const { pushToken } = await request.json();
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `ApplePass ${process.env.AUTH_TOKEN}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find or create device
    const device = await Devices.findOrCreate({
      deviceLibraryIdentifier,
      pushToken
    });

    // Find or create pass
    const pass = await Passes.findOrCreate({
      passTypeIdentifier,
      serialNumber
    });

    // Create registration if it doesn't exist
    const registration = await Registrations.findOrCreate({
      deviceId: device.id,
      passId: pass.id
    });

    return NextResponse.json(
      { message: registration.isNew ? "Registration created" : "Registration exists" },
      { status: registration.isNew ? 201 : 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
```

##### 4. Pass Update Process

To update passes, implement the following endpoint:

```
GET https://yourpasshost/v1/passes/{passTypeIdentifier}/{serialNumber}
```

This endpoint should:
1. Authenticate the request
2. Generate or retrieve the updated pass
   - You have two options for handling pass updates:
     1. Generate the updated pass directly in this endpoint
     2. Generate the pass elsewhere in your application and store it (e.g., in a cloud storage service)
   - The example below demonstrates the second approach, where we retrieve a pre-generated pass from storage
2. Return the pass file with appropriate headers

Example implementation:

```typescript
export const GET = async (request: NextRequest, { params }: { params: PathParams }): Promise<Response> => {
  const { serialNumber } = params;
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `ApplePass ${process.env.AUTH_TOKEN}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Retrieve the pass record from the database
    const pass = await Passes.find(serialNumber);
    
    // Fetch the pre-generated pass file from storage
    // In this example, we assume the pass is stored at a URL
    const passBuffer = await fetch(pass.url).then(res => res.arrayBuffer());

    // Convert the downloaded ArrayBuffer to a Buffer and send it to the client
    return new Response(Buffer.from(passBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${serialNumber}.pkpass"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
```

##### 5. Device Unregistration

When a user removes a pass from their device, implement this endpoint:

```
DELETE https://yourpasshost/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
```

This endpoint should:
1. Authenticate the request
2. Remove the registration
3. Delete the device records if the registration is not found
4. Return appropriate status codes

Example implementation:

```typescript
export const DELETE = async (request: NextRequest, { params }: { params: PathParams }): Promise<Response> => {
  const { deviceLibraryIdentifier, serialNumber } = params;
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `ApplePass ${process.env.AUTH_TOKEN}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // First try to find and delete the registration
    try {
      const registration = await Registrations.find(deviceLibraryIdentifier, serialNumber);
      await Registrations.delete(registration.id);
      return NextResponse.json({ message: "Registration deleted successfully" }, { status: 200 });
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        // If registration not found, try to delete the device
        try {
          const device = await Devices.find(deviceLibraryIdentifier);
          await Devices.delete(device.id);
          return NextResponse.json({ message: "Device deleted successfully" }, { status: 200 });
        } catch (deviceError) {
          if (deviceError instanceof RecordNotFoundError) {
            return NextResponse.json({ message: "No registration or device found" }, { status: 200 });
          }
          throw deviceError;
        }
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
```

##### 6. Automatic Pass Updates

By default, users need to manually request pass updates by performing a pull-down gesture on their iOS devices. To enable automatic updates, you need to implement push notifications using Apple's Push Notification Service (APNs). This process involves:

1. Sending a push notification to the user's device via APNs
2. The device then requests the list of updatable passes from your server
3. The device request each pass update
4. Your server provides the updated version for each pass

To implement this, you'll need to establish a connection with APNs using either certificate-based or token-based authentication. This guide demonstrates the token-based approach, which is recommended for modern applications.

###### 6.1 Establishing APNs Connection

To establish a token-based connection with APNs, you need to create a private key in your Apple Developer account:

1. Go to Certificates, Identifiers & Profiles
2. Click Keys in the sidebar
3. Click the add button **(+)** in the top left
4. Enter a unique name for the key
5. Select the checkbox next to "Apple Push Notification service"
6. Click Continue
7. Configure APNs:
   - Click Configure next to "Apple Push Notification service"
   - Choose the environment (Development or Production)
   - Select the key type (Team Scoped or Topic Specific)
   - For Topic Specific keys, select the associated topics
8. Review and confirm the configuration
9. Download the key file (`.p8` extension)

**Important**: Save both the Key ID (10-character string) and the `.p8` file securely. You won't be able to download the key again, and you'll need both for authentication.

###### 6.2 Creating and Encrypting JSON Token

When sending requests to APNs, you need to sign your token data as a JWT using your private key. The token must include:

| Key | Value | Description |
|-----|-------|-------------|
| `alg` | `ES256` | The encryption algorithm (APNs only supports ES256) |
| `kid` | `string` | Your 10-character Key ID from Apple Developer account |
| `iss` | `string` | Your 10-character Team ID used for pass creation |
| `iat` | `number` | Unix timestamp (seconds) when the token was generated |

The token is divided into:
- Header: Contains `alg` and `kid`
- Claims: Contains `iss` and `iat`

**Note**: APNs will reject tokens older than one hour, returning an `ExpiredProviderToken (403)` error.

After encrypting your resulting JSON you attach the token to your notification request header:
```
authorization = bearer eyAia2lkIjogIjhZTDNHM1JSWDciIH0.eyAiaXNzIjogIkM4Nk5WOUpYM0QiLCAiaWF0IjogIjE0NTkxNDM1ODA2NTAiIH0.MEYCIQDzqyahmH1rz1s-LFNkylXEa2lZ_aOCX4daxxTZkVEGzwIhALvkClnx5m5eAT6Lxw7LZtEQcH6JENhJTMArwLf3sXwi
```

###### 6.3 Sending Push Notifications

When sending notifications to APNs, you need to include specific headers:

| Header field | Required | Description |
|--------------|----------|-------------|
| `:method` | Yes | Must be `POST` |
| `:path` | Yes | `/3/device/<device_token>` |
| `authorization` | Yes | `bearer <provider_token>` |
| `apns-push-type` | Yes* | Must match notification payload |
| `apns-id` | No | UUID for notification tracking |
| `apns-expiration` | No | Unix timestamp for notification validity |
| `apns-priority` | No | Notification priority (1, 5, or 10) |
| `apns-topic` | Yes | For pass notifications, this must be your `passTypeIdentifier` (e.g., `pass.com.example.app`) |
| `apns-collapse-id` | No | ID for merging multiple notifications |

*Required for watchOS 6+, recommended for other platforms

Here's an example implementation:

```typescript
const fs = require("fs");
const http2 = require("http2");
const jwt = require("jsonwebtoken");

async function sendApplePushNotification(deviceToken, payload = {}) { // Empty payload, as necessary (see apple documentation)
  // Create JWT token
  const tokenData = {
    header: {
      alg: "ES256",
      kid: process.env.APPLE_KEY_ID,
    },
    payload: {
      iss: process.env.APPLE_TEAM_ID,
      iat: Math.floor(Date.now() / 1000), // EPOCH time
    },
  };

  // Load certificates and private key
  const privateKey = fs.readFileSync("./.certificates/AuthKey_ABC123DEF1.p8");
  const options = {
    cert: fs.readFileSync("./.certificates/signerCert.pem"),
    key: fs.readFileSync("./.certificates/signerKey.pem"),
    ca: fs.readFileSync("./.certificates/wwdr.pem"),
    passphrase: process.env.PASS_PHRASE,
  };

  // Sign the token
  const encodedToken = jwt.sign(tokenData.payload, privateKey, {
    algorithm: "ES256",
    header: tokenData.header,
  });

  // Set up request headers
  const headers = {
    ":method": "POST",
    ":path": `/3/device/${deviceToken}`,
    authorization: `bearer ${encodedToken}`,
    "apns-push-type": "background",
    "apns-expiration": "0",
    "apns-priority": "10",
    "apns-topic": process.env.PASS_TYPE_IDENTIFIER, // Must match the passTypeIdentifier used when creating the pass
    "Content-Type": "application/json",
  };

  // Create HTTP/2 client
  const client = http2.connect("https://api.push.apple.com");

  // Handle connection errors
  client.on("error", (error) => {
    console.error("Client connection error:", error);
  });

  // Wait for connection
  const connectPromise = new Promise((resolve, reject) => {
    client.on("connect", resolve);
    client.on("error", reject);
  });

  await connectPromise;

  // Send request
  const req = client.request(headers, options);
  req.setEncoding("utf8");
  req.write(JSON.stringify(payload));
  req.end();

  // Handle response
  const responsePromise = new Promise((resolve, reject) => {
    req.on("response", resolve);
    req.on("data", () => {});
    req.on("end", () => client.close());
    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    // Set timeout
    req.setTimeout(10000, () => {
      console.error("Request timed out");
      req.close();
      reject(new Error("Request timed out"));
    });

    // Handle socket events
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
```

###### 6.4 Getting List of Updatable Passes

After APNs delivers the push notification, the device will request a list of passes that need updating. Implement this endpoint:

```
GET https://yourpasshost.example.com/v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}?passesUpdatedSince={previousLastUpdated}
```

The endpoint should:
1. Authenticate the request
2. Find passes registered for the device
3. Filter passes updated since `previousLastUpdated`
4. Return an array of `serialNumbers` and the most recent `lastUpdated` timestamp
5. Return `204` if no updates are available

Example implementation:

```typescript
export const GET = async (request: NextRequest, { params }: { params: PathParams }): Promise<Response> => {
  const { deviceLibraryIdentifier, passTypeIdentifier } = params;
  const authHeader = request.headers.get("Authorization");
  const passesUpdatedSince = request.nextUrl.searchParams.get("passesUpdatedSince");

  if (authHeader !== `ApplePass ${process.env.AUTH_TOKEN}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find passes for the device
    const passes = await Passes.find(deviceLibraryIdentifier, passTypeIdentifier);
    
    // Get serial numbers and latest update time
    const serialNumbers = passes.map(pass => pass.serialNumber);
    const lastUpdated = Math.max(...passes.map(pass => 
      new Date(pass.lastUpdateTag).getTime() / 1000
    ));

    // Check if updates are needed
    if (passesUpdatedSince) {
      const previousUpdate = new Date(passesUpdatedSince).getTime() / 1000;
      if (lastUpdated <= previousUpdate) {
        return new NextResponse(null, { status: 204 });
      }
    }

    // Return updated passes
    return NextResponse.json({
      serialNumbers,
      lastUpdated: lastUpdated.toString()
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
```

## Conclusion

Building a web service for Apple Wallet passes is a complex but rewarding endeavor. While the initial setup requires careful attention to certificates, endpoints, and push notifications, the end result provides a seamless experience for your users.

The most challenging aspects of this implementation are:
- Managing device registrations and updates
- Handling push notifications reliably
- Maintaining security across all endpoints

However, once implemented, you'll have a robust system that can handle various types of passes, from loyalty cards to event tickets, with real-time updates and automatic synchronization.

Remember to stay updated with Apple's documentation and test your implementation regularly across different iOS versions. The effort you put into building this system will pay off in the form of enhanced user engagement and satisfaction.

---

*Note: This article is based on the author's experience and research. For the most up-to-date information, always refer to the official Apple documentation.*

