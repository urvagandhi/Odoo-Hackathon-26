import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastProvider';
import { ToastContainer } from './components/feedback/ToastContainer';
import './i18n/config';
import './index.css';

// Restore compact mode from localStorage on startup
if (localStorage.getItem('fleetflow_compact') === 'true') {
  document.documentElement.classList.add('compact');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
