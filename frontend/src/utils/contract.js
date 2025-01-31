import { ethers } from "ethers";
import contractABI from "./abi.json"; // Import de l’ABI depuis le frontend

// Adresse du Smart Contract
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";


// Fonction pour se connecter à MetaMask et récupérer le contrat
export const getContract = async () => {
    if (!window.ethereum) {
        alert("MetaMask n'est pas installé !");
        return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
  };
