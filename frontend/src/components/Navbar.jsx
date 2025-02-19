import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="navbar">
            <h2 className="navbar-title">Enchères Hollandaises</h2>

            {/* Icône du menu burger */}
            <div className="burger-menu" onClick={() => setIsOpen(!isOpen)}>
                ☰
            </div>

            <div className={`navbar-links ${isOpen ? "open" : ""}`}>
                <Link to="/" className="navbar-link" onClick={() => setIsOpen(false)}>Accueil</Link>
                <Link to="/my-auctions" className="navbar-link" onClick={() => setIsOpen(false)}>Mes Enchères</Link>
                <Link to="/history" className="navbar-link" onClick={() => setIsOpen(false)}>Historique</Link>
            </div>
        </nav>
    );
}

export default Navbar;
