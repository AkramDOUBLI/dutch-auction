// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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
    }

    address public seller;
    Article[] public articles;
    uint public currentArticleIndex = 0;
    bool public auctionEnded = false;

    event ArticleSold(uint indexed articleIndex, address buyer, uint finalPrice);
    event AuctionEnded();

    modifier onlySeller() {
        require(msg.sender == seller, unicode"Seul le vendeur peut exécuter cette action");
        _;
    }

    constructor() {
        seller = msg.sender;
    }

    // Ajouter un article à la liste
    function addArticle(
        string memory name,
        uint startingPrice,
        uint reservePrice,
        uint priceDecrement,
        uint timeInterval
    ) public onlySeller {
        require(startingPrice > reservePrice, unicode"Le prix de départ doit être supérieur au prix réservé");
        require(priceDecrement > 0, unicode"La diminution du prix doit être positive");

        articles.push(Article({
            name: name,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            priceDecrement: priceDecrement,
            timeInterval: timeInterval,
            startTime: block.timestamp,
            sold: false,
            buyer: address(0)
        }));
    }

    // Obtenir le prix actuel de l'article en cours
    function getCurrentPrice() public view returns (uint) {
        require(currentArticleIndex < articles.length, unicode"Aucun article disponible");

        Article storage article = articles[currentArticleIndex];
        uint timeElapsed = (block.timestamp - article.startTime) / article.timeInterval;
        uint priceReduction = timeElapsed * article.priceDecrement;
        uint currentPrice = article.startingPrice > priceReduction ? article.startingPrice - priceReduction : article.reservePrice;

        return currentPrice > article.reservePrice ? currentPrice : article.reservePrice;
    }

    // Acheter l'article au prix actuel
    function buy() public payable {
        require(currentArticleIndex < articles.length, unicode"Aucun article disponible");
        Article storage article = articles[currentArticleIndex];

        require(!article.sold, unicode"Cet article a déjà été vendu");
        uint currentPrice = getCurrentPrice();
        require(msg.value >= currentPrice, unicode"Fonds insuffisants");
        require(block.timestamp >= articles[currentArticleIndex].startTime, unicode"L'enchère n'a pas encore commencé");
        article.sold = true;
        article.buyer = msg.sender;
        payable(seller).transfer(msg.value);

        emit ArticleSold(currentArticleIndex, msg.sender, currentPrice);

        // Passer à l'article suivant si disponible
        currentArticleIndex++;

        // Si c'était le dernier article, l'enchère est terminée
        if (currentArticleIndex >= articles.length) {
            auctionEnded = true;
            emit AuctionEnded();
        }
    }
}
