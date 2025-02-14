import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";
import "../styles/HistoriquePage.css";

function HistoryPage() {
    const [userAddress, setUserAddress] = useState(null);
    const [purchasedArticles, setPurchasedArticles] = useState([]);

    // Charger les articles achetés par l'utilisateur
    const loadPurchasedArticles = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const count = await contract.auctionCount();
            let articlesList = [];

            for (let i = 1; i <= count; i++) {
                const auction = await contract.auctions(i);
                const articleCount = await contract.getArticleCount(i);

                for (let j = 0; j < articleCount; j++) {
                    const article = await contract.getArticle(i, j);
                    console.log("date: ",  new Date(Number(article[9]) * 1000).toLocaleString() );
                    if (article[7].toLowerCase() === userAddress?.toLowerCase()) { // Vérifie si l'utilisateur est l'acheteur
                        articlesList.push({
                            auctionId: i,
                            name: article[0],
                            finalPrice: article[8].toString(),
                            buyer: article[7],
                            purchaseTime: new Date(Number(article[9]) * 1000).toLocaleString(),
                        });
                    }
                }
            }

            setPurchasedArticles(articlesList);
        } catch (error) {
            console.error("Erreur lors du chargement de l'historique :", error);
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
            loadPurchasedArticles();
        }
    }, [userAddress]);

    return (
        <div className="history-container">
            <h1>Historique des Achats</h1>
            {purchasedArticles.length > 0 ? (
                <table className="history-table">
                    <thead>
                    <tr>
                        <th>ID Enchère</th>
                        <th>Nom de l'article</th>
                        <th>Prix Final (ETH)</th>
                        <th>Date d'achat</th>
                    </tr>
                    </thead>
                    <tbody>
                    {purchasedArticles.map((article, index) => (
                        <tr key={index}>
                            <td>{article.auctionId}</td>
                            <td>{article.name}</td>
                            <td>{article.finalPrice} ETH</td>
                            <td>{article.purchaseTime}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                <p>Aucun article acheté.</p>
            )}
        </div>
    );
}

export default HistoryPage;
