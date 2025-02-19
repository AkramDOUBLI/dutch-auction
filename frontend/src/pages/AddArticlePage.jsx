import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContract } from "../utils/contract";
import "../styles/AddArticlePage.css";

function AddArticlePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [newArticle, setNewArticle] = useState({
        name: "",
        startingPrice: "",
        reservePrice: "",
        priceDecrement: "",
        timeInterval: "",
    });

    const handleInputChange = (e) => {
        setNewArticle({ ...newArticle, [e.target.name]: e.target.value });
    };

    const addNewArticle = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            setLoading(true);
            const tx = await contract.addArticle(
                id,
                newArticle.name,
                newArticle.startingPrice,
                newArticle.reservePrice,
                newArticle.priceDecrement,
                newArticle.timeInterval
            );
            await tx.wait();
            alert("Article ajouté avec succès !");
            navigate(`/auction/${id}`); // Redirection vers la page de l’enchère
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'article :", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-article-container">
            <h1>Ajouter un article</h1>
            <input type="text" name="name" placeholder="Nom de l'article" value={newArticle.name} onChange={handleInputChange} className="add-article-input" />
            <input type="number" name="startingPrice" placeholder="Prix de départ (ETH)" value={newArticle.startingPrice} onChange={handleInputChange} className="add-article-input" />
            <input type="number" name="reservePrice" placeholder="Prix réservé (ETH)" value={newArticle.reservePrice} onChange={handleInputChange} className="add-article-input" />
            <input type="number" name="priceDecrement" placeholder="Décrément de prix (ETH)" value={newArticle.priceDecrement} onChange={handleInputChange} className="add-article-input" />
            <input type="number" name="timeInterval" placeholder="Intervalle de temps (secondes)" value={newArticle.timeInterval} onChange={handleInputChange} className="add-article-input" />

            <div className="add-article-buttons">
                <button onClick={addNewArticle} disabled={loading} className="add-article-btn add-btn">
                    {loading ? "Ajout en cours..." : "Ajouter l'article"}
                </button>
                <button onClick={() => navigate(`/auction/${id}`)} className="add-article-btn cancel-btn">
                    Annuler
                </button>
            </div>
        </div>
    );
}

export default AddArticlePage;
