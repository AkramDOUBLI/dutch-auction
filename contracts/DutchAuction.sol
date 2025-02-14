// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "hardhat/console.sol";

contract DutchAuction {
    struct Article {
        string name;
        uint startingPrice;
        uint reservePrice;
        uint priceDecrement;
        uint timeInterval;
        uint startTime;
        bool sold;
        address buyer;
        uint finalPrice;
        uint purchaseTime;
    }

    struct Auction {
        address seller;
        Article[] articles;
        uint currentArticleIndex;
        bool auctionStarted;
        bool auctionEnded;
    }

    mapping(uint => Auction) public auctions;
    uint public auctionCount;

    event AuctionCreated(uint auctionId, address seller);
    event AuctionStarted(uint auctionId);
    event ArticleAdded(uint auctionId, string name);
    event ArticleSold(uint auctionId, uint articleIndex, address buyer, uint finalPrice);
    event AuctionEnded(uint auctionId);

    modifier onlySeller(uint auctionId) {
        require(msg.sender == auctions[auctionId].seller, unicode"Seul le vendeur peut exécuter cette action");
        _;
    }

    // Créer une nouvelle enchère (VIDE)
    function createAuction() public {
        auctionCount++;
        auctions[auctionCount].seller = msg.sender;
        auctions[auctionCount].currentArticleIndex = 0;
        auctions[auctionCount].auctionStarted = false;
        auctions[auctionCount].auctionEnded = false;

        emit AuctionCreated(auctionCount, msg.sender);
        console.log(unicode"Nouvelle enchère créée avec l'ID :", auctionCount);
    }

    // Ajouter un article à une enchère spécifique
    function addArticle(
        uint auctionId,
        string memory name,
        uint startingPrice,
        uint reservePrice,
        uint priceDecrement,
        uint timeInterval
    ) public onlySeller(auctionId) {
        require(!auctions[auctionId].auctionEnded, unicode"L'enchère est terminée");
        require(!auctions[auctionId].auctionStarted, unicode"Impossible d'ajouter des articles après le début de l'enchère");

        auctions[auctionId].articles.push(Article({
            name: name,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            priceDecrement: priceDecrement,
            timeInterval: timeInterval,
            startTime: 0,
            sold: false,
            buyer: address(0),
            finalPrice: 0,
            purchaseTime: 0
        }));

        emit ArticleAdded(auctionId, name);
        console.log(unicode"Article ajouté dans l'enchère", auctionId, unicode":", name);
    }

    // Démarrer l’enchère pour le premier article
    function startAuction(uint auctionId) public onlySeller(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(!auction.auctionStarted, unicode"L'enchère a déjà commencé");
        require(auction.articles.length > 0, unicode"Aucun article disponible");

        auction.auctionStarted = true;
        auction.currentArticleIndex = 0;
        auction.articles[0].startTime = block.timestamp; // Commence avec le premier article

        emit AuctionStarted(auctionId);
        console.log(unicode"Enchère", auctionId, unicode"démarrée !");
    }

    // Obtenir le prix actuel de l'article en cours**
    function getCurrentPrice(uint auctionId, uint articleIndex) public view returns (uint) {
        Auction storage auction = auctions[auctionId];
        require(articleIndex < auction.articles.length, unicode"Article invalide");

        Article storage article = auction.articles[articleIndex];

        if (article.sold) {
            return article.finalPrice;
        }

        if (!auction.auctionStarted || article.startTime == 0) {
            return article.startingPrice;
        }

        uint timeElapsed = (block.timestamp - article.startTime) / article.timeInterval;
        uint priceReduction = timeElapsed * article.priceDecrement;
        uint currentPrice = article.startingPrice > priceReduction ? article.startingPrice - priceReduction : article.reservePrice;

        return currentPrice;
    }

    //  Acheter l'article en cours
    function buy(uint auctionId, uint articleIndex) public payable {
        Auction storage auction = auctions[auctionId];
        require(auction.auctionStarted, unicode"L'enchère n'a pas encore commencé");
        require(articleIndex < auction.articles.length, unicode"Article invalide");

        Article storage article = auction.articles[articleIndex];
        require(!article.sold, unicode"Cet article a déjà été vendu");

        uint currentPrice = getCurrentPrice(auctionId, articleIndex);
        require(msg.value >= currentPrice, unicode"Fonds insuffisants");

        // Marquer l'article comme vendu
        article.sold = true;
        article.buyer = msg.sender;
        article.finalPrice = currentPrice;
        article.purchaseTime = block.timestamp;
        payable(auction.seller).transfer(msg.value);

        emit ArticleSold(auctionId, articleIndex, msg.sender, currentPrice);
        console.log(unicode"Article vendu :", article.name);

        // Vérifier si l'article acheté est bien celui en cours
        if (articleIndex == auction.currentArticleIndex) {
            // Passer à l'article suivant si disponible
            auction.currentArticleIndex++;
            if (auction.currentArticleIndex < auction.articles.length) {
                auction.articles[auction.currentArticleIndex].startTime = block.timestamp;
            } else {
                auction.auctionEnded = true;
                emit AuctionEnded(auctionId);
                console.log(unicode"L'enchère", auctionId, unicode"s'est terminée !");
            }
        }
    }

    // Vérifier si l'enchère est terminée
    function isAuctionEnded(uint auctionId) public view returns (bool) {
        return auctions[auctionId].auctionEnded;
    }

   // Vérifier si l'enchère doit avancer ou se clôturer
    function checkAuctionStatus(uint auctionId) public {
        Auction storage auction = auctions[auctionId];

        // Ne rien faire si l'enchère est déjà terminée
        if (auction.auctionEnded) {
            return;
        }

        require(auction.auctionStarted, unicode"L'enchère n'a pas encore commencé");
        require(auction.currentArticleIndex < auction.articles.length, unicode"Aucun article actif");

        Article storage article = auction.articles[auction.currentArticleIndex];

        // Obtenir le prix actuel
        uint currentPrice = getCurrentPrice(auctionId, auction.currentArticleIndex);

        // ✅ Si le prix actuel atteint le prix réservé
        if (currentPrice == article.reservePrice && !article.sold) {
            console.log(unicode"⚠Prix réservé atteint pour l'article:", auction.currentArticleIndex);

            // ✅ Passer à l'article suivant s'il en reste
            if (auction.currentArticleIndex + 1 < auction.articles.length) {
                auction.currentArticleIndex++;
                auction.articles[auction.currentArticleIndex].startTime = block.timestamp;
            } else {
                // ✅ Clôturer l'enchère si c'était le dernier article
                auction.auctionEnded = true;
                emit AuctionEnded(auctionId);
                console.log(unicode"L'enchère", auctionId, unicode"s'est terminée !");
            }
        }
    }


// Obtenir le nombre total d'articles dans une enchère
    function getArticleCount(uint auctionId) public view returns (uint) {
        return auctions[auctionId].articles.length;
    }

    // Fonction pour récupérer un article spécifique d'une enchère
    function getArticle(uint auctionId, uint articleIndex) public view returns (
        string memory name,
        uint startingPrice,
        uint reservePrice,
        uint priceDecrement,
        uint timeInterval,
        uint startTime,
        bool sold,
        address buyer,
        uint finalPrice,
        uint purchaseTime
    ) {
        require(articleIndex < auctions[auctionId].articles.length, unicode"Article non trouvé");

        Article storage article = auctions[auctionId].articles[articleIndex];
        return (
            article.name,
            article.startingPrice,
            article.reservePrice,
            article.priceDecrement,
            article.timeInterval,
            article.startTime,
            article.sold,
            article.buyer,
            article.finalPrice,
            article.purchaseTime
        );
    }

}
