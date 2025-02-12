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
        uint currentPrice;
        bool sold;
        address buyer;
    }

    struct Auction {
        address seller;
        Article[] articles;
        uint currentArticleIndex;
        bool auctionEnded;
    }

    mapping(uint => Auction) public auctions;
    uint public auctionCount;

    event AuctionCreated(uint auctionId, address seller);
    event ArticleAdded(uint auctionId, string name);
    event ArticleSold(uint auctionId, uint articleIndex, address buyer, uint finalPrice);
    event AuctionEnded(uint auctionId);

    modifier onlySeller(uint auctionId) {
        require(msg.sender == auctions[auctionId].seller, unicode"Seul le vendeur peut exécuter cette action");
        _;
    }

    // Créer une nouvelle enchère
    function createAuction() public {
        auctionCount++;

        // Créer une enchère vide et ajouter le vendeur
        auctions[auctionCount].seller = msg.sender;
        auctions[auctionCount].currentArticleIndex = 0;
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

        auctions[auctionId].articles.push(Article({
            name: name,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            priceDecrement: priceDecrement,
            timeInterval: timeInterval,
            startTime: block.timestamp,
            currentPrice: startingPrice,
            sold: false,
            buyer: address(0)
        }));

        emit ArticleAdded(auctionId, name);
        console.log(unicode"Article ajouté dans l'enchère", auctionId, unicode":", name);
    }

    function updateArticlePrice(uint auctionId, uint articleIndex) public {
        Auction storage auction = auctions[auctionId];
        require(articleIndex < auction.articles.length, unicode"Article invalide");

        Article storage article = auction.articles[articleIndex];

        uint timeElapsed = (block.timestamp - article.startTime) / article.timeInterval;
        uint priceReduction = timeElapsed * article.priceDecrement;
        uint newPrice = article.startingPrice > priceReduction ? article.startingPrice - priceReduction : article.reservePrice;

        article.currentPrice = newPrice;

        console.log(unicode"Mise à jour du prix : Article", articleIndex, unicode"| Nouveau prix :", newPrice);
    }

    // Acheter un article spécifique dans une enchère
    function buy(uint auctionId, uint articleIndex) public payable {
        Auction storage auction = auctions[auctionId];
        require(articleIndex < auction.articles.length, unicode"Article invalide");

        Article storage article = auction.articles[articleIndex];

        require(!article.sold, unicode"Cet article a déjà été vendu");

        // Mettre à jour le prix avant l'achat
        updateArticlePrice(auctionId, articleIndex);

        uint currentPrice = article.currentPrice;
        require(msg.value >= currentPrice, unicode"💰 Fonds insuffisants");
        require(block.timestamp >= article.startTime, unicode"⏳ L'enchère n'a pas encore commencé");

        article.sold = true;
        article.buyer = msg.sender;
        payable(auction.seller).transfer(msg.value);

        emit ArticleSold(auctionId, articleIndex, msg.sender, currentPrice);
        console.log(unicode"Article vendu dans l'enchère", auctionId, unicode"à l'acheteur :", msg.sender);

        // Vérifier si tous les articles sont vendus pour terminer l'enchère
        bool allSold = true;
        for (uint i = 0; i < auction.articles.length; i++) {
            if (!auction.articles[i].sold) {
                allSold = false;
                break;
            }
        }

        if (allSold) {
            auction.auctionEnded = true;
            emit AuctionEnded(auctionId);
            console.log(unicode"L'enchère", auctionId, unicode"s'est terminée !");
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
        uint currentPrice,
        bool sold,
        address buyer
    ) {
        require(articleIndex < auctions[auctionId].articles.length, unicode"❌ Article non trouvé");

        Article storage article = auctions[auctionId].articles[articleIndex];
        return (
            article.name,
            article.startingPrice,
            article.reservePrice,
            article.priceDecrement,
            article.timeInterval,
            article.startTime,
            article.currentPrice,
            article.sold,
            article.buyer
        );
    }

}
