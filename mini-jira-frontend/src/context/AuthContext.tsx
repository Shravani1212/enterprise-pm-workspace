import { User, AuthResponse } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login as loginAction, logoutUser, logoutLocally } from '../store/slices/authSlice';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
}

export const useAuth = (): AuthContextType => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const login = (authData: AuthResponse) => {
    dispatch(loginAction(authData));
  };

  const logout = () => {
    // Attempt backend logout, but also clear locally
    dispatch(logoutUser());
    dispatch(logoutLocally());
  };

  return { user, isAuthenticated, login, logout };
};
