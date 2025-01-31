const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DutchAuction", function () {
    let auction, owner, buyer1, buyer2;

    beforeEach(async function () {
        [owner, buyer1, buyer2] = await ethers.getSigners();
        const DutchAuction = await ethers.getContractFactory("DutchAuction");
        auction = await DutchAuction.deploy();
        await auction.waitForDeployment();

        // Ajouter des articles à l'enchère
        await auction.addArticle("Article 1", 1000, 500, 50, 30);
        await auction.addArticle("Article 2", 2000, 1000, 100, 30);
    });

    it("Ajoute correctement des articles", async function () {
        const article1 = await auction.articles(0);
        const article2 = await auction.articles(1);

        expect(article1.name).to.equal("Article 1");
        expect(article1.startingPrice).to.equal(1000);
        expect(article2.name).to.equal("Article 2");
        expect(article2.startingPrice).to.equal(2000);
    });

    it("Vérifie le prix actuel après un certain temps", async function () {
        let price = await auction.getCurrentPrice();
        console.log("Prix actuel de l'article en cours:", price.toString());
        expect(price).to.equal(1000);
    });

    it("Permet d'acheter un article au prix actuel", async function () {
        await auction.connect(buyer1).buy({ value: 1000 });
        const article1 = await auction.articles(0);

        expect(article1.sold).to.be.true;
        expect(article1.buyer).to.equal(buyer1.address);
    });

    it("Passe à l'article suivant après la vente", async function () {
        await auction.connect(buyer1).buy({ value: 1000 });

        let currentPrice = await auction.getCurrentPrice();
        console.log("Prix actuel du deuxième article:", currentPrice.toString());
        expect(currentPrice).to.equal(2000);
    });

    it("Termine l'enchère après le dernier article vendu", async function () {
        await auction.connect(buyer1).buy({ value: 1000 });
        await auction.connect(buyer2).buy({ value: 2000 });

        let auctionEnded = await auction.auctionEnded();
        expect(auctionEnded).to.be.true;
    });
});
