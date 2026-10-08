import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Browse from './pages/Browse.jsx';
import AnimalDetail from './pages/AnimalDetail.jsx';
import AnimalForm from './pages/AnimalForm.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Messages from './pages/Messages.jsx';
import MapPage from './pages/MapPage.jsx';
import ProviderProfile from './pages/ProviderProfile.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/animals/:id" element={<AnimalDetail />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/animals/new" element={<ProtectedRoute provider><AnimalForm /></ProtectedRoute>} />
          <Route path="/animals/:id/edit" element={<ProtectedRoute provider><AnimalForm /></ProtectedRoute>} />
          <Route path="*" element={<p className="empty">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
