require("dotenv").config();
const { LoyaltyPass } = require("./loyaltyPass");
const { StampPass } = require("./stampPass");

const PassTypeEnum = {
  STAMPS: "<stamps>",
  POINTS: "<points>",
  SIMPLE: "<simple>",
};

async function main() {
  // Properties for the loyalty pass
  const passProperties = {
    programName: "My program name",
    organizationName: "My organization",
    fullName: "Gon Freecss",
    logoUri:
      "https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg?t=st=1734533689~exp=1734537289~hmac=40f57aec2d4cb95a9fc0bd8e8f5e3bd279ac78ea24ff326d4a8e69d241e81937&w=1380",
    accountId: "SQ-12345A",
    qrCodeLink: "https://www.example.com/",
    points: 100,
    backgroundColor: "#000000",
    stampImageUri:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1032&h=336",
    authenticationToken: "1234567890123456",
    passType: PassTypeEnum.STAMPS,
    deviceToken:
      "p123ed47asd5c4123asdf83f7b3621238bad84d9cas2d2306ac5cc5b12358asd3",
  };

  // Create the pass
  const pass = new StampPass();
  await pass.createPass("1234", passProperties);
}

main().catch(console.error);
