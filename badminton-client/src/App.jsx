import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeView from "./pages/HomeView";
import BookingView from "./pages/BookingView";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/booking/:courtId" element={<BookingView />} />
      </Routes>
    </Router>
  );
}

export default App;
