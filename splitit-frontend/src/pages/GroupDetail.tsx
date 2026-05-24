import { ArrowLeft, Plus, X, Receipt, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useExpenseStore from "../store/ExpenseStore";
import useUserAuth from "../store/UserAuthStore";
import useFriendStore from "../store/FriendStore";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

interface GroupDetailData {
  id: string;
  name: string;
  groupImage?: string;
  members: Array<{
    id: string;
    user: { id: string; name: string; email: string };
  }>;
}

interface SplitInput {
  description: string;
  amount: string;
}

function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const user = useUserAuth((s) => s.user);
  const { expenses, fetchGroupExpenses, addExpense, loading: expenseLoading } = useExpenseStore();
  const { acceptedFriends, fetchFriends } = useFriendStore();

  const [group, setGroup] = useState<GroupDetailData | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);

  // Add Expense Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [memberSplits, setMemberSplits] = useState<Record<string, SplitInput>>({});

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetail();
      fetchGroupExpenses(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    if (user) fetchFriends(user.id);
  }, [user]);

  const fetchGroupDetail = async () => {
    if (!groupId) return;
    setGroupLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/groups/${groupId}`, { withCredentials: true });
      setGroup(res.data);
    } catch (e) { console.error(e); }
    finally { setGroupLoading(false); }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getInitials = (name: string) => {
    const p = name.trim().split(" ").filter(Boolean);
    if (p.length === 0) return "?";
    return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
  const memberCount = group?.members?.length || 1;

  // --- Debt calculation from splits ---
  const debts: { fromId: string; fromName: string; toId: string; toName: string; amount: number }[] = [];
  expenses.forEach((exp: any) => {
    if (!exp.splits || exp.splits.length === 0) return;
    exp.splits.forEach((split: any) => {
      if (split.userId !== exp.payerId && split.amount > 0) {
        debts.push({
          fromId: split.userId,
          fromName: split.user?.name || "Unknown",
          toId: exp.payerId,
          toName: exp.payer?.name || "Unknown",
          amount: split.amount,
        });
      }
    });
  });

  // Aggregate debts
  const debtMap = new Map<string, { fromName: string; toName: string; amount: number }>();
  debts.forEach((d) => {
    const key = `${d.fromId}->${d.toId}`;
    const existing = debtMap.get(key);
    if (existing) existing.amount += d.amount;
    else debtMap.set(key, { fromName: d.fromName, toName: d.toName, amount: d.amount });
  });

  const peopleOweYou = Array.from(debtMap.entries())
    .filter(([k]) => k.endsWith(`->${user?.id}`))
    .map(([, v]) => v);

  const youOwe = Array.from(debtMap.entries())
    .filter(([k]) => k.startsWith(`${user?.id}->`))
    .map(([, v]) => v);

  // --- Modal handlers ---
  const openAddModal = () => {
    setExpenseTitle("");
    const initial: Record<string, SplitInput> = {};
    group?.members.forEach((m) => { initial[m.user.id] = { description: "", amount: "" }; });
    setMemberSplits(initial);
    setShowAddModal(true);
  };

  const totalSplitAmount = Object.values(memberSplits).reduce((s, v) => s + (parseFloat(v.amount) || 0), 0);

  const handleSubmitExpense = async () => {
    if (!user || !groupId || !expenseTitle.trim() || totalSplitAmount <= 0) return;
    const splits = Object.entries(memberSplits)
      .filter(([, v]) => parseFloat(v.amount) > 0)
      .map(([userId, v]) => ({ userId, amount: parseFloat(v.amount), description: v.description || undefined }));
    if (splits.length === 0) return;
    try {
      await addExpense({ title: expenseTitle.trim(), amount: totalSplitAmount, groupId, payerId: user.id, splits });
      setShowAddModal(false);
      await fetchGroupExpenses(groupId);
    } catch (e) { console.error(e); }
  };

  const handleAddMembers = async () => {
    if (!groupId || selectedNewMembers.length === 0) return;
    setAddMemberLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/groups/${groupId}/members`, { memberIds: selectedNewMembers }, { withCredentials: true });
      setShowAddMemberModal(false);
      setSelectedNewMembers([]);
      setMemberSearch("");
      await fetchGroupDetail();
    } catch (e) { console.error(e); alert("Failed to add members."); }
    finally { setAddMemberLoading(false); }
  };

  const existingMemberIds = group?.members?.map((m) => m.user.id) || [];
  const availableFriends = acceptedFriends.filter(
    (f) => !existingMemberIds.includes(f.friendId) &&
      (f.friend.name.toLowerCase().includes(memberSearch.toLowerCase()) || f.friend.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  if (groupLoading) return (
    <div className="h-screen w-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!group) return (
    <div className="h-screen w-screen bg-white flex flex-col items-center justify-center gap-4">
      <p className="text-lg font-bold">Group not found</p>
      <button onClick={() => navigate("/expense")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Go Back</button>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/expense")} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
          <img src={group.groupImage || "/GroupLogo.png"} alt="Group" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{group.name}</h1>
          <p className="text-xs text-gray-500">{memberCount} members</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Members */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Members</p>
            <button onClick={() => { setShowAddMemberModal(true); setSelectedNewMembers([]); setMemberSearch(""); }}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 cursor-pointer">
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {group.members.map((m, i) => (
              <div key={m.id} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                  {getInitials(m.user.name)}
                </div>
                <p className="text-[10px] text-gray-500 font-medium max-w-[56px] truncate">{m.user.id === user?.id ? "You" : m.user.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* People Who Owe You */}
        {peopleOweYou.length > 0 && (
          <div className="px-4 pt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">People Who Owe You</p>
            {peopleOweYou.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 mb-2 bg-white rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-bold text-gray-900">{d.fromName}</p>
                  <p className="text-[11px] text-gray-500">Hasn't paid yet</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">{formatCurrency(d.amount)}</p>
                  <p className="text-[10px] text-red-400">Owes You</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* You Owe */}
        {youOwe.length > 0 && (
          <div className="px-4 pt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">You Owe</p>
            {youOwe.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 mb-2 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <p className="text-sm font-bold text-gray-900">{d.toName}</p>
                  <p className="text-[11px] text-gray-500">You need to pay</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(d.amount)}</p>
                  <p className="text-[10px] text-green-500">You Owe</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expenses */}
        <div className="px-4 pt-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Expenses</p>
          {expenseLoading && <p className="text-center text-sm text-gray-500">Loading...</p>}

          {!expenseLoading && expenses.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                <Receipt className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-sm font-bold text-gray-800">No expenses yet</p>
              <p className="text-xs text-gray-500 mt-1">Tap + to add a bill</p>
            </div>
          )}

          {!expenseLoading && expenses.map((exp: any) => {
            const isPayer = exp.payerId === user?.id;
            return (
              <div key={exp.id} className={`rounded-xl p-4 mb-3 border ${isPayer ? 'bg-white border-gray-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{exp.title}</p>
                    <p className="text-[11px] text-gray-500">{formatDate(exp.createdAt)}</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{formatCurrency(exp.amount)}</p>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  <span className="font-semibold">{isPayer ? "You" : exp.payer?.name}</span> Paid · Split Among {exp.splits?.length || memberCount} People
                </p>
                {/* Show individual splits */}
                {exp.splits && exp.splits.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    {exp.splits.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {s.user?.id === user?.id ? "You" : s.user?.name}: <span className="text-gray-400">{s.description || "—"}</span>
                        </span>
                        <span className="font-bold text-gray-700">{formatCurrency(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Show "You Owe" if not payer */}
                {!isPayer && exp.splits?.find((s: any) => s.userId === user?.id) && (
                  <div className="mt-2 text-right">
                    <span className="text-xs font-bold text-green-600">
                      You Owe {formatCurrency(exp.splits.find((s: any) => s.userId === user?.id)?.amount || 0)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={openAddModal} className="bg-[var(--fun-color-primary)] rounded-full w-14 h-14 flex justify-center items-center shadow-lg active:scale-90 transition-transform cursor-pointer">
          <Plus className="text-white w-8 h-8" />
        </button>
      </div>

      {/* === ADD EXPENSE MODAL (Per-Item Split) === */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg shadow-2xl" style={{ maxHeight: "92vh" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Bill</h2>
                  <p className="text-xs text-gray-500">Assign items to each person</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: "75vh" }}>
              {/* Bill Title */}
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Bill Name</label>
                <input value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} placeholder="e.g., KFC Lunch"
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              {/* Per-member items */}
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">What did each person order?</label>
              <div className="space-y-3 mb-4">
                {group?.members.map((m, i) => {
                  const split = memberSplits[m.user.id] || { description: "", amount: "" };
                  return (
                    <div key={m.id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                          {getInitials(m.user.name)}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{m.user.id === user?.id ? "You" : m.user.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <input value={split.description}
                          onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user.id]: { ...p[m.user.id], description: e.target.value } }))}
                          placeholder="What they ordered"
                          className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                          <input type="number" value={split.amount}
                            onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user.id]: { ...p[m.user.id], amount: e.target.value } }))}
                            placeholder="0"
                            className="w-full bg-gray-50 rounded-lg pl-8 pr-3 py-2 text-sm text-right font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">Total Bill</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(totalSplitAmount)}</span>
              </div>

              {/* Submit */}
              <button onClick={handleSubmitExpense}
                disabled={!expenseTitle.trim() || totalSplitAmount <= 0}
                className="w-full py-3.5 bg-[var(--fun-color-primary)] rounded-xl font-bold text-white active:brightness-90 disabled:opacity-50 cursor-pointer transition-all">
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === ADD MEMBER MODAL === */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
            <button onClick={() => setShowAddMemberModal(false)} className="absolute top-4 right-4 text-gray-400 cursor-pointer"><X className="w-6 h-6" /></button>
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3"><UserPlus className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-xl font-bold">Add Members</h2>
              <p className="text-sm text-gray-500 text-center">Add friends to "{group.name}"</p>
            </div>
            <div className="mb-4">
              <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search friend"
                className="w-full bg-gray-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            {availableFriends.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No friends available to add.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto mb-4">
                {availableFriends.map((f) => (
                  <label key={f.friendId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{f.friend.name}</p>
                      <p className="text-[11px] text-gray-500">{f.friend.email}</p>
                    </div>
                    <input type="checkbox" checked={selectedNewMembers.includes(f.friendId)}
                      onChange={() => setSelectedNewMembers((c) => c.includes(f.friendId) ? c.filter((id) => id !== f.friendId) : [...c, f.friendId])}
                      className="w-5 h-5 accent-blue-600" />
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddMemberModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 cursor-pointer">Cancel</button>
              <button onClick={handleAddMembers} disabled={selectedNewMembers.length === 0 || addMemberLoading}
                className="flex-1 py-3 bg-[var(--fun-color-primary)] rounded-xl font-bold text-white disabled:opacity-50 cursor-pointer">
                {addMemberLoading ? "Adding..." : `Add (${selectedNewMembers.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetail;
