import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";
import { useNavigate } from "react-router-dom";
import "../styles/MyAuctionsPage.css";

function MyAuctionsPage() {
    const [userAddress, setUserAddress] = useState(null);
    const [myAuctions, setMyAuctions] = useState([]);
    const navigate = useNavigate();

    // Charger les enchères créées par l'utilisateur
    const loadMyAuctions = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const count = await contract.auctionCount();
            let auctionsList = [];

            for (let i = 1; i <= count; i++) {
                const auction = await contract.auctions(i);
                if (auction.seller.toLowerCase() === userAddress?.toLowerCase()) {
                    const articleCount = await contract.getArticleCount(i);
                    auctionsList.push({
                        id: i,
                        seller: auction.seller,
                        articleCount: Number(articleCount),
                        auctionEnded: auction.auctionEnded,
                        auctionStarted: auction.auctionStarted,
                    });
                }
            }

            setMyAuctions(auctionsList);
        } catch (error) {
            console.error("Erreur lors de la récupération des enchères :", error);
        }
    };

    // Fonction pour démarrer une enchère
    const startAuction = async (auctionId) => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const tx = await contract.startAuction(auctionId);
            await tx.wait();
            alert("L'enchère a commencé !");
            loadMyAuctions();
        } catch (error) {
            console.error("Erreur lors du démarrage de l'enchère :", error);
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
            loadMyAuctions();
        }
    }, [userAddress]);

    return (
        <div className="my-auctions-container">
            <div className="table-wrapper">
                <h1>Mes Enchères</h1>
                {myAuctions.length > 0 ? (
                    <table className="my-auctions-table">
                        <thead>
                        <tr>
                            <th>ID Enchère</th>
                            <th>Nombre d'articles</th>
                            <th>État</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {myAuctions.map((auction) => (
                            <tr key={auction.id}>
                                <td>{auction.id}</td>
                                <td>{auction.articleCount}</td>
                                <td>
                                    <span className={auction.auctionEnded ? "status ended" : auction.auctionStarted ? "status started" : "status not-started"}>
                                        {auction.auctionEnded ? "Clôturée" : auction.auctionStarted ? "En cours" : "Pas commencée"}
                                    </span>
                                </td>
                                <td>
                                    <button className="view-btn" onClick={() => navigate(`/auction/${auction.id}`)}>Voir</button>
                                    {!auction.auctionStarted && (
                                        <button className="start-btn" onClick={() => startAuction(auction.id)}>Start</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Aucune enchère créée.</p>
                )}
            </div>
        </div>
    );

}

export default MyAuctionsPage;
