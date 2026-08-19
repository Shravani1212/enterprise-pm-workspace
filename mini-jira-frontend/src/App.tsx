import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/appRoutes';
import { useAppDispatch } from './store/hooks';
import { fetchCurrentUser } from './store/slices/authSlice';

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check auth status on mount
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
