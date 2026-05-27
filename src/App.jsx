import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './auth/AuthContext.jsx'
import AIAssistant from './frontend/AIAssistant.jsx'
import Login from './auth/login.jsx'
import Register from './auth/register.jsx'
import Dashboard from './frontend/dashboard.jsx'
import Homepage from './frontend/homepage.jsx'
import Settings from './frontend/settings.jsx'
import Budgets from './frontend/budgets.jsx'
import Report from './frontend/report.jsx'
import Transactions from './frontend/transaction.jsx'
import { useEffect } from "react"; 

function App() {
  // Wake up Render on app load
  useEffect(() => {
    fetch('https://lumo-5f41.onrender.com/api/health').catch(() => {})
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/reports" element={<Report />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <AIAssistant />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;