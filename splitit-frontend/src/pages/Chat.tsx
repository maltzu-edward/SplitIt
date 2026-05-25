import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import useFriendStore from '../store/FriendStore';
import useUserAuth from '../store/UserAuthStore';

function Chat() {
  const { friendId } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const user = useUserAuth((state) => state.user);
  const { acceptedFriends, messages, fetchFriends, fetchConversation, sendMessage } = useFriendStore();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) {
      fetchFriends(user.id);
    }
  }, [user, fetchFriends]);

  useEffect(() => {
    if (user && friendId) {
      fetchConversation(user.id, friendId).then(() => {
        setInitialLoading(false);
      });
    }
  }, [user, friendId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!user || !friendId) return;

    pollingRef.current = setInterval(() => {
      fetchConversation(user.id, friendId);
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user, friendId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const friend = acceptedFriends.find((friend) => friend.friendId === friendId);
  const friendName = friend?.friend?.name ?? 'Friend';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSendMessage = async () => {
    if (!draft.trim() || !user || !friendId || sending) return;

    setSending(true);
    try {
      await sendMessage(user.id, friendId, draft.trim());
      setDraft('');
      await fetchConversation(user.id, friendId);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-gray-900 flex flex-col overflow-hidden">

      {/* Blue Gradient Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
            {getInitials(friendName)}
          </div>
          <div>
            <h1 className="text-base font-bold">{friendName}</h1>
            <p className="text-[11px] text-green-300 font-medium">Online</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {initialLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</p>
            </div>
          </div>
        )}

        {!initialLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet</p>
            <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Say hi to {friendName}!</p>
          </div>
        )}

        {!initialLoading && messages.length > 0 && (
          <div className="space-y-2">
            {messages.map((message: any, idx: number) => {
              const isMine = message.senderId === user?.id;
              const showDate = idx === 0 ||
                getDateLabel(message.createdAt) !== getDateLabel(messages[idx - 1].createdAt);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {getDateLabel(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                        isMine
                          ? 'bg-[var(--fun-color-primary)] text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`mt-0.5 text-[10px] text-right ${isMine ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex gap-2 items-center">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!draft.trim() || sending}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              draft.trim() && !sending
                ? 'bg-[var(--fun-color-primary)] text-white active:scale-90'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
