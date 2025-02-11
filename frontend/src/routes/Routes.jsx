import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import AuctionPage from "../pages/AuctionPage";
import AddArticlePage from "../pages/AddArticlePage";
import Navbar from "../components/Navbar"; // Import de la Navbar

function AppRoutes() {
    return (
        <Router>
            <Navbar />  {/* Ajout de la Navbar */}
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auction/:id" element={<AuctionPage />} />
                <Route path="/auction/:id/add-article" element={<AddArticlePage />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;
