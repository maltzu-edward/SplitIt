import { X, Plus, User, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGroupStore from "../store/GroupStore";
import useUserAuth from "../store/UserAuthStore";
import useFriendStore from "../store/FriendStore";
import useExpenseStore from "../store/ExpenseStore";

const GROUP_CATEGORIES = [
  { id: 'food', label: 'Food', image: '/food.svg' },
  { id: 'electricity', label: 'Electricity', image: '/electricity.svg' },
  { id: 'household', label: 'Household', image: '/household.svg' },
  { id: 'bills', label: 'Other Bills', image: '/bills.svg' },
];

function ExpenseMain() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [friendSearch, setFriendSearch] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(GROUP_CATEGORIES[0].id);
  const [leaveConfirm, setLeaveConfirm] = useState<{ groupId: string; groupName: string } | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  const navigate = useNavigate();
  const user = useUserAuth((s) => s.user);
  const { groups, fetchGroups, createGroup, leaveGroup, loading } = useGroupStore();
  const { acceptedFriends, fetchFriends } = useFriendStore();
  const { summary, fetchUserSummary, recentActivities, fetchRecentActivities, searchQuery } = useExpenseStore();

  useEffect(() => {
    if (user) {
      fetchGroups(user.id);
      fetchFriends(user.id);
      fetchUserSummary(user.id);
      fetchRecentActivities(user.id);
    }
  }, [user, fetchGroups, fetchFriends, fetchUserSummary, fetchRecentActivities]);

  const formatCurrency = (n: number) => {
    const formatted = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(n);
    return `Rp. ${formatted}`;
  };

  const handleCreateGroup = async () => {
    if (!newGroupName || !user || selectedMemberIds.length === 0) return;
    const selectedCategoryData = GROUP_CATEGORIES.find((item) => item.id === selectedCategory);
    try {
      await createGroup(
        newGroupName,
        selectedMemberIds,
        user.id,
        selectedCategoryData?.image,
      );
      setShowCreateModal(false);
      setFriendSearch("");
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedMemberIds([]);
      setSelectedCategory(GROUP_CATEGORIES[0].id);
      fetchGroups(user.id);
    } catch (error) {
      console.error("Failed to create group", error);
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const MEMBER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const getMemberColor = (index: number) => {
    return MEMBER_COLORS[index % MEMBER_COLORS.length];
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFriends = acceptedFriends.filter((friend) =>
    friend.friend.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    friend.friend.email.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return {
          icon: 'chat',
          iconColor: 'text-indigo-400',
          bgColor: 'bg-indigo-500/10 border-indigo-500/20',
        };
      case 'SETTLEMENT_APPROVED':
      case 'SETTLEMENT_APPROVED_BY_YOU':
        return {
          icon: 'check_circle',
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'SETTLEMENT_SENT':
      case 'SETTLEMENT_RECEIVED':
        return {
          icon: 'payments',
          iconColor: 'text-teal-400',
          bgColor: 'bg-teal-500/10 border-teal-500/20',
        };
      case 'EXPENSE_ADDED_BY_YOU':
      case 'EXPENSE_ADDED':
        return {
          icon: 'receipt_long',
          iconColor: 'text-primary-container',
          bgColor: 'bg-primary-container/10 border-primary-container/20',
        };
      case 'FRIEND_ACCEPTED':
        return {
          icon: 'handshake',
          iconColor: 'text-purple-400',
          bgColor: 'bg-purple-500/10 border-purple-500/20',
        };
      case 'FRIEND_SENT':
      case 'FRIEND_RECEIVED':
        return {
          icon: 'person_add',
          iconColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10 border-amber-500/20',
        };
      default:
        return {
          icon: 'notifications',
          iconColor: 'text-on-surface-variant',
          bgColor: 'bg-white/5 border-white/10',
        };
    }
  };

  const getActivityTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="pt-20 md:pt-24 px-4 md:pl-16 md:pr-margin-desktop pb-24 md:pb-12 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Financial Overview</h2>
        <p className="text-on-surface-variant font-body-md">Real-time status across all active groups.</p>
      </div>

      {/* Flat Financial Metrics Row (Centered and Big) */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 text-on-surface py-4 sm:py-6 mb-8 bg-transparent">
        {/* You are Owed */}
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary-container text-4xl shrink-0">arrow_upward</span>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total You are Owed</p>
            <h3 className="text-2xl sm:text-3xl font-black text-primary-container">
              {formatCurrency(summary?.totalOwe || 0)}
            </h3>
          </div>
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-12 w-[1px] bg-white/20" />

        {/* You Owe */}
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-error text-4xl shrink-0">arrow_downward</span>
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total You Owe</p>
            <h3 className="text-2xl sm:text-3xl font-black text-error">
              {formatCurrency(summary?.totalOwed || 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Active Groups List Container */}
        <div className="lg:col-span-8 glass-surface rounded-2xl p-6 border border-white/10 flex flex-col h-[480px]">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-headline-md text-headline-md text-on-surface">Active Groups</h4>
          </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
            </div>
          )}

          {!loading && filteredGroups.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-6">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-4">group</span>
              <p className="text-base font-bold text-on-surface">
                {groups.length === 0 && searchQuery.trim() === "" ? "You don't have any groups yet." : "No groups match your search."}
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                {groups.length === 0 && searchQuery.trim() === "" ? "Create a new group to get started" : "Try typing another name."}
              </p>
            </div>
          )}

          {!loading && filteredGroups.length > 0 && (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 pb-3 border-b border-white/10 text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider px-2">
                <div className="col-span-7 sm:col-span-4">Group Name</div>
                <div className="hidden sm:block col-span-3">Members</div>
                <div className="col-span-5 sm:col-span-3">Status</div>
                <div className="hidden md:block col-span-2 text-right">Last Activity</div>
              </div>

              {/* Scrollable list of rows */}
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin mt-2 divide-y divide-white/5">
                {filteredGroups.map((group, index) => {
                  const groupImageSrc = group.groupImage || '/GroupLogo.png';
                  const totalMembers = group.members?.length || 0;
                  const displayedMembers = group.members?.slice(0, 3) || [];
                  const statusText = index % 2 === 0 ? "Settled" : "Action Needed";
                  const statusBg = index % 2 === 0 ? "bg-primary-container/10 text-primary-container" : "bg-error/10 text-error";

                  return (
                    <div
                      key={group.id}
                      onClick={() => navigate(`/group/${group.id}`)}
                      className="grid grid-cols-12 gap-2 py-3.5 items-center hover:bg-white/5 rounded-lg px-2 transition duration-200 cursor-pointer min-w-0"
                    >
                      {/* Column 1: Group Icon & Name */}
                      <div className="col-span-7 sm:col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center overflow-hidden shrink-0">
                          {group.groupImage ? (
                            <img src={groupImageSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-yellow-500 text-lg">folder_shared</span>
                          )}
                        </div>
                        <span className="font-semibold text-sm text-on-surface truncate">{group.name}</span>
                      </div>

                      {/* Column 2: Members Count & Avatars */}
                      <div className="hidden sm:flex col-span-3 items-center gap-2 min-w-0">
                        <div className="flex -space-x-2 shrink-0">
                          {displayedMembers.map((member, idx) => (
                            <div
                              key={`${group.id}-member-${idx}`}
                              className="w-6.5 h-6.5 rounded-full border border-surface flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                              style={{ backgroundColor: getMemberColor(idx) }}
                              title={member?.user?.name}
                            >
                              {getInitials(member?.user?.name || '')}
                            </div>
                          ))}
                          {totalMembers > 3 && (
                            <div className="w-6.5 h-6.5 rounded-full border border-surface bg-surface-container-high flex items-center justify-center text-[9px] font-bold text-on-surface-variant shrink-0">
                              +{(totalMembers - 3)}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant hidden sm:inline shrink-0 font-medium">({totalMembers})</span>
                      </div>

                      {/* Column 3: Status & Action Exit Icon */}
                      <div className="col-span-5 sm:col-span-3 flex items-center gap-2.5 min-w-0">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full ${statusBg} text-[10px] font-bold shrink-0`}>
                          {statusText}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLeaveConfirm({ groupId: group.id, groupName: group.name });
                          }}
                          className="w-7 h-7 flex items-center justify-center text-error hover:bg-error/10 rounded-lg transition shrink-0 animate-fade-in"
                          title="Leave Group"
                        >
                          <span className="material-symbols-outlined text-base">logout</span>
                        </button>
                      </div>

                      {/* Column 4: Last Activity */}
                      <div className="hidden md:block col-span-2 text-right text-xs text-on-surface-variant truncate font-medium">
                        {index % 2 === 0 ? "2h ago" : "Yesterday"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Feed (Vertically Aligned) */}
        <div className="lg:col-span-4 glass-surface rounded-2xl p-6 border border-white/10 flex flex-col h-[480px]">
          <h4 className="font-headline-md text-headline-md text-on-surface mb-6">Recent Activity</h4>
          <div className="space-y-6 overflow-y-auto flex-1 pr-2 scrollbar-thin">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 text-on-surface-variant/40">history</span>
                <p className="text-sm font-semibold">No recent activity</p>
                <p className="text-xs mt-1 max-w-[200px]">Expenses, payments, messages, and friend requests will appear here.</p>
              </div>
            ) : (
              recentActivities.map((activity: any) => {
                const style = getActivityStyle(activity.type);
                return (
                  <div key={activity.id} className="flex gap-4 items-center">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl border ${style.bgColor} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${style.iconColor} text-body-lg`}>{style.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md text-on-surface font-semibold truncate leading-snug">
                        {activity.description}
                      </p>
                      <p className="text-label-sm text-on-surface-variant mt-0.5">
                        {activity.title} • {getActivityTime(activity.createdAt)}
                      </p>
                    </div>
                    {activity.amount !== undefined && (
                      <div className="text-right shrink-0">
                        <p className={`text-label-md font-bold ${
                          activity.type.includes('RECEIVED') || activity.type === 'SETTLEMENT_APPROVED_BY_YOU'
                            ? 'text-emerald-400' 
                            : activity.type.includes('ADDED_BY_YOU')
                              ? 'text-red-400'
                              : 'text-on-surface'
                        }`}>
                          {activity.type.includes('RECEIVED') || activity.type === 'SETTLEMENT_APPROVED_BY_YOU' ? '+' : ''}
                          {formatCurrency(activity.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating Create Group Button */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 hidden sm:block">Create a new group</span>
        <button
          onClick={() => {
            setModalStep(1);
            setFriendSearch("");
            setNewGroupName("");
            setNewGroupDesc("");
            setSelectedMemberIds([]);
            setSelectedCategory(GROUP_CATEGORIES[0].id);
            setShowCreateModal(true);
          }}
          className="bg-primary-container rounded-full w-12 h-12 flex justify-center items-center shadow-lg active:scale-90 transition-transform cursor-pointer hover:bg-inverse-primary"
        >
          <Plus className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-floating rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary-container mb-3">group</span>
              {modalStep === 1 ? (
                <>
                  <h2 className="text-xl font-bold text-on-surface">Create New Group</h2>
                  <p className="text-sm text-on-surface-variant text-center">Start tracking expenses with your friends</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-on-surface">Add your friends</h2>
                  <p className="text-sm text-on-surface-variant text-center">Select group members</p>
                </>
              )}
            </div>

            <div className="space-y-4">
              {modalStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant mb-1.5">Group Name</p>
                    <input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., Trip to Tokyo"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-container text-sm text-on-surface placeholder-on-surface-variant/40"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant mb-1.5">Group Description</p>
                    <textarea
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="e.g. Travel and food expenses sharing"
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-container text-sm resize-none text-on-surface placeholder-on-surface-variant/40"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant mb-1.5">Search Member</p>
                  <div className="relative">
                    <input
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      placeholder="Search Friend Name"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pr-9 outline-none focus:ring-2 focus:ring-primary-container text-sm text-on-surface placeholder-on-surface-variant/40"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  </div>

                  {selectedMemberIds.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-on-surface-variant mb-1.5">Added Friends</p>
                      <div className="flex items-center gap-1.5">
                        {acceptedFriends
                          .filter((f) => selectedMemberIds.includes(f.friendId))
                          .map((f, idx) => (
                            <div
                              key={f.friendId}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ backgroundColor: getMemberColor(idx) }}
                            >
                              {getInitials(f.friend.name)}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="text-xs font-bold text-on-surface-variant mb-1.5">Add Friends</p>
                    {acceptedFriends.length === 0 ? (
                      <p className="text-sm text-error">You have no accepted friends yet.</p>
                    ) : filteredFriends.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No friends match your search.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {filteredFriends.map((friend) => {
                          const isSelected = selectedMemberIds.includes(friend.friendId);
                          return (
                            <button
                              key={friend.friendId}
                              type="button"
                              onClick={() => {
                                setSelectedMemberIds((current) =>
                                  current.includes(friend.friendId)
                                    ? current.filter((id) => id !== friend.friendId)
                                    : [...current, friend.friendId]
                                );
                              }}
                              className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-left ${
                                isSelected
                                  ? 'border-primary-container bg-primary-container/10'
                                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-on-surface text-sm">{friend.friend.name}</p>
                                  <p className="text-[11px] text-on-surface-variant">{friend.friend.email}</p>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-primary-container' : 'bg-white/10'
                              }`}>
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold text-on-surface-variant cursor-pointer hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                {modalStep === 1 ? (
                  <button
                    onClick={() => setModalStep(2)}
                    disabled={newGroupName.trim().length === 0}
                    className="flex-1 py-3 bg-primary-container rounded-xl font-bold text-on-primary-container active:brightness-90 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleCreateGroup}
                    disabled={selectedMemberIds.length === 0}
                    className="flex-1 py-3 bg-primary-container rounded-xl font-bold text-on-primary-container active:brightness-90 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Create Group
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Confirmation Modal */}
      {leaveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-floating rounded-2xl w-full max-w-xs p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-3xl">logout</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Leave Group?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Are you sure you want to leave <span className="font-bold text-on-surface">"{leaveConfirm.groupName}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLeaveConfirm(null)}
                disabled={leaveLoading}
                className="flex-1 py-3 border border-white/10 rounded-xl font-bold text-on-surface-variant cursor-pointer hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!user) return;
                  setLeaveLoading(true);
                  try {
                    await leaveGroup(leaveConfirm.groupId, user.id);
                    setLeaveConfirm(null);
                  } catch (error) {
                    console.error('Failed to leave group', error);
                    alert('Failed to leave group. Please try again.');
                  } finally {
                    setLeaveLoading(false);
                  }
                }}
                disabled={leaveLoading}
                className="flex-1 py-3 bg-error rounded-xl font-bold text-on-error cursor-pointer active:bg-error-container disabled:opacity-50 transition-colors"
              >
                {leaveLoading ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Scanning Animation Modal */}
      {showOcrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-500">
          <div className="relative w-full max-w-lg mx-4">
            <div className="glass-floating rounded-3xl overflow-hidden p-8 flex flex-col items-center">
              <div className="relative w-64 h-80 bg-surface-container rounded-xl border border-primary-container/30 overflow-hidden mb-6 flex items-center justify-center">
                {/* Scanning Overlay */}
                <div className="scan-line absolute w-full left-0 z-20"></div>
                <div className="absolute inset-0 bg-primary-container/5 z-10"></div>
                <span className="material-symbols-outlined text-[80px] text-primary-container/40">document_scanner</span>
                {/* Simulating text detection points */}
                <div className="absolute top-1/4 left-1/4 w-12 h-2 bg-primary-container/40 rounded-full animate-pulse"></div>
                <div className="absolute top-1/3 right-1/3 w-16 h-2 bg-primary-container/20 rounded-full animate-pulse delay-75"></div>
                <div className="absolute bottom-1/4 left-1/3 w-20 h-2 bg-primary-container/30 rounded-full animate-pulse delay-150"></div>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary-container mb-2">Analyzing Receipt</h3>
              <p className="text-on-surface-variant text-center mb-8">AI is extracting line items and taxes...</p>
              <div className="flex gap-4 w-full">
                <button
                  className="flex-1 py-3 rounded-xl bg-white/5 text-on-surface-variant font-label-md border border-white/10 hover:bg-white/10 transition-colors"
                  onClick={() => setShowOcrModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container font-label-md shadow-lg shadow-primary-container/20 hover:bg-inverse-primary"
                  onClick={() => setShowOcrModal(false)}
                >
                  Review Splits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseMain;
