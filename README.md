# Apple Wallet Pass Web Service

A comprehensive guide and implementation for creating and managing Apple Wallet passes using Node.js. This project demonstrates how to build a web service that handles pass creation, distribution, and automatic updates.

For the Google Wallet implementation, check out the companion repository: [Google Wallet Passes](https://github.com/RaimundoDiaz/google-wallet-passes)

## Features

- Pass creation and customization
- Secure pass signing with Apple certificates
- Automatic pass updates via Apple Push Notification Service (APNs)
- Device registration and management
- Support for different pass types (Store Card, Generic, etc.)
- Image handling and optimization
- QR code generation

## Prerequisites

- Node.js (v14 or higher)
- Apple Developer Account
- Required certificates:
  - WWDR Certificate
  - Pass Type Certificate
  - Signer Certificate
  - APNs Authentication Key (for push notifications)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/apple-wallet-passes.git
cd apple-wallet-passes
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in `.env`:
```env
PASS_PHRASE=your_pass_phrase
WEB_SERVICE_URL=your_web_service_url
PASS_TYPE_IDENTIFIER=pass.com.your.app
TEAM_IDENTIFIER=your_team_id
APPLE_KEY_ID=your_key_id
APPLE_TEAM_ID=your_team_id
```

4. Place your certificates in the `.certificates` directory:
```
.certificates/
  ├── wwdr.pem
  ├── signerCert.pem
  ├── signerKey.pem
  └── AuthKey_ABC123DEF1.p8
```

## Project Structure

```
.
├── .certificates/          # Certificate files
├── models/                 # Pass templates
│   ├── Custom.pass/
│   └── StoreCard.pass/
├── src/
│   ├── stampPass.js       # Stamp pass implementation
│   └── main.js           # Usage example
├── .env                   # Environment variables
└── README.md             # This file
```

## Usage

### Creating a Pass

```javascript
const { StampPass } = require('./src/stampPass');

const passProperties = {
  programName: "My Program",
  organizationName: "My Organization",
  logoUri: "https://example.com/logo.png",
  qrCodeLink: "https://example.com/",
  accountId: "ACC-12345",
  fullName: "John Doe",
  authenticationToken: "1234567890123456",
  stampImageUri: "https://example.com/stamp.png"
};

const pass = new StampPass();
await pass.createPass("1234", passProperties);
```

### Setting Up Automatic Updates

1. Implement the required endpoints:
   - Device registration
   - Pass updates
   - Device unregistration
   - List of updatable passes

2. Configure APNs:
   - Set up token-based authentication
   - Implement push notification sending
   - Handle device tokens

## Documentation

For detailed documentation and implementation guides, please refer to the [article](apple_arcitle.md) in this repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Video](https://www.youtube.com/watch?v=rJZdPoXHtzI) about how to create a pass using Nodejs.
- [passkit-generator](https://github.com/alexandercerutti/passkit-generator) library.
- [Wiki](https://github.com/alexandercerutti/passkit-generator/wiki) about the passkit-generator library.
- [Apple Developer Documentation for Wallet Pass guidelines](https://developer.apple.com/documentation/walletpasses) about Wallet Passes.