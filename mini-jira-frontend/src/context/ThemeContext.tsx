import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTheme as setThemeAction, toggleTheme as toggleThemeAction, Theme } from '../store/slices/themeSlice';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}


export const useTheme = (): ThemeContextType => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);

  const setTheme = (newTheme: Theme) => {
    dispatch(setThemeAction(newTheme));
  };

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  return { theme, toggleTheme, setTheme };
};
