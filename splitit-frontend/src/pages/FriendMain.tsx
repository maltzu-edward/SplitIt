import { Plus, X, UserRoundPlus, MessageCircleMore } from "lucide-react";

import HeaderTagline from "../components/header/HeaderTagline";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import BottomNav from "../components/navigation/BottomNav";
import useFriendStore from "../store/FriendStore";
import useUserAuth from "../store/UserAuthStore";

function FriendMain() {
  const [search, setSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendIdInput, setFriendIdInput] = useState("");
  
  const user = useUserAuth((s) => s.user);
  const navigate = useNavigate();
  const { acceptedFriends, fetchFriends, sendRequest, loading, unreadCounts } = useFriendStore();
  const filteredFriends = acceptedFriends.filter((friend) =>
    friend.friend.name.toLowerCase().includes(search.toLowerCase()) ||
    friend.friend.email.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (user) {
      fetchFriends(user.id);
    }
  }, [user, fetchFriends]);

  const handleSendRequest = async () => {
    if (!friendIdInput || !user) return;
    try {
        await sendRequest(user.id, friendIdInput);
        setShowAddModal(false);
        setFriendIdInput("");
        alert("Friend request sent!");
    } catch (error) {
        console.error("Failed to send request", error);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const AVATAR_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
        <Header />

        <HeaderTagline 
          title="Your Friends"
          subtitle="Manage your friends and remind them"
          onChange={setSearch}
          value={search}
          placeholder="Search a friend"
        />

        <div className="flex-1 overflow-y-auto px-4 pb-24 mt-4">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && filteredFriends.length > 0 && (
              <div className="space-y-2">
                {filteredFriends.map((friend, idx) => {
                  const unread = unreadCounts.find(uc => uc.friendId === friend.friendId);
                  const hasUnread = unread && unread.unreadCount > 0;
                  return (
                    <div
                      key={friend.friendId}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                        >
                          {getInitials(friend.friend.name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{friend.friend.name}</p>
                          <p className="text-[11px] text-gray-500">{friend.friend.email}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => navigate(`/chat/${friend.friendId}`)}
                          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                          <MessageCircleMore className="w-5 h-5 text-gray-600"/>
                        </button>
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                            {unread!.unreadCount > 9 ? '9+' : unread!.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filteredFriends.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full mt-[-80px]">
                <img
                    src="/FriendLogo.png"
                    alt="Friend Logo"
                    className="w-32 h-32 object-contain"
                />
                <p className="text-base font-bold text-black mt-4">
                    {acceptedFriends.length === 0 && search.trim() === "" ? "You don't have any friends yet." : "No friends match your search."}
                </p>
                <p className="text-sm text-gray-400">
                    {acceptedFriends.length === 0 && search.trim() === "" ? "Add friends to get started" : "Try another name or email."}
                </p>
              </div>
            )}
        </div>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
                <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center mb-6">
                    <UserRoundPlus className="w-12 h-12 text-blue-600 mb-2" />
                    <h2 className="text-xl font-bold text-gray-900">Add New Friend</h2>
                    <p className="text-sm text-gray-500 text-center">Enter your friend's email or name to connect</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1.5">FRIEND EMAIL OR NAME</label>
                        <input 
                            value={friendIdInput}
                            onChange={(e) => setFriendIdInput(e.target.value)}
                            placeholder="Enter email or name" 
                            className="w-full bg-gray-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    
                    <button 
                        onClick={handleSendRequest}
                        className="w-full py-3 bg-[var(--fun-color-primary)] rounded-xl font-bold text-white active:brightness-90 mt-2 cursor-pointer transition-all"
                    >
                        Send Request
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500">Add a new friend</span>
        <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[var(--fun-color-primary)] rounded-full w-12 h-12 flex justify-center items-center shadow-lg active:scale-90 transition-transform cursor-pointer"
        >
          <Plus className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default FriendMain;
