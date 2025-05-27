require('dotenv').config({ path: '.env.local' });
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
		programName: "Hunter License",
		organizationName: "Hunter Association",
		logoUri:
			"https://static.wikia.nocookie.net/hunterxhunter/images/0/05/Hunter_Association_logo.png/revision/latest?cb=20180405075402",
		qrCodeLink: "https://static1.srcdn.com/wordpress/wp-content/uploads/2022/07/Hunter-X-Hunter-Gon-Freecs-Piece-Sign.jpg?q=70&fit=contain&w=1200&h=628&dpr=1",
		accountId: "SQ-12345A",
		fullName: "Gon Freecss",
		authenticationToken: "1234567890123456",
		stampImageUri:
			"https://images8.alphacoders.com/124/1243824.png"
	};

  // Create the pass
  const pass = new StampPass();
  await pass.createPass("1234", passProperties);
}

main().catch(console.error);
