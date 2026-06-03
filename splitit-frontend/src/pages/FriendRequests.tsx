import { ArrowLeft, UserPlus, Check, X } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFriendStore from "../store/FriendStore";
import useUserAuth from "../store/UserAuthStore";

function FriendRequests() {
  const navigate = useNavigate();
  const user = useUserAuth((s) => s.user);
  const { notifications, fetchNotifications, respondToRequest, loading } = useFriendStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  const handleRespond = async (requestId: string, status: "ACCEPTED" | "DECLINED") => {
    if (!user) return;
    try {
      await respondToRequest(user.id, requestId, status);
      fetchNotifications(user.id);
    } catch (error) {
      console.error("Failed to respond to notification", error);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getInitials = (name: string) => {
    const parts = name?.trim().split(' ').filter(Boolean) || [];
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Premium avatar gradient colors
  const AVATAR_GRADIENS = [
    "from-pink-500 to-rose-500",
    "from-blue-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-purple-500 to-indigo-500",
  ];

  return (
    <div className="pt-24 pl-16 pr-margin-desktop pb-12 min-h-screen flex flex-col text-on-surface">
      {/* Header */}
      <div className="glass-surface p-6 rounded-2xl mb-8 flex items-center justify-between shadow-2xl border border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-on-surface" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-on-surface">Friend Requests</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Manage incoming invitations from other users</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-3xl">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary-container text-5xl">progress_activity</span>
            <p className="text-sm text-on-surface-variant mt-4">Loading requests...</p>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface/30 border border-white/5 rounded-2xl backdrop-blur-md shadow-xl text-center">
            <div className="w-20 h-20 bg-primary-container/10 border border-primary-container/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <UserPlus className="w-10 h-10 text-primary-container" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">No Pending Requests</h3>
            <p className="text-sm text-on-surface-variant max-w-sm mb-6">
              You don't have any incoming friend requests at the moment. Share your User ID from the profile page with others!
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-on-surface transition-all cursor-pointer hover:scale-102 active:scale-98"
            >
              Go to Profile
            </button>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification: any, index: number) => {
              const gradient = AVATAR_GRADIENS[index % AVATAR_GRADIENS.length];
              return (
                <div 
                  key={notification.id} 
                  className="glass-surface rounded-2xl p-5 shadow-2xl border border-white/10 transition-all duration-300 hover:border-primary-container/30 hover:shadow-primary-container/5 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-base font-black shrink-0 shadow-lg`}>
                      {getInitials(notification.user?.name || notification.message?.split(' ')[0] || '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-on-surface truncate">
                          {notification.user?.name || "Someone"}
                        </h4>
                        <span className="text-[10px] text-on-surface-variant/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 shrink-0">
                          {notification.createdAt ? getRelativeTime(notification.createdAt) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 font-medium truncate">
                        {notification.user?.email ?? ""}
                      </p>
                      <p className="text-xs text-on-surface/90 mt-2 bg-white/5 rounded-lg p-2.5 border border-white/5">
                        {notification.message}
                      </p>
                    </div>
                  </div>

                  {notification.type === "FRIEND_REQUEST" && (
                    <div className="mt-5 flex gap-3 pl-0 sm:pl-16">
                      <button
                        onClick={() => handleRespond(notification.id, "ACCEPTED")}
                        className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-success hover:bg-success/80 text-xs font-bold text-white cursor-pointer transition-all btn-spring flex items-center justify-center gap-2 hover:scale-102 active:scale-98 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(notification.id, "DECLINED")}
                        className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-on-surface cursor-pointer transition-all flex items-center justify-center gap-2 hover:scale-102 active:scale-98"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendRequests;
