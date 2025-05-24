require("dotenv").config();
const { PKPass } = require("passkit-generator");
const axios = require("axios");
const fs = require("fs");


const PassTypeEnum = {
  STAMPS: "<stamps>",
  POINTS: "<points>",
  SIMPLE: "<simple>",
};

/**
 * @typedef {object} LoyaltyPassProperties
 * @property {string} programName
 * @property {string} organizationName
 * @property {string} logoUri
 * @property {string} qrCodeLink
 * @property {string} accountId
 * @property {number} points
 * @property {string} fullName
 * @property {string} authenticationToken
 * @property {string} passType
 * @property {string?} backgroundColor
 */


class LoyaltyPass {
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
   * Create a loyalty pass.
   *
   * @param {string} serialNumber - The unique serial number of the pass.
   * @param {LoyaltyPassProperties} loyaltyPassProperties - The properties for the loyalty pass to create.
   *
   * @returns {Promise<void>}
   */
  async createPass(serialNumber, loyaltyPassProperties) {
    // First we get the image from the URL
    const logoResp = await axios.get(loyaltyPassProperties.logoUri, {
      responseType: "arraybuffer",
    });
    // Then we convert the image to a buffer
    const buffer = Buffer.from(logoResp.data, "uft-8");

    // We set the background color of the pass
    const backgroundColor = loyaltyPassProperties.backgroundColor ?? "#ffffff";

    // We create the pass from the model
    const pass = await PKPass.from(
      {
        model: "./models/Custom.pass",
        certificates: {
          wwdr: this.certificates.wwdr,
          signerCert: this.certificates.signerCert,
          signerKey: this.certificates.signerKey,
          signerKeyPassphrase: this.certificates.signerKeyPassphrase,
        },
      },
      {
        authenticationToken: loyaltyPassProperties.authenticationToken,
        webServiceURL: "https://example.com/passes/",

        organizationName: loyaltyPassProperties.organizationName,
        serialNumber,
        description: loyaltyPassProperties.programName,
        logoText: loyaltyPassProperties.organizationName,
        backgroundColor: backgroundColor,
      }
    );

    // We add the images to the pass
    pass.addBuffer("logo.png", buffer);
    pass.addBuffer("logo@2x.png", buffer);
    pass.addBuffer("icon@.png", buffer);
    pass.addBuffer("icon@2x.png", buffer);

    // We set the barcode and fields of the pass
    pass.setBarcodes({
      message: loyaltyPassProperties.qrCodeLink,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: loyaltyPassProperties.accountId,
    });

    // We set the fields of the pass
    pass.primaryFields.push({
      key: "programName",
      value: loyaltyPassProperties.programName,
    });
    pass.secondaryFields.push({
      key: "fullName",
      label: "",
      value: loyaltyPassProperties.fullName,
    });
    pass.auxiliaryFields.push({
      key: "accountId",
      label: "",
      value: loyaltyPassProperties.accountId,
    });
    if (loyaltyPassProperties.passType === PassTypeEnum.POINTS) {
      pass.auxiliaryFields.push({
        key: "points",
        label: "",
        "value": LoyaltyPassProperties.points,
        textAlignment: "PKTextAlignmentRight",
      });
    }

    const bufferPass = pass.getAsBuffer();

    // We can save the pass to the file system
    fs.writeFileSync("YourPassName.pkpass", bufferPass);
  }
}

module.exports = { LoyaltyPass };
