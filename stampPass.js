require("dotenv").config();
const { PKPass } = require("passkit-generator");
const axios = require("axios");
const fs = require("fs");
const { sendApplePushNotification } = require("./pushNotification");

/**
 * @typedef {object} StampPassProperties
 * @property {string} programName
 * @property {string} organizationName
 * @property {string} logoUri
 * @property {string} qrCodeLink
 * @property {string} accountId
 * @property {number} points
 * @property {string} fullName
 * @property {string} authenticationToken
 * @property {string} deviceToken
 * @property {string?} backgroundColor
 * @property {string?} stampImageUri
 */

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
    };
  }
  /**
   * Create a stamp pass.
   *
   * @param {string} serialNumber - The unique serial number of the pass.
   * @param {StampPassProperties} stampPassProperties - The properties for the stamp pass to create.
   *
   * @returns {Promise<void>}
   */
  async createPass(serialNumber, stampPassProperties) {
    // First we get the image from the URL
    const logoResp = await axios.get(stampPassProperties.logoUri, {
      responseType: "arraybuffer",
    });
    // Then we convert the image to a buffer
    const buffer = Buffer.from(logoResp.data, "uft-8");

    const stampImageResp = await axios.get(stampPassProperties.stampImageUri, {
      responseType: "arraybuffer",
    });
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

    // We set the barcodes and fields of the pass
    pass.setBarcodes({
      message: stampPassProperties.qrCodeLink,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: stampPassProperties.accountId,
    });

    // We set the fields of the pass
    pass.secondaryFields.push({
      key: "fullName",
      label: "Name",
      value: stampPassProperties.fullName,
    });
    pass.secondaryFields.push({
      key: "accountId",
      label: "",
      value: stampPassProperties.accountId,
      textAlignment: "PKTextAlignmentRight",
    });

    const bufferPass = pass.getAsBuffer();

    // We can save the pass to the file system
    fs.writeFileSync("YourPassName.pkpass", bufferPass);
  }
}

module.exports = { StampPass };
