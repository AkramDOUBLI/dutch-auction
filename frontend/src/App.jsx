import { useEffect, useState } from "react";
import { getContract } from "./utils/contract";

function App() {
    const [userAddress, setUserAddress] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [auctionEnded, setAuctionEnded] = useState(false);

    // État pour le formulaire d'ajout d'article
    const [newArticle, setNewArticle] = useState({
        name: "",
        startingPrice: "",
        reservePrice: "",
        priceDecrement: "",
        timeInterval: "",
    });

    // Vérifie si l'utilisateur est le vendeur
    const checkUserRole = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
            setUserAddress(account);

            const sellerAddress = await contract.seller();
            setIsSeller(account.toLowerCase() === sellerAddress.toLowerCase());
        } catch (error) {
            console.error("Erreur lors de la vérification de l'utilisateur :", error);
        }
    };

    // Charge l'article en cours de vente
    const loadArticle = async () => {
        const contract = await getContract();
        if (!contract) return;
        try {
            const currentIndex = await contract.currentArticleIndex();
            const auctionEndedStatus = await contract.auctionEnded();

            setAuctionEnded(auctionEndedStatus);
            console.log("articles:",currentIndex);
            console.log("ended:",auctionEndedStatus);

            if (auctionEndedStatus) {
                setArticle(null);
                return;
            }

            const articleData = await contract.articles(currentIndex);
            setArticle({
                name: articleData[0],
                startingPrice: articleData[1].toString(),
                reservePrice: articleData[2].toString(),
                priceDecrement: articleData[3].toString(),
                timeInterval: articleData[4].toString(),
                currentPrice: await contract.getCurrentPrice(),
                sold: articleData[6],
                buyer: articleData[7],
            });
        } catch (error) {
            console.error("Erreur lors de la récupération de l'article :", error);
        }
    };

    // Acheter un article
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
            loadArticle();
        } catch (error) {
            console.error("Erreur lors de l'achat :", error);
        } finally {
            setLoading(false);
        }
    };

    // Gérer les changements du formulaire d'ajout d'article
    const handleInputChange = (e) => {
        setNewArticle({ ...newArticle, [e.target.name]: e.target.value });
    };

    // Ajouter un nouvel article
    const addNewArticle = async () => {
        const contract = await getContract();
        if (!contract) return;

        try {
            setLoading(true);
            const tx = await contract.addArticle(
                newArticle.name,
                newArticle.startingPrice,
                newArticle.reservePrice,
                newArticle.priceDecrement,
                newArticle.timeInterval
            );
            await tx.wait();
            alert("Article ajouté avec succès !");
            setNewArticle({ name: "", startingPrice: "", reservePrice: "", priceDecrement: "", timeInterval: "" });
            loadArticle();
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'article :", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUserRole();
        loadArticle();
    }, []);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Enchère Hollandaise</h1>
            <p>Connecté avec : {userAddress}</p>

            {isSeller ? (
                <>
                    <h2>Ajout d’articles</h2>
                    <input type="text" name="name" placeholder="Nom" value={newArticle.name} onChange={handleInputChange} />
                    <input type="text" name="startingPrice" placeholder="Prix de départ" value={newArticle.startingPrice} onChange={handleInputChange} />
                    <input type="text" name="reservePrice" placeholder="Prix réservé" value={newArticle.reservePrice} onChange={handleInputChange} />
                    <input type="text" name="priceDecrement" placeholder="Décrément de prix" value={newArticle.priceDecrement} onChange={handleInputChange} />
                    <input type="text" name="timeInterval" placeholder="Intervalle de temps (sec)" value={newArticle.timeInterval} onChange={handleInputChange} />
                    <button onClick={addNewArticle} disabled={loading}>
                        {loading ? "Ajout en cours..." : "Ajouter l'article"}
                    </button>
                </>
            ) : (
                <>
                    {article ? (
                        <div>
                            <h2>{article.name}</h2>
                            <p>Prix de départ : {article.startingPrice} ETH</p>
                            <p>Prix réservé : {article.reservePrice} ETH</p>
                            <p>Prix actuel : {article.currentPrice.toString()} ETH</p>
                            {article.sold ? (
                                <p style={{ color: "red" }}>Vendu à {article.buyer}</p>
                            ) : (
                                <button onClick={buyArticle} disabled={loading}>
                                    {loading ? "Achat en cours..." : "Acheter maintenant"}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p>Aucun produit disponible.</p>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
