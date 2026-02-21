import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { ToastProvider } from './context/ToastProvider';
import { ToastContainer } from './components/feedback/ToastContainer';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
      {/* Single ToastContainer — renders above everything at z-[9999] */}
      <ToastContainer />
    </ToastProvider>
  </StrictMode>
);
