import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BillsProvider } from "./context/BillsContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import SalesPage from "./pages/SalesPage";
import BillFormPage from "./pages/BillFormPage";
import BillViewPage from "./pages/BillViewPage";
import "./App.css";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem("bakrid_auth") === "true"
  );

  function handleLogin() {
    sessionStorage.setItem("bakrid_auth", "true");
    setIsLoggedIn(true);
  }

  function handleLogout() {
    sessionStorage.removeItem("bakrid_auth");
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <BillsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"                    element={<HomePage    onLogout={handleLogout} />} />
          <Route path="/sales"               element={<SalesPage   onLogout={handleLogout} />} />
          <Route path="/bill/new"            element={<BillFormPage onLogout={handleLogout} />} />
          <Route path="/bill/edit/:billNo"   element={<BillFormPage onLogout={handleLogout} />} />
          <Route path="/bill/view/:billNo"   element={<BillViewPage onLogout={handleLogout} />} />
          <Route path="*"                    element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </BillsProvider>
  );
}
