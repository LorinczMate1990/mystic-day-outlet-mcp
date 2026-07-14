import { Link } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="app">
      <nav className="menu">
        <Link to="/email-settings" className="menu-item">E-mail settings</Link>
        <Link to="/email-notes" className="menu-item">Notes</Link>
        <Link to="/test/email" className="menu-item">Test</Link>
      </nav>
    </div>
  );
}

export default App;
