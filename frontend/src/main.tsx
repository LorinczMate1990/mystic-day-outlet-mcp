import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Routes, Route, BrowserRouter, useLocation } from 'react-router-dom';
import './index.css'
import App from './App.tsx'
import EmailSettings from './views/EmailSettings/EmailSettings.tsx';
import EmailNotes from './views/EmailNotes/EmailNotes.tsx';
import TestMail from './views/TestMail/TestMail.tsx';
import BackToMenu from './components/BackToMenu/BackToMenu.tsx';

function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      {!isHome && <BackToMenu />}
      {children}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="content">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/email-settings" element={<EmailSettings />} />
            <Route path="/email-notes" element={<EmailNotes />} />
            <Route path="/test/email" element={<TestMail />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </main>
  </StrictMode>
)
