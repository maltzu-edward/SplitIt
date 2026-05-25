import { ArrowLeft, Plus, X, Receipt, UserPlus, User, ImageIcon, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useExpenseStore from "../store/ExpenseStore";
import useUserAuth from "../store/UserAuthStore";
import useFriendStore from "../store/FriendStore";
import BottomNav from "../components/navigation/BottomNav";
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

interface SplitDebtItem {
  splitId: string;
  expenseTitle: string;
  personName: string;
  personId: string;
  amount: number;
  isPaid: boolean;
  isValidated: boolean;
  paymentProof?: string;
  paidAt?: string;
}

function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const user = useUserAuth((s) => s.user);
  const { expenses, fetchGroupExpenses, addExpense, submitPaymentProof, loading: expenseLoading } = useExpenseStore();
  const { acceptedFriends, fetchFriends } = useFriendStore();

  const [group, setGroup] = useState<GroupDetailData | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [memberSplits, setMemberSplits] = useState<Record<string, SplitInput>>({});

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  const [showProofModal, setShowProofModal] = useState(false);
  const [proofSplitId, setProofSplitId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR scan state
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<{ title: string; items: { name: string; price: number }[]; total: number } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

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
    new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });

  const getInitials = (name: string) => {
    const p = name.trim().split(" ").filter(Boolean);
    if (p.length === 0) return "?";
    return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
  const memberCount = group?.members?.length || 1;

  const peopleOweYouItems: SplitDebtItem[] = expenses.flatMap((exp: any) => {
    if (exp.payerId !== user?.id) return [];
    return (exp.splits || [])
      .filter((s: any) => s.userId !== user?.id && s.amount > 0)
      .map((s: any) => ({
        splitId: s.id,
        expenseTitle: exp.title,
        personName: s.user?.name || "Unknown",
        personId: s.userId,
        amount: s.amount,
        isPaid: s.isPaid ?? false,
        isValidated: s.isValidated ?? false,
        paymentProof: s.paymentProof ?? undefined,
        paidAt: s.paidAt ?? undefined,
      }));
  });

  const openAddModal = () => {
    setExpenseTitle("");
    setScannedReceipt(null);
    const initial: Record<string, SplitInput> = {};
    group?.members.forEach((m) => { initial[m.user.id] = { description: "", amount: "" }; });
    setMemberSplits(initial);
    setShowAddModal(true);
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningReceipt(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/ocr/scan`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setScannedReceipt(data);
      if (data.title) setExpenseTitle(data.title);
    } catch (err) {
      console.error('OCR scan error:', err);
      alert('Gagal memindai struk. Coba lagi.');
    } finally {
      setScanningReceipt(false);
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
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

  const openProofModal = (splitId: string) => {
    setProofSplitId(splitId);
    setProofFile(null);
    setProofPreview(null);
    setShowProofModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitProof = async () => {
    if (!proofSplitId || !proofFile) return;
    setUploadingProof(true);
    try {
      await submitPaymentProof(proofSplitId, proofFile);
      setShowProofModal(false);
      setProofFile(null);
      setProofPreview(null);
      await fetchGroupExpenses(groupId!);
    } catch (e) { console.error(e); }
    finally { setUploadingProof(false); }
  };

  const openValidationPage = (item: SplitDebtItem) => {
    navigate(`/payment-validation/${item.splitId}`, {
      state: {
        splitId: item.splitId,
        personName: item.personName,
        expenseTitle: item.expenseTitle,
        amount: item.amount,
        paymentProof: item.paymentProof,
        paidAt: item.paidAt,
        groupId,
      },
    });
  };

  const existingMemberIds = group?.members?.map((m) => m.user.id) || [];
  const availableFriends = acceptedFriends.filter(
    (f) => !existingMemberIds.includes(f.friendId) &&
      (f.friend.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        f.friend.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  if (groupLoading) return (
    <div className="h-screen w-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!group) return (
    <div className="h-screen w-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
      <p className="text-lg font-bold dark:text-white">Group not found</p>
      <button onClick={() => navigate("/expense")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Go Back</button>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/expense")} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shrink-0">
          <img src={group.groupImage || "/GroupLogo.png"} alt="Group" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{group.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{memberCount} members</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-36">
        {/* Members */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Members</p>
            <button
              onClick={() => { setShowAddMemberModal(true); setSelectedNewMembers([]); setMemberSearch(""); }}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {group.members.map((m, i) => (
              <div key={m.id} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                  {getInitials(m.user.name)}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium max-w-[56px] truncate">
                  {m.user.id === user?.id ? "You" : m.user.name.split(" ")[0]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* People Who Owe You */}
        {peopleOweYouItems.length > 0 && (
          <div className="px-4 pt-3">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">People Who Owe You</p>
            {peopleOweYouItems.map((item) => (
              <div key={item.splitId} className="flex items-center justify-between p-3 mb-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.isValidated ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {item.isValidated
                      ? <CheckCircle className="w-5 h-5 text-green-500" />
                      : <User className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.personName}</p>
                    {item.isValidated && <p className="text-[11px] text-green-600 font-medium">Settled ✓</p>}
                    {!item.isValidated && item.isPaid && <p className="text-[11px] text-blue-500 font-medium">Has paid · Waiting validation</p>}
                    {!item.isValidated && !item.isPaid && <p className="text-[11px] text-gray-400 dark:text-gray-500">Hasn't paid yet</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p className={`text-sm font-bold ${item.isValidated ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(item.amount)}
                  </p>
                  <p className={`text-[10px] font-semibold ${item.isValidated ? 'text-green-400' : 'text-red-400'}`}>
                    {item.isValidated ? 'Settled' : 'Owes You'}
                  </p>
                  {item.isPaid && !item.isValidated && (
                    <button
                      onClick={() => openValidationPage(item)}
                      className="px-3 py-1 bg-green-500 text-white text-[11px] font-bold rounded-lg active:brightness-90 cursor-pointer mt-0.5"
                    >
                      Validate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Your Expense */}
        <div className="px-4 pt-3">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Your Expense</p>
          {expenseLoading && <p className="text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>}

          {!expenseLoading && expenses.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                <Receipt className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">No expenses yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tap + to add a bill</p>
            </div>
          )}

          {!expenseLoading && expenses
            .filter((exp: any) => {
              const isPayer = exp.payerId === user?.id;
              const hasSplit = exp.splits?.some((s: any) => s.userId === user?.id && s.amount > 0);
              return isPayer || hasSplit;
            })
            .map((exp: any) => {
              const isPayer = exp.payerId === user?.id;
              const mySplit = !isPayer ? exp.splits?.find((s: any) => s.userId === user?.id) : null;
              const isPaid = mySplit?.isPaid ?? false;
              const isValidated = mySplit?.isValidated ?? false;
              const splitCount = exp.splits?.filter((s: any) => s.amount > 0).length || memberCount;

              const cardClass = isPayer
                ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-800'
                : isValidated
                  ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';

              return (
                <div key={exp.id} className={`rounded-2xl p-4 mb-3 border-2 ${cardClass}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-xl shrink-0">
                      🧾
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{exp.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{formatDate(exp.createdAt)}</p>
                      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                        {isPayer ? "You" : exp.payer?.name} Paid
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Split Among {splitCount} People.</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(exp.amount)}</p>

                      {!isPayer && mySplit && (
                        isValidated
                          ? <p className="text-[11px] font-bold text-green-600">Settled ✓</p>
                          : isPaid
                            ? <p className="text-[10px] font-semibold text-orange-500">Waiting...</p>
                            : <p className="text-[11px] font-bold text-red-500">
                                You Owe {formatCurrency(mySplit.amount)}
                              </p>
                      )}

                      {!isPayer && mySplit && !isPaid && !isValidated && (
                        <button
                          onClick={() => openProofModal(mySplit.id)}
                          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl active:brightness-90 cursor-pointer whitespace-nowrap"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <BottomNav />

      {/* FAB */}
      <div className="fixed bottom-20 right-6 z-40">
        <button onClick={openAddModal} className="bg-[var(--fun-color-primary)] rounded-full w-14 h-14 flex justify-center items-center shadow-lg active:scale-90 transition-transform cursor-pointer">
          <Plus className="text-white w-8 h-8" />
        </button>
      </div>

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upload Bukti Pembayaran</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Foto struk transfer atau bukti bayar</p>
              </div>
              <button onClick={() => setShowProofModal(false)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>

            <div className="px-5 pb-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors mb-4 overflow-hidden"
                style={{ minHeight: 200 }}
              >
                {proofPreview ? (
                  <img src={proofPreview} alt="Preview" className="w-full max-h-56 object-contain" />
                ) : (
                  <div className="flex flex-col items-center py-10 gap-2 text-gray-400 dark:text-gray-500">
                    <ImageIcon className="w-10 h-10" />
                    <p className="text-sm font-medium">Klik untuk pilih foto</p>
                    <p className="text-xs">JPG, PNG — maks 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={handleSubmitProof}
                disabled={!proofFile || uploadingProof}
                className="w-full py-3.5 bg-blue-600 rounded-xl font-bold text-white active:brightness-90 disabled:opacity-50 cursor-pointer transition-all"
              >
                {uploadingProof ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg shadow-2xl" style={{ maxHeight: "92vh" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Bill</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Assign items to each person</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>

            <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: "75vh" }}>
              {/* Scan Struk Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => scanInputRef.current?.click()}
                  disabled={scanningReceipt}
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {scanningReceipt ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Memindai struk...
                    </>
                  ) : (
                    <>📷 Scan Struk Otomatis</>
                  )}
                </button>
                <input
                  ref={scanInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScanReceipt}
                />
              </div>

              {/* Scanned receipt info */}
              {scannedReceipt && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">✓ Struk berhasil dipindai</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Total terdeteksi: <span className="font-bold">{formatCurrency(scannedReceipt.total)}</span></p>
                  {scannedReceipt.items.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {scannedReceipt.items.map((item, i) => (
                        <p key={i} className="text-[11px] text-green-600 dark:text-green-400">• {item.name} {formatCurrency(item.price)}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1.5">Bill Name</label>
                <input
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g., KFC Lunch"
                  className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">What did each person order?</label>
              <div className="space-y-3 mb-4">
                {group?.members.map((m, i) => {
                  const split = memberSplits[m.user.id] || { description: "", amount: "" };
                  return (
                    <div key={m.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 dark:bg-gray-750">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                          {getInitials(m.user.name)}
                        </div>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{m.user.id === user?.id ? "You" : m.user.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={split.description}
                          onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user.id]: { ...p[m.user.id], description: e.target.value } }))}
                          placeholder={m.user.id === user?.id ? "What you ordered" : "What they ordered"}
                          className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500">Rp</span>
                          <input
                            type="number"
                            value={split.amount}
                            onChange={(e) => setMemberSplits((p) => ({ ...p, [m.user.id]: { ...p[m.user.id], amount: e.target.value } }))}
                            placeholder="0"
                            className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-right font-bold outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">Total Bill</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalSplitAmount)}</span>
              </div>

              <button
                onClick={handleSubmitExpense}
                disabled={!expenseTitle.trim() || totalSplitAmount <= 0}
                className="w-full py-3.5 bg-[var(--fun-color-primary)] rounded-xl font-bold text-white active:brightness-90 disabled:opacity-50 cursor-pointer transition-all"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
            <button onClick={() => setShowAddMemberModal(false)} className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold dark:text-white">Add Members</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Add friends to "{group.name}"</p>
            </div>
            <div className="mb-4">
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search friend"
                className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            {availableFriends.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No friends available to add.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto mb-4">
                {availableFriends.map((f) => (
                  <label key={f.friendId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{f.friend.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{f.friend.email}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedNewMembers.includes(f.friendId)}
                      onChange={() => setSelectedNewMembers((c) => c.includes(f.friendId) ? c.filter((id) => id !== f.friendId) : [...c, f.friendId])}
                      className="w-5 h-5 accent-blue-600"
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddMemberModal(false)} className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 cursor-pointer">Cancel</button>
              <button
                onClick={handleAddMembers}
                disabled={selectedNewMembers.length === 0 || addMemberLoading}
                className="flex-1 py-3 bg-[var(--fun-color-primary)] rounded-xl font-bold text-white disabled:opacity-50 cursor-pointer"
              >
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
