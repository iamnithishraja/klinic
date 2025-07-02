import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import UsersTab from './components/UsersTab';
import DoctorsTab from './components/DoctorsTab';
import LaboratoriesTab from './components/LaboratoriesTab';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 ml-64">
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/users" element={<UsersTab />} />
              <Route path="/doctors" element={<DoctorsTab />} />
              <Route path="/laboratories" element={<LaboratoriesTab />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
