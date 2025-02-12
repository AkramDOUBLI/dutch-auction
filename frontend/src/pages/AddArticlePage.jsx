import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getContract } from "../utils/contract";

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
        <div style={styles.container}>
            <h1>Ajouter un article</h1>
            <input type="text" name="name" placeholder="Nom de l'article" value={newArticle.name} onChange={handleInputChange} style={styles.input} />
            <input type="number" name="startingPrice" placeholder="Prix de départ (ETH)" value={newArticle.startingPrice} onChange={handleInputChange} style={styles.input} />
            <input type="number" name="reservePrice" placeholder="Prix réservé (ETH)" value={newArticle.reservePrice} onChange={handleInputChange} style={styles.input} />
            <input type="number" name="priceDecrement" placeholder="Décrément de prix (ETH)" value={newArticle.priceDecrement} onChange={handleInputChange} style={styles.input} />
            <input type="number" name="timeInterval" placeholder="Intervalle de temps (secondes)" value={newArticle.timeInterval} onChange={handleInputChange} style={styles.input} />

            <div style={styles.buttonContainer}>
                <button onClick={addNewArticle} disabled={loading} style={styles.button}>
                    {loading ? "Ajout en cours..." : "Ajouter l'article"}
                </button>
                <button onClick={() => navigate(`/auction/${id}`)} style={styles.cancelButton}>Annuler</button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: "20px",
        maxWidth: "400px",
        margin: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    input: {
        padding: "10px",
        fontSize: "16px",
        border: "1px solid #ccc",
        borderRadius: "5px",
    },
    buttonContainer: {
        display: "flex",
        justifyContent: "space-between",
    },
    button: {
        padding: "10px",
        fontSize: "16px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    cancelButton: {
        padding: "10px",
        fontSize: "16px",
        backgroundColor: "#d9534f",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    }
};

export default AddArticlePage;
