import axios from "axios";
import { create } from "zustand";

interface Friend {
    id: string;
    friendId: string;
    status: string;
    friend: {
        id: string;
        name: string;
        email: string;
    }
}

interface FriendStore {
    friends: Friend[];
    notifications: any[];
    pendingRequests: any[];
    acceptedFriends: Friend[];
    messages: any[];
    unreadCounts: { friendId: string; unreadCount: number }[];
    loading: boolean;
    error: string | null;
    fetchFriends: (userId: string) => Promise<void>;
    fetchNotifications: (userId: string) => Promise<void>;
    fetchConversation: (userId: string, friendId: string) => Promise<void>;
    fetchUnreadCounts: (userId: string) => Promise<void>;
    sendMessage: (senderId: string, receiverId: string, content: string) => Promise<void>;
    sendRequest: (userId: string, friendId: string) => Promise<void>;
    respondToRequest: (userId: string, requestId: string, status: "ACCEPTED" | "DECLINED") => Promise<void>;
    removeFriend: (userId: string, friendshipId: string) => Promise<void>;
}

const useFriendStore = create<FriendStore>((set) => ({
    friends: [],
    notifications: [],
    pendingRequests: [],
    acceptedFriends: [],
    messages: [],
    unreadCounts: [],
    loading: false,
    error: null,

    fetchFriends: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const [pendingResponse, acceptedResponse] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/friends/pending/${userId}`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/friends/accepted/${userId}`, { withCredentials: true }),
            ]);
            set({ pendingRequests: pendingResponse.data, acceptedFriends: acceptedResponse.data, loading: false });
            // Fetch unread counts after fetching friends
            await useFriendStore.getState().fetchUnreadCounts(userId);
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    fetchNotifications: async (userId: string) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/friends/notifications/${userId}`, { withCredentials: true });
            set({ notifications: response.data, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    fetchConversation: async (userId: string, friendId: string) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/messages/conversation/${userId}/${friendId}`, { withCredentials: true });
            set({ messages: response.data });
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    fetchUnreadCounts: async (userId: string) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/messages/unread/${userId}`, { withCredentials: true });
            set({ unreadCounts: response.data });
        } catch (err: any) {
            console.error('Failed to fetch unread counts', err);
        }
    },

    sendMessage: async (senderId: string, receiverId: string, content: string) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/messages/send`, {
                senderId,
                receiverId,
                content,
            }, { withCredentials: true });
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        }
    },

    sendRequest: async (userId: string, friendId: string) => {
        set({ loading: true, error: null });
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/friends/request`, {
                requesterId: userId,
                friendEmailOrName: friendId,
            }, { withCredentials: true });
            set({ loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    respondToRequest: async (userId: string, requestId: string, status: "ACCEPTED" | "DECLINED") => {
        set({ loading: true, error: null });
        try {
            await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/friends/respond`, {
                userId,
                friendshipId: requestId,
                status,
            }, { withCredentials: true });
            set({ loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    removeFriend: async (userId: string, friendshipId: string) => {
        set({ loading: true, error: null });
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/friends/${friendshipId}/${userId}`, { withCredentials: true });
            await useFriendStore.getState().fetchFriends(userId);
        } catch (err: any) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },
}));

export default useFriendStore;
