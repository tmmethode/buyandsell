import React, { useEffect } from 'react';
import './App.css';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CarPage from './components/car/CarPage';
import CarDetailsPage from './components/car/CarDetailsPage';
import HousePage from './components/house/HousePage';
import HouseDetailsPage from './components/house/HouseDetailsPage';
import PlotPage from './components/plot/PlotPage';
import PlotDetailsPage from './components/plot/PlotDetailsPage';
import JobPage from './components/job/JobPage';
import AboutUsPage from './components/AboutUsPage';
import ContactUsPage from './components/ContactUsPage';
import AdminDashboard from './components/admin/AdminDashboard';
import LoginPage from './components/LoginPage';
import Logout from './components/Logout';
import apiBaseUrl from './config';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Track visitor once per session (not on every page navigation)
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        // Check if already tracked in this session
        const alreadyTracked = sessionStorage.getItem('visitorTracked');
        if (alreadyTracked) {
          return; // Don't track again
        }

        // Generate or retrieve session ID
        let sessionId = sessionStorage.getItem('visitorSessionId');
        if (!sessionId) {
          sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('visitorSessionId', sessionId);
        }

        await fetch(`${apiBaseUrl}/api/visitors/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: location.pathname,
            referrer: document.referrer || '',
            sessionId: sessionId
          })
        });

        // Mark as tracked for this session
        sessionStorage.setItem('visitorTracked', 'true');
      } catch (error) {
        // Silently fail - visitor tracking should not affect user experience
        console.log('Visitor tracking skipped');
      }
    };

    trackVisitor();
  }, []); // Empty dependency array - only run once on mount

  // keep existing onSectionChange API for components that use it
  // Accept an optional id: handleSectionChange(section, id)
  const handleSectionChange = (section, id) => {
    switch (section) {
      case 'home':
        navigate('/');
        break;
      case 'car':
        if (id) navigate(`/car/${id}`);
        else {
          // Clear any previously selected item so the list page doesn't auto-open a detail
          try { localStorage.removeItem('selectedItem'); localStorage.removeItem('selectedItemType'); } catch (e) { }
          navigate('/car');
        }
        break;
      case 'house':
        if (id) navigate(`/house/${id}`);
        else {
          // Clear any previously selected item so the list page doesn't auto-open a detail
          try { localStorage.removeItem('selectedItem'); localStorage.removeItem('selectedItemType'); } catch (e) { }
          navigate('/house');
        }
        break;
      case 'plot':
        if (id) navigate(`/plot/${id}`);
        else {
          try { localStorage.removeItem('selectedItem'); localStorage.removeItem('selectedItemType'); } catch (e) { }
          navigate('/plot');
        }
        break;
      case 'job':
        if (id) navigate(`/job/${id}`);
        else {
          try { localStorage.removeItem('selectedItem'); localStorage.removeItem('selectedItemType'); } catch (e) { }
          navigate('/job');
        }
        break;
      case 'about':
        navigate('/about');
        break;
      case 'contact':
        navigate('/contact');
        break;
      case 'admin':
        navigate('/dashboard');
        break;
      case 'login':
        navigate('/login');
        break;
      default:
        navigate('/');
    }
  };

  // wrappers to inject route params into existing detail components
  const HouseDetailsWrapper = () => {
    const { id } = useParams();
    return <HouseDetailsPage houseId={id} onSectionChange={handleSectionChange} onBack={() => handleSectionChange('house')} />;
  };

  const CarDetailsWrapper = () => {
    const { id } = useParams();
    return <CarDetailsPage carId={id} onSectionChange={handleSectionChange} onBack={() => handleSectionChange('car')} />;
  };

  const PlotDetailsWrapper = () => {
    const { id } = useParams();
    return <PlotDetailsPage plotId={id} onSectionChange={handleSectionChange} onBack={() => handleSectionChange('plot')} />;
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage onSectionChange={handleSectionChange} />} />
        <Route path="/car" element={<CarPage onSectionChange={handleSectionChange} />} />
        <Route path="/car/:id" element={<CarDetailsWrapper />} />
        <Route path="/house" element={<HousePage onSectionChange={handleSectionChange} />} />
        <Route path="/house/:id" element={<HouseDetailsWrapper />} />
        <Route path="/plot" element={<PlotPage onSectionChange={handleSectionChange} />} />
        <Route path="/plot/:id" element={<PlotDetailsWrapper />} />
        <Route path="/job" element={<JobPage onSectionChange={handleSectionChange} />} />
        <Route path="/job/:id" element={<JobPage onSectionChange={handleSectionChange} />} />
        <Route path="/about" element={<AboutUsPage onSectionChange={handleSectionChange} />} />
        <Route path="/contact" element={<ContactUsPage onSectionChange={handleSectionChange} />} />
        <Route path="/login" element={<LoginPage onSectionChange={handleSectionChange} />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/dashboard/*" element={<AdminDashboard onSectionChange={handleSectionChange} />} />
        {/* fallback to landing */}
        <Route path="*" element={<LandingPage onSectionChange={handleSectionChange} />} />
      </Routes>
    </div>
  );
}

export default App;
