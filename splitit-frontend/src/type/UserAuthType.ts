import type UserType from "./UserType";

export interface UserAuthType {
  user: UserType | null;
  authChecked: boolean;

  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (userId: string, name: string, profileImage?: File) => Promise<void>;
  isAuth: () => boolean;
}