import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
    const [userAddress, setUserAddress] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Charger les enchères disponibles (sauf celles de l'utilisateur)
    const loadAuctions = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const count = await contract.auctionCount();
            let auctionsList = [];

            for (let i = 1; i <= count; i++) {
                const auction = await contract.auctions(i);
                if (auction.seller.toLowerCase() !== userAddress?.toLowerCase()) {
                    auctionsList.push({
                        id: i,
                        seller: auction.seller,
                        started: auction.auctionStarted,
                        ended: auction.auctionEnded,
                    });
                }
            }

            setAuctions(auctionsList);
        } catch (error) {
            console.error("Erreur lors de la récupération des enchères :", error);
        }
    };

    // Créer une enchère
    const createAuction = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            setLoading(true);
            const tx = await contract.createAuction();
            await tx.wait();

            const count = await contract.auctionCount();
            navigate(`/auction/${count}/add-article`);
        } catch (error) {
            console.error("Erreur lors de la création d'une enchère :", error);
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
            loadAuctions();
        }
    }, [userAddress]);

    return (
        <div className="home-container">
            <h1>Enchères Hollandaises</h1>
            <button className="create-auction-btn" onClick={createAuction} disabled={loading}>
                {loading ? "Création en cours..." : "Créer une nouvelle enchère"}
            </button>

            <h2>Enchères disponibles</h2>
            <p className="info-text">Ces enchères ont été mises en ligne par d'autres vendeurs. Vous pouvez consulter et enchérir dès qu'elles sont ouvertes.</p>
            {auctions.length > 0 ? (
                <div className="table-wrapper">
                    <table className="auctions-table">
                        <thead>
                        <tr>
                            <th>Numéro d'enchère</th>
                            <th>Créateur</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {auctions.map((auction) => (
                            <tr key={auction.id}>
                                <td>{auction.id}</td>
                                <td>{auction.seller}</td>
                                <td>
                                    {auction.ended ? (
                                        <span className="status-closed">Clôturée</span>
                                    ) : auction.started ? (
                                        <span className="status-active">En cours</span>
                                    ) : (
                                        <span className="status-not-started">Pas encore commencée</span>
                                    )}
                                </td>
                                <td>
                                    {auction.started ? (
                                        <button className="access-btn" onClick={() => navigate(`/auction/${auction.id}`)}>
                                            Accéder
                                        </button>
                                    ) : (
                                        <span className="not-started">Pas encore commencé</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Aucune enchère disponible.</p>
            )}
        </div>
    );
}

export default HomePage;
