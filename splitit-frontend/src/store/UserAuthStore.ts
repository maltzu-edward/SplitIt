import axios from "axios";
import { create } from "zustand";
import type { UserAuthType } from "../type/UserAuthType";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const useUserAuth = create<UserAuthType>((set, get) => ({
  //initial value of the user
  user: null,
  authChecked: false,

  register: async (name, email, password) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new Error("Tidak bisa connect ke server. Pastikan backend sudah running di port 3000.");
        }
        const msg = error.response.data?.message;
        throw new Error(Array.isArray(msg) ? msg.join(", ") : msg || "Registrasi gagal, coba lagi.");
      }
      throw error;
    }
  },

  login: async (userEmail, password) => {
    // Fetching and storing token
    const res = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        email: userEmail,
        password,
      },
      { withCredentials: true }
    );

    const token = res.data?.token;
    if (token) {
      localStorage.setItem('token', token);
    }

    if (res.data?.user) {
      set({ user: res.data.user });
    }
  },

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const userRes = await axios.get(
        `${API_BASE_URL}/auth/profile`,
        {
          withCredentials: true,
          headers,
        }
      );
      const { user } = userRes.data;
      set({ user });
    } catch {
      set({ user: null }); // Not authenticated
    } finally {
      set({ authChecked: true });
    }
  },

  //use for protectedRoute
  isAuth: () => !!get().user, // double negation return the boolean value

  //remove all the user data information
  logout: async () => {
    set({ user: null });
    localStorage.removeItem('token');
    await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      { withCredentials: true }
    );
  },

  updateProfile: async (userId, name, profileImage) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        "Content-Type": "multipart/form-data",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await axios.patch(
        `${API_BASE_URL}/auth/profile/${userId}`,
        formData,
        {
          withCredentials: true,
          headers,
        }
      );

      const { user } = res.data;
      if (user) {
        set({ user });
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      throw error;
    }
  },
}));

export default useUserAuth;