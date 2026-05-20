import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Vote from './pages/Vote';
import Admin from './pages/Admin';
import Roles from './pages/Setting';
import { GlobalStyle, MobileFrame, PageShell } from './styles/app';

export default function App() {
  return (
    <BrowserRouter>
      <GlobalStyle />
      <PageShell>
        <MobileFrame>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/result" element={<Navigate to="/vote" replace />} />
          </Routes>
        </MobileFrame>
      </PageShell>
    </BrowserRouter>
  );
}
