import { useEffect, useState } from "react";
import { getContract } from "./utils/contract";

function App() {
    const [price, setPrice] = useState(null);
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadArticle();
    }, []);

    const loadArticle = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const currentIndex = await contract.currentArticleIndex(); // Récupérer l'index actuel
            const auctionEnded = await contract.auctionEnded();

            console.log("Chargement de l'article index :", currentIndex.toString());
            console.log("Enchère terminée :", auctionEnded);

            if (auctionEnded) {
                setArticle(null); // Aucun article disponible
                return;
            }

            const articleData = await contract.articles(currentIndex);

            setArticle({
                name: articleData[0],
                startingPrice: articleData[1].toString(),
                reservePrice: articleData[2].toString(),
                priceDecrement: articleData[3].toString(),
                timeInterval: articleData[4].toString(),
                currentPrice: await contract.getCurrentPrice()
            });
        } catch (error) {
            console.error("Erreur lors de la récupération de l'article :", error);
        }
    };

    const buyArticle = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            setLoading(true);
            const priceToPay = await contract.getCurrentPrice();
            console.log("Prix actuel à payer:", priceToPay.toString());

            const tx = await contract.buy({ value: priceToPay });
            await tx.wait();
            alert("Article acheté avec succès !");
            loadArticle(); // Rafraîchir après achat
        } catch (error) {
            console.error("Erreur lors de l'achat :", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Enchère Hollandaise</h1>
            {article ? (
                <div>
                    <h2>{article.name}</h2>
                    <p>Prix de départ : {article.startingPrice} eth</p>
                    <p>Prix réservé : {article.reservePrice} eth</p>
                    <p>Prix de décrement : {article.priceDecrement} eth</p>
                    <p>Prix actuel : {article.currentPrice.toString()} eth</p>
                    <p>Intervalle de modification du prix : {article.timeInterval} s</p>
                    <button onClick={buyArticle} disabled={loading}>
                        {loading ? "Achat en cours..." : "Acheter maintenant"}
                    </button>
                </div>
            ) : (
                <p>Aucun produit disponible.</p>
            )}
        </div>
    );
}

export default App;
