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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    // Disable main window scrollbar while in Chat view
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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
    if (messages.length === 0) return;

    const container = scrollContainerRef.current;
    const isFirstLoad = prevMessagesLengthRef.current === 0;
    const lengthChanged = messages.length !== prevMessagesLengthRef.current;

    // Check if user is scrolled near the bottom (within 150px)
    const isNearBottom = container
      ? (container.scrollHeight - container.scrollTop - container.clientHeight < 150)
      : true;

    // Check if the last message is from the logged-in user
    const lastMessageIsMine = messages[messages.length - 1]?.senderId === user?.id;

    if (isFirstLoad || (lengthChanged && (isNearBottom || lastMessageIsMine))) {
      chatEndRef.current?.scrollIntoView({ behavior: isFirstLoad ? 'auto' : 'smooth' });
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, user?.id]);

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
    <div className="absolute top-14 md:top-16 bottom-16 md:bottom-0 left-0 right-0 flex flex-col overflow-hidden px-2 md:px-6 py-4">
      {/* Premium Glass Chat Container */}
      <div className="flex-1 flex flex-col glass-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              {getInitials(friendName)}
            </div>
            <div>
              <h1 className="text-sm font-bold text-on-surface leading-tight">{friendName}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">Online</span>
              </div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer text-on-surface-variant">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-thin">
          {initialLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
              <p className="text-xs text-on-surface-variant mt-3">Loading messages...</p>
            </div>
          )}

          {!initialLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-on-surface-variant/40">
                <span className="material-symbols-outlined text-3xl">chat_bubble</span>
              </div>
              <p className="text-sm font-semibold text-on-surface">No messages yet</p>
              <p className="text-xs mt-1 text-on-surface-variant">Say hi to {friendName} to start the conversation!</p>
            </div>
          )}

          {!initialLoading && messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((message: any, idx: number) => {
                const isMine = message.senderId === user?.id;
                const showDate = idx === 0 ||
                  getDateLabel(message.createdAt) !== getDateLabel(messages[idx - 1].createdAt);

                return (
                  <div key={message.id} className="space-y-2">
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-[10px] font-semibold text-on-surface-variant/90 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full backdrop-blur-md">
                          {getDateLabel(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 ${
                          isMine
                            ? 'bg-primary-container text-on-primary-container border border-primary-container/10 rounded-tr-none'
                            : 'glass-surface text-on-surface border border-white/5 rounded-tl-none'
                        }`}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                        <div className="flex justify-end items-center gap-1 mt-1.5">
                          <span className={`text-[9px] font-medium ${isMine ? 'text-primary-container/80' : 'text-on-surface-variant/60'}`}>
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
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
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex gap-3 items-center">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 rounded-xl bg-surface-container border border-outline/30 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-transparent transition-all text-on-surface placeholder-on-surface-variant/40"
            />
            <button
              onClick={handleSendMessage}
              disabled={!draft.trim() || sending}
              className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                draft.trim() && !sending
                  ? 'bg-primary-container text-white active:scale-95 hover:bg-inverse-primary hover:scale-105'
                  : 'bg-white/5 text-on-surface-variant/40 border border-white/5 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <span className="material-symbols-outlined animate-spin text-sm text-white">progress_activity</span>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
