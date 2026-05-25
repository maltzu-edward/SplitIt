import { ChevronRight, X, Plus, User, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderTagline from "../components/header/HeaderTagline";
import Header from "../components/header/Header";
import useGroupStore from "../store/GroupStore";
import useUserAuth from "../store/UserAuthStore";
import useFriendStore from "../store/FriendStore";
import useExpenseStore from "../store/ExpenseStore";
import BottomNav from "../components/navigation/BottomNav";

const GROUP_CATEGORIES = [
  { id: 'food', label: 'Food', image: '/food.svg' },
  { id: 'electricity', label: 'Electricity', image: '/electricity.svg' },
  { id: 'household', label: 'Household', image: '/household.svg' },
  { id: 'bills', label: 'Other Bills', image: '/bills.svg' },
];

function ExpenseMain() {
  const [search, setSearch] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [friendSearch, setFriendSearch] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(GROUP_CATEGORIES[0].id);
  const [leaveConfirm, setLeaveConfirm] = useState<{ groupId: string; groupName: string } | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  
  const navigate = useNavigate();
  const user = useUserAuth((s) => s.user);
  const { groups, fetchGroups, createGroup, leaveGroup, loading } = useGroupStore();
  const { acceptedFriends, fetchFriends } = useFriendStore();
  const { summary, fetchUserSummary } = useExpenseStore();

  useEffect(() => {
    if (user) {
      fetchGroups(user.id);
      fetchFriends(user.id);
      fetchUserSummary(user.id);
    }
  }, [user, fetchGroups, fetchFriends, fetchUserSummary]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

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

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFriends = acceptedFriends.filter((friend) =>
    friend.friend.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    friend.friend.email.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
      <Header />

      <HeaderTagline
        title="Your Group"
        subtitle="Track shared expenses with friends"
        onChange={setSearch}
        value={search}
        placeholder="Search Group"
      />

      <div className="flex-1 overflow-y-auto px-4 pb-24 mt-4">
        {summary && (
          <div className="grid grid-cols-2 gap-3 mb-3 p-4 rounded-xl to-indigo-50/30">
            <div className="flex flex-col bg-white/80 p-3.5 rounded-xl shadow-sm transition-all active:scale-[0.99] hover:bg-white duration-200">
              <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase">You Owe</span>
              <span className="text-base font-extrabold text-red-500 mt-1 font-mono">
                {formatCurrency(summary.totalOwed)}
              </span>
            </div>
            <div className="flex flex-col bg-white/80 p-3.5 rounded-xl shadow-sm transition-all active:scale-[0.99] hover:bg-white duration-200">
              <span className="text-[10px] font-bold text-green-400 tracking-wider uppercase">Owed to You</span>
              <span className="text-base font-extrabold text-green-600 mt-1 font-mono">
                {formatCurrency(summary.totalOwe)}
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {!loading && filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full mt-[-50px]">
            <img
              src="/GroupLogo.png"
              alt="Group Logo"
              className="w-32 h-32 object-contain"
            />
            <p className="text-base font-bold text-black mt-4">
              {groups.length === 0 && search.trim() === "" ? "You don't have any groups yet." : "No groups match your search."}
            </p>
            <p className="text-sm text-gray-400">
              {groups.length === 0 && search.trim() === "" ? "Join or create one to get started" : "Try another group name."}
            </p>
          </div>
        )}

        {!loading && filteredGroups.map((group) => {
          const groupImageSrc = group.groupImage || '/GroupLogo.png';
          const totalMembers = (group as any)._count?.members || group.members?.length || 0;
          const displayedMembers = group.members?.slice(0, 3) || [];
          
          return (
            <div
              key={group.id}
              className="rounded-2xl border border-gray-200 bg-white w-full p-4 mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <div className="flex items-center gap-3">
                {/* Group Image */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                  <img
                    src={groupImageSrc}
                    alt="Group Icon"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{group.name}</p>
                  {/* Member Avatars */}
                  <div className="flex items-center mt-1 -space-x-1.5">
                    {displayedMembers.map((member, index) => (
                      <div
                        key={`${group.id}-member-${index}`}
                        className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: getMemberColor(index) }}
                      >
                        {getInitials(member?.user?.name || '')}
                      </div>
                    ))}
                    {totalMembers > 3 && (
                      <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-700">
                        +{totalMembers - 3}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium ml-3">
                      {totalMembers} Members
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLeaveConfirm({ groupId: group.id, groupName: group.name });
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer active:bg-red-100 transition shrink-0"
                >
                  Leave
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            </div>
          );
        })}

      </div>
     
      {/* Create Group Modal — Step 1: Group Name & Description */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <img src="/Groups.png" alt="Group Logo" className="w-14 h-14 mb-3" />
              {modalStep === 1 ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
                  <p className="text-sm text-gray-500 text-center">Start tracking expenses with your friends</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Add your friends</h2>
                  <p className="text-sm text-gray-500 text-center">Use the search bar to find your friends easily</p>
                </>
              )}
            </div>

            <div className="space-y-4">
              {modalStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1.5">Group Name</p>
                    <input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., KFC Party part 2"
                      className="w-full bg-gray-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1.5">Group Description</p>
                    <textarea
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="e.g. For our trip to KFC Again!"
                      rows={4}
                      className="w-full bg-gray-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1.5">Search Member</p>
                  <div className="relative">
                    <input
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      placeholder="Search Friend"
                      className="w-full bg-gray-100 rounded-lg p-3 pr-9 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                  </div>

                  {/* Added Friends (selected) */}
                  {selectedMemberIds.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-500 mb-1.5">Added Friends</p>
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

                  {/* Friend List */}
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-500 mb-1.5">Add Friends</p>
                    {acceptedFriends.length === 0 ? (
                      <p className="text-sm text-red-500">You have no accepted friends yet. Invite friends first.</p>
                    ) : filteredFriends.length === 0 ? (
                      <p className="text-sm text-gray-500">No friends match your search.</p>
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
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">{friend.friend.name}</p>
                                  <p className="text-[11px] text-gray-500">{friend.friend.email}</p>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-blue-600' : 'bg-gray-200'
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
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 cursor-pointer active:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {modalStep === 1 ? (
                  <button
                    onClick={() => setModalStep(2)}
                    disabled={newGroupName.trim().length === 0}
                    className="flex-1 py-3 bg-[var(--fun-color-primary)] rounded-xl font-bold text-white active:brightness-90 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleCreateGroup}
                    disabled={selectedMemberIds.length === 0}
                    className="flex-1 py-3 bg-[var(--fun-color-primary)] rounded-xl font-bold text-white active:brightness-90 disabled:opacity-50 cursor-pointer transition-all"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Leave Group?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to leave <span className="font-bold text-gray-700">"{leaveConfirm.groupName}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLeaveConfirm(null)}
                disabled={leaveLoading}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 cursor-pointer active:bg-gray-50 transition-colors"
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
                className="flex-1 py-3 bg-red-500 rounded-xl font-bold text-white cursor-pointer active:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {leaveLoading ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Group Button */}
      <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500">Create a new group</span>
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

export default ExpenseMain;
