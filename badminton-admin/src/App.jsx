// badminton-admin/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import LoginView from "./pages/LoginView";
import DashboardView from "./pages/DashboardView";
import CourtsManager from "./pages/CourtsManager";
import UsersManager from "./pages/UsersManager";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BookingsManager from "./pages/BookingsManager";
import ProductsManager from "./pages/ProductsManager";
import BillingManager from "./pages/BillingManager";
import PaymentHistory from "./pages/PaymentHistory";

// Các trang quản lý khác (tạm thời để trống component hoặc tạo file mock tương tự)
const DummyPage = ({ title }) => (
  <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
);

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginView />} />

          {/* Bọc các trang quản trị chung trong AdminLayout */}
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/courts" element={<CourtsManager />} />
            <Route path="/users" element={<UsersManager />} />
            <Route path="/bookings" element={<BookingsManager />} />
            <Route path="/products" element={<ProductsManager />} />
            <Route path="/billings" element={<BillingManager />} />
            <Route path="/payments" element={<PaymentHistory />} />
          </Route>
        </Routes>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
