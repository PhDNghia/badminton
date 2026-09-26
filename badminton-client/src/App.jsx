// badminton-client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeView from "./pages/HomeView";
import BookingView from "./pages/BookingView";
import AuthView from "./pages/AuthView";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/booking" element={<BookingView />} />
        <Route path="/login" element={<AuthView />} />
      </Routes>
    </Router>
  );
}

export default App;
