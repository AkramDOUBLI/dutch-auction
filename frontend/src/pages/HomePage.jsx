import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";
import { useNavigate } from "react-router-dom";

function HomePage() {
    const [auctionCount, setAuctionCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Charger les enchères
    const loadAuctions = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const count = await contract.auctionCount();
            setAuctionCount(Number(count));
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
            setAuctionCount(Number(count));

            // Rediriger vers la page d'ajout d'article après création
            navigate(`/auction/${count}/add-article`);
        } catch (error) {
            console.error("Erreur lors de la création d'une enchère :", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuctions();
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h1>Enchères Hollandaises</h1>
            <button onClick={createAuction} disabled={loading}>
                {loading ? "Création en cours..." : "Créer une nouvelle enchère"}
            </button>

            <h2>Enchères disponibles</h2>
            {auctionCount > 0 ? (
                [...Array(auctionCount)].map((_, i) => (
                    <button key={i} onClick={() => navigate(`/auction/${i + 1}`)}>
                        Voir enchère {i + 1}
                    </button>
                ))
            ) : (
                <p>Aucune enchère disponible.</p>
            )}
        </div>
    );
}

export default HomePage;
