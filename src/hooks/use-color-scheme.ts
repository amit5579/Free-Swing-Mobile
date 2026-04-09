import { useColorScheme as useNWColorScheme } from 'nativewind';

export function useColorScheme() {
  const { colorScheme } = useNWColorScheme();
  return colorScheme ?? 'light';
}

export function useThemeControls() {
  return useNWColorScheme();
}

