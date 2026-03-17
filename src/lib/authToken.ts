let tokenGetter: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (
  getter: () => Promise<string | null>
) => {
  tokenGetter = getter;
};

export const getAuthToken = async (): Promise<string | null> => {
  if (!tokenGetter) return null;
  return tokenGetter();
};