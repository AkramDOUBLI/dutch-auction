const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Déploiement avec l'adresse :", deployer.address);

    const DutchAuction = await ethers.getContractFactory("DutchAuction");
    const auctionContract = await DutchAuction.deploy();
    await auctionContract.waitForDeployment();

    console.log("Smart Contract déployé à :", auctionContract.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
