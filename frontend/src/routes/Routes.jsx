import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import AuctionPage from "../pages/AuctionPage";
import AddArticlePage from "../pages/AddArticlePage";
import Navbar from "../components/Navbar";
import MyAuctionsPage from "../pages/MyAuctionsPage.jsx";

function AppRoutes() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/my-auctions" element={<MyAuctionsPage />} />
                <Route path="/auction/:id" element={<AuctionPage />} />
                <Route path="/auction/:id/add-article" element={<AddArticlePage />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;
