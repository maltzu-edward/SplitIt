import { Plus, X, UserRoundPlus, MessageCircleMore } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFriendStore from "../store/FriendStore";
import useUserAuth from "../store/UserAuthStore";
import useExpenseStore from "../store/ExpenseStore";

function FriendMain() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [friendIdInput, setFriendIdInput] = useState("");

  const user = useUserAuth((s) => s.user);
  const navigate = useNavigate();
  const { acceptedFriends, fetchFriends, sendRequest, loading, unreadCounts } = useFriendStore();
  const { searchQuery } = useExpenseStore();

  const filteredFriends = acceptedFriends.filter((friend) =>
    friend.friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.friend.email.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="pt-20 md:pt-24 px-4 md:pl-16 md:pr-margin-desktop pb-24 md:pb-12 min-h-screen flex flex-col">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Your Friends</h2>
          <p className="text-on-surface-variant font-body-md">Manage your friends list and chat splits.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
          </div>
        )}

        {!loading && filteredFriends.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFriends.map((friend, idx) => {
              const unread = unreadCounts.find(uc => uc.friendId === friend.friendId);
              const hasUnread = unread && unread.unreadCount > 0;
              return (
                <div
                  key={friend.friendId}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl glass-surface shadow-xl hover:border-primary-container/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                    >
                      {getInitials(friend.friend.name)}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{friend.friend.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{friend.friend.email}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => navigate(`/chat/${friend.friendId}`)}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <MessageCircleMore className="w-5 h-5 text-on-surface"/>
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
          <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-4 font-bold">person_add</span>
            <p className="text-base font-bold text-on-surface">
              {acceptedFriends.length === 0 && searchQuery.trim() === "" ? "You don't have any friends yet." : "No friends match your search."}
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              {acceptedFriends.length === 0 && searchQuery.trim() === "" ? "Add friends to get started" : "Try searching another name."}
            </p>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-floating rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center mb-6">
              <UserRoundPlus className="w-12 h-12 text-primary-container mb-2" />
              <h2 className="text-xl font-bold text-on-surface">Add New Friend</h2>
              <p className="text-sm text-on-surface-variant text-center">Enter your friend's email or name to connect</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant block mb-1.5">FRIEND EMAIL OR NAME</label>
                <input
                  value={friendIdInput}
                  onChange={(e) => setFriendIdInput(e.target.value)}
                  placeholder="Enter email or name"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-container text-sm text-on-surface placeholder-on-surface-variant/40"
                />
              </div>

              <button
                onClick={handleSendRequest}
                className="w-full py-3 bg-primary-container hover:bg-inverse-primary rounded-xl font-bold text-on-primary-container active:scale-[0.98] mt-2 cursor-pointer transition-all duration-200 btn-spring"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 hidden sm:block">Add a new friend</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-container hover:bg-inverse-primary rounded-full w-12 h-12 flex justify-center items-center shadow-lg active:scale-90 transition-transform cursor-pointer"
        >
          <Plus className="text-white w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default FriendMain;
