const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Déploiement avec l'adresse :", deployer.address);

    const DutchAuction = await ethers.getContractFactory("DutchAuction");
    const auction = await DutchAuction.deploy();
    await auction.waitForDeployment();

    console.log("Smart Contract déployé à :", auction.target);

    // Ajouter des articles après le déploiement
    await auction.addArticle("Article 1", 1000, 500, 50, 30);
    await auction.addArticle("Article 2", 2000, 1000, 100, 30);
    console.log("Articles ajoutés !");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
