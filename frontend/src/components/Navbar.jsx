import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav style={styles.navbar}>
            <h2 style={styles.title}>Enchères Hollandaises</h2>
            <div style={styles.links}>
                <Link to="/" style={styles.link}>Accueil</Link>
                <Link to="/my-auctions" style={styles.link}>Mes Enchères</Link>
            </div>
        </nav>
    );
}

const styles = {
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        backgroundColor: "rgba(23,106,28,0.85)",
        color: "white",
    },
    title: {
        margin: 0,
    },
    links: {
        display: "flex",
        gap: "15px",
    },
    link: {
        color: "white",
        textDecoration: "none",
        fontSize: "18px",
    },
};

export default Navbar;
