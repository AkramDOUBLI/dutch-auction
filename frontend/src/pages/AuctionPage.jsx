import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getContract } from "../utils/contract";

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
            setAuction({ id, seller: auctionData.seller });

            // Vérifier si l'utilisateur actuel est le vendeur
            setIsSeller(userAddress?.toLowerCase() === auctionData.seller.toLowerCase());
            console.log("acheteur:", userAddress?.toLowerCase());
            console.log("vendeur :", auctionData.seller.toLowerCase());

            const articleCount = await contract.getArticleCount(id);

            // Charger les articles de l'enchère
            let articlesList = [];
            console.log("currentIndex: ", auctionData.currentArticleIndex)

            for (let i = 0; i < articleCount; i++) {
                const article = await contract.getArticle(id, i);
                const currentPrice = await contract.getCurrentPrice(id, i);

                console.log("article: ", article);
                articlesList.push({
                    name: article[0],
                    startingPrice: article[1].toString(),
                    reservePrice: article[2].toString(),
                    priceDecrement: article[3].toString(),
                    timeInterval: article[4].toString(),
                    currentPrice: currentPrice.toString(),
                    sold: article[6],
                    buyer: article[7],
                });
            }
            setArticles(articlesList);
        } catch (error) {
            console.error("Erreur lors du chargement des articles :", error);
        }
    };

    // Acheter un article
    const buyArticle = async (index) => {
        const contract = await getContract();
        if (!contract) return;

        try {
            setLoading(true);
            const priceToPay = await contract.getCurrentPrice(id, index);
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
        <div style={{ padding: "20px" }}>
            <h1>Enchère {id}</h1>
            <p>Vendeur  : {auction?.seller}</p>
            <p>acheteur : {userAddress}</p>

            {/* Tableau des articles */}
            <h2>Liste des articles</h2>
            {articles.length > 0 ? (
                <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "center" }}>
                    <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prix de départ</th>
                        <th>Prix réservé</th>
                        <th>Prix actuel</th>
                        <th>Statut</th>
                        {!isSeller && <th>Action</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {articles.map((article, index) => (
                        <tr key={index}>
                            <td>{article.name}</td>
                            <td>{article.startingPrice} ETH</td>
                            <td>{article.reservePrice} ETH</td>
                            <td>{article.currentPrice} ETH</td>
                            <td>{article.sold ? `Vendu à ${article.buyer}` : "Disponible"}</td>
                            {!isSeller && !article.sold && (
                                <td>
                                    <button onClick={() => buyArticle(index)} disabled={loading}>
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

            {/* Bouton pour ajouter un article (Seulement si c'est le vendeur) */}
            {isSeller && (
                <div style={{ marginTop: "20px" }}>
                    <Link to={`/auction/${id}/add-article`}>
                        <button>Ajouter un article</button>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default AuctionPage;
