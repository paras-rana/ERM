export type AuthUser = {
  userId: string;
  email: string;
  role: string;
  name: string | null;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
  expiresAt: string;
};
