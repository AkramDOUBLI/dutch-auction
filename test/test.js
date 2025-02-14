const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DutchAuction", function () {
    let auctionContract, owner, seller, buyer1, buyer2;

    beforeEach(async function () {
        [owner, seller, buyer1, buyer2] = await ethers.getSigners();
        const DutchAuction = await ethers.getContractFactory("DutchAuction");
        auctionContract = await DutchAuction.deploy();
        await auctionContract.waitForDeployment();

        // Création d'une enchère par le vendeur
        await auctionContract.connect(seller).createAuction();
    });

    it("Doit créer une enchère correctement", async function () {
        const auction = await auctionContract.auctions(1);
        expect(auction.seller).to.equal(seller.address);
        expect(auction.auctionStarted).to.equal(false);
        expect(auction.auctionEnded).to.equal(false);
    });

    it("Ajoute des articles correctement", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).addArticle(1, "Article 2", 2000, 1000, 100, 30);

        const articleCount = await auctionContract.getArticleCount(1);
        expect(articleCount).to.equal(2);

        const article1 = await auctionContract.getArticle(1, 0);
        expect(article1[0]).to.equal("Article 1");
        expect(article1[1]).to.equal(1000);
    });

    it("Empêche d'ajouter des articles après le démarrage", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).startAuction(1);

        await expect(
            auctionContract.connect(seller).addArticle(1, "Article 2", 2000, 1000, 100, 30)
        ).to.be.revertedWith("Impossible d'ajouter des articles après le début de l'enchère");
    });

    it("Démarre l'enchère correctement", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).startAuction(1);

        const auction = await auctionContract.auctions(1);
        expect(auction.auctionStarted).to.equal(true);
    });

    it("Met à jour le prix des articles au fil du temps", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 10);
        await auctionContract.connect(seller).startAuction(1);

        await ethers.provider.send("evm_increaseTime", [20]); // Avance de 20 secondes
        await ethers.provider.send("evm_mine");

        const currentPrice = await auctionContract.getCurrentPrice(1, 0);
        expect(currentPrice).to.equal(900);
    });

    it("Permet d'acheter un article au prix actuel", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).startAuction(1);

        const price = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: price });

        const article1 = await auctionContract.getArticle(1, 0);
        expect(article1[6]).to.equal(true); // Sold = true
        expect(article1[7]).to.equal(buyer1.address);
    });

    it("Passe automatiquement à l'article suivant après un achat", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).addArticle(1, "Article 2", 2000, 1000, 100, 30);
        await auctionContract.connect(seller).startAuction(1);

        const price = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: price });

        const auction = await auctionContract.auctions(1);
        expect(auction.currentArticleIndex).to.equal(1);
    });

    it("Clôture l'enchère après la vente du dernier article", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).addArticle(1, "Article 2", 2000, 1000, 100, 30);
        await auctionContract.connect(seller).startAuction(1);

        let price = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: price });

        price = await auctionContract.getCurrentPrice(1, 1);
        await auctionContract.connect(buyer2).buy(1, 1, { value: price });

        const auctionEnded = await auctionContract.isAuctionEnded(1);
        expect(auctionEnded).to.equal(true);
    });

    it("Clôture automatiquement une enchère si le dernier article atteint le prix réservé", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 10);
        await auctionContract.connect(seller).startAuction(1);

        await ethers.provider.send("evm_increaseTime", [100]); // Avance de 100 secondes
        await ethers.provider.send("evm_mine");

        await auctionContract.checkAuctionStatus(1);

        const auctionEnded = await auctionContract.isAuctionEnded(1);
        expect(auctionEnded).to.equal(true);
    });

    it("Vérifie que auctionEnded est bien true après le dernier article", async function () {
        await auctionContract.connect(seller).createAuction();
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).addArticle(1, "Article 2", 2000, 1000, 100, 30);
        await auctionContract.connect(seller).startAuction(1);

        let price = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: price });

        price = await auctionContract.getCurrentPrice(1, 1);
        await auctionContract.connect(buyer2).buy(1, 1, { value: price });

        const auctionEnded = await auctionContract.isAuctionEnded(1);
        expect(auctionEnded).to.equal(true);
    });

    it("Vérifie que currentArticleIndex est mis à jour après un achat", async function () {
        await auctionContract.connect(seller).createAuction();
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).addArticle(1, "Article 2", 2000, 1000, 100, 30);
        await auctionContract.connect(seller).startAuction(1);

        const price = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: price });

        const auction = await auctionContract.auctions(1);
        expect(auction.currentArticleIndex).to.equal(1);
    });

    it("Empêche l'achat d'un article déjà vendu", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).startAuction(1);

        const price = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: price });

        await expect(
            auctionContract.connect(buyer2).buy(1, 0, { value: price })
        ).to.be.revertedWith("Cet article a déjà été vendu");
    });

    it("Stocke la date d'achat correcte après l'achat d'un article", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).startAuction(1);

        const price = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: price });

        const article = await auctionContract.getArticle(1, 0);
        expect(article[9]).to.be.greaterThan(0); // purchaseTime doit être défini
    });

    it("Transfère correctement le montant au vendeur après l'achat", async function () {
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);
        await auctionContract.connect(seller).startAuction(1);

        const sellerInitialBalance = await ethers.provider.getBalance(seller.address);
        console.log("Balance initiale du vendeur:", sellerInitialBalance.toString());

        const priceToPay = await auctionContract.getCurrentPrice(1, 0);
        await auctionContract.connect(buyer1).buy(1, 0, { value: priceToPay });

        const sellerFinalBalance = await ethers.provider.getBalance(seller.address);
        console.log("Balance finale du vendeur:", sellerFinalBalance.toString());

        // Vérifier que le vendeur a bien reçu exactement `priceToPay`
        expect(sellerFinalBalance).to.equal(sellerInitialBalance + priceToPay);
    });

    it("Empêche un non-vendeur de démarrer une enchère", async function () {
        await auctionContract.connect(seller).createAuction();
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);

        await expect(
            auctionContract.connect(buyer1).startAuction(1)
        ).to.be.revertedWith("Seul le vendeur peut exécuter cette action");
    });

    it("Empêche un acheteur d'acheter un article avant le début de l'enchère", async function () {
        await auctionContract.connect(seller).createAuction();
        await auctionContract.connect(seller).addArticle(1, "Article 1", 1000, 500, 50, 30);

        await expect(
            auctionContract.connect(buyer1).buy(1, 0, { value: 1000 })
        ).to.be.revertedWith("L'enchère n'a pas encore commencé");
    });


});
