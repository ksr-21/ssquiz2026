import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Registration from './pages/Registration';
import DomainSelection from './pages/DomainSelection';
import Assessment from './pages/Assessment';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Result from './pages/Result';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-secondaryBg font-sans text-textPrimary">
        <Routes>
          <Route path="/" element={<Registration />} />
          <Route path="/domains" element={<DomainSelection />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/result" element={<Result />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;
