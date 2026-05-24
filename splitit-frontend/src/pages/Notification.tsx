import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFriendStore from "../store/FriendStore";
import useUserAuth from "../store/UserAuthStore";
import BottomNav from "../components/navigation/BottomNav";

function Notification() {
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

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">

      {/* Blue Gradient Header (matches Figma) */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold">Notifications</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full mt-[-40px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <p className="text-base font-bold text-gray-800">No new notifications</p>
            <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification: any) => (
              <div key={notification.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(notification.user?.name || notification.message?.split(' ')[0] || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{notification.message}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{notification.user?.email ?? ""}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {notification.createdAt ? getRelativeTime(notification.createdAt) : ''}
                  </span>
                </div>

                {/* Friend Request Actions (matches Figma — green Accept / red Decline) */}
                {notification.type === "FRIEND_REQUEST" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleRespond(notification.id, "ACCEPTED")}
                      className="flex-1 rounded-lg bg-green-50 border border-green-200 py-2.5 text-sm font-bold text-green-600 cursor-pointer hover:bg-green-100 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(notification.id, "DECLINED")}
                      className="flex-1 rounded-lg bg-red-50 border border-red-200 py-2.5 text-sm font-bold text-red-500 cursor-pointer hover:bg-red-100 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Notification;
