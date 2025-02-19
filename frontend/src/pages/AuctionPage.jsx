import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getContract } from "../utils/contract";
import "../styles/AuctionPage.css";

function AuctionPage() {
    const { id } = useParams();
    const [userAddress, setUserAddress] = useState(null);
    const [auction, setAuction] = useState(null);
    const [articles, setArticles] = useState([]);
    const [isSeller, setIsSeller] = useState(false);
    const [loading, setLoading] = useState(false);

    // Récupérer les articles de l'enchère
    const loadArticles = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const auctionData = await contract.auctions(id);
            setAuction({
                id,
                seller: auctionData.seller,
                currentArticleIndex: Number(auctionData.currentArticleIndex),
                auctionStarted: auctionData.auctionStarted,
                auctionEnded: auctionData.auctionEnded,
            });

            setIsSeller(userAddress?.toLowerCase() === auctionData.seller.toLowerCase());

            console.log("currentIndex: ", Number(auctionData.currentArticleIndex));

            const articleCount = await contract.getArticleCount(id);
            let articlesList = [];
            for (let i = 0; i < articleCount; i++) {
                const article = await contract.getArticle(id, i);
                const currentPrice = await contract.getCurrentPrice(id, i);

                console.log(`Article ${i} | StartTime: ${article[5]} | Prix Actuel: ${currentPrice}`);

                articlesList.push({
                    name: article[0],
                    startingPrice: article[1].toString(),
                    reservePrice: article[2].toString(),
                    priceDecrement: article[3].toString(),
                    timeInterval: article[4].toString(),
                    currentPrice: currentPrice.toString(),
                    sold: article[6],
                    buyer: article[7],
                    finalPrice: article[8].toString(),
                });
            }
            setArticles(articlesList);
        } catch (error) {
            console.error("Erreur lors du chargement des articles :", error);
        }
    };

    const checkAuctionStatus = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const auctionData = await contract.auctions(id);
            // Si l'enchère est déjà clôturée, on arrête ici
            if (auctionData.auctionEnded || !auctionData.auctionStarted) {
                console.log("L'enchère est soit clôturée, soit pas encore commencée. Arrêt du check.");
                return;
            }

            const currentArticleIndex = Number(auctionData.currentArticleIndex);
            const article = await contract.getArticle(id, currentArticleIndex);
            const currentPrice = await contract.getCurrentPrice(id, currentArticleIndex);

            // Si le prix actuel a atteint le prix réservé et que l'article n'est pas vendu
            if (Number(currentPrice) === Number(article[2]) && article[6] === false) {
                console.log("Le prix réservé est atteint, mise à jour de l'enchère...");

                // Passer à l'article suivant ou clôturer l'enchère
                const tx = await contract.checkAuctionStatus(id);
                await tx.wait();
                alert("On passe à l'article suivant !")
                loadArticles();
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de l'état de l'enchère :", error);
        }
    };

    // Actualiser le prix en temps réel
    useEffect(() => {
        const interval = setInterval(() => {
            loadArticles();
            checkAuctionStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [userAddress]);


    // Acheter un article
    const buyArticle = async (index) => {
        const contract = await getContract();
        if (!contract) return;

        try {
            setLoading(true);
            const priceToPay = articles[index].currentPrice;
            console.log("Prix actuel à payer:", priceToPay.toString());

            const tx = await contract.buy(id, index, { value: priceToPay });
            await tx.wait();
            alert("Article acheté avec succès !");
            loadArticles();
        } catch (error) {
            console.error("Erreur lors de l'achat :", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        async function fetchUserAddress() {
            const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
            setUserAddress(account);
        }
        fetchUserAddress();
    }, []);

    useEffect(() => {
        if (userAddress) {
            loadArticles();
        }
    }, [userAddress]);

    return (
        <div className="auction-container">
            <h1>Enchère {id}</h1>
            <p className="auction-details">Vendeur : {auction?.seller}</p>
            <p className="auction-details">Acheteur : {userAddress}</p>

            <h2>Liste des articles</h2>
            {articles.length > 0 ? (
                <table className="auction-table">
                    <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prix de départ</th>
                        <th>Prix réservé</th>
                        <th>Prix actuel</th>
                        <th>Modification du prix</th>
                        <th>Intervalle de modification du prix (sec)</th>
                        <th>Statut</th>
                        {!isSeller && <th>Action</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {articles.map((article, index) => (
                        <tr key={index} className={auction.auctionEnded || !auction.auctionStarted || index !== auction.currentArticleIndex ? "article-inactive" : ""}>
                            <td>{article.name}</td>
                            <td>{article.startingPrice} ETH</td>
                            <td>{article.reservePrice} ETH</td>
                            <td>{article.currentPrice} ETH</td>
                            <td>{article.priceDecrement} ETH</td>
                            <td>{article.timeInterval} sec</td>
                            <td>{article.sold ? `Vendu à ${article.buyer} pour ${article.finalPrice} ETH` : auction.auctionEnded ? "Non vendu" : "Disponible"}
                            </td>
                            {!isSeller &&
                                !article.sold &&
                                index === auction.currentArticleIndex &&
                                auction.auctionStarted &&
                                !auction.auctionEnded && (
                                    <td>
                                        <button className="auction-btn buy-btn" onClick={() => buyArticle(index)} disabled={loading}>
                                            {loading ? "Achat..." : "Acheter"}
                                        </button>
                                    </td>
                                )}

                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                <p>Aucun article dans cette enchère.</p>
            )}

            {isSeller && !auction.auctionStarted && (
                <Link to={`/auction/${id}/add-article`} className="add-article-btn">
                    Ajouter un article
                </Link>
            )}
        </div>

    );
}

export default AuctionPage;
