import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Settings } from './pages/Settings';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Budget } from './pages/Budget';
import { Goals } from './pages/Goals';
import { Transactions } from './pages/Transactions';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="budget" element={<Budget />} />
            <Route path="goals" element={<Goals />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
