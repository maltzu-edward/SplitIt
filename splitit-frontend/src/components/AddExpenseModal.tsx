import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Users, Split, Percent, Plus } from "lucide-react";
import { cn } from "../utils/cn";
import useFriendStore from "../store/FriendStore";

type SplitType = "equally" | "exact" | "percentage";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string; // Optional if adding directly from friend
}

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'other', label: 'Other', icon: '📦' },
];

export default function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  
  const [splitType, setSplitType] = useState<SplitType>("equally");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  
  const { acceptedFriends } = useFriendStore();

  const handleNext = () => {
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const handleSubmit = () => {
    // Mock submit for now
    console.log("Submitting Expense:", { title, amount, category, splitType, selectedFriends });
    // Reset state
    setStep(1);
    setTitle("");
    setAmount("");
    setCategory("food");
    setSplitType("equally");
    setSelectedFriends([]);
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => 
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative bg-white w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <button 
                onClick={step > 1 ? handleBack : handleClose}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {step > 1 ? <span className="font-semibold text-blue-600 text-sm">Back</span> : <X className="w-6 h-6" />}
              </button>
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={cn(
                      "h-2 w-8 rounded-full transition-colors",
                      step >= s ? "bg-blue-600" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {step === 1 && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800">Add an Expense</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-2 uppercase">Amount (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-12 text-2xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          placeholder="0"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-2 uppercase">Description</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        placeholder="What was this for?"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-2 uppercase">Category</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={cn(
                              "flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border transition-all",
                              category === cat.id 
                                ? "bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-sm" 
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span>{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800">How to split?</h2>
                  <p className="text-gray-500">Choose how you want to divide the cost.</p>
                  
                  <div className="space-y-3">
                    {[
                      { id: "equally", label: "Split Equally", icon: Users, desc: "Everyone pays the same amount" },
                      { id: "exact", label: "Exact Amounts", icon: Split, desc: "Specify exact amounts for each person" },
                      { id: "percentage", label: "By Percentage", icon: Percent, desc: "Split by custom percentages" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSplitType(type.id as SplitType)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                          splitType === type.id 
                            ? "bg-blue-50 border-blue-600 shadow-sm" 
                            : "bg-white border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className={cn(
                          "p-3 rounded-xl",
                          splitType === type.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                        )}>
                          <type.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className={cn("font-bold text-lg", splitType === type.id ? "text-blue-900" : "text-gray-800")}>{type.label}</div>
                          <div className={cn("text-sm", splitType === type.id ? "text-blue-700" : "text-gray-500")}>{type.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  className="space-y-6 h-full flex flex-col"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Who is involved?</h2>
                    <p className="text-gray-500">Select friends to split this with.</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pb-20">
                    {acceptedFriends.length === 0 ? (
                      <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-gray-500">You don't have any friends to split with yet.</p>
                      </div>
                    ) : (
                      acceptedFriends.map((f) => (
                        <button
                          key={f.friendId}
                          onClick={() => toggleFriend(f.friendId)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                            selectedFriends.includes(f.friendId)
                              ? "bg-blue-50 border-blue-600"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {f.friend.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-gray-800">{f.friend.name}</div>
                              <div className="text-xs text-gray-500">{f.friend.email}</div>
                            </div>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            selectedFriends.includes(f.friendId)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300"
                          )}>
                            {selectedFriends.includes(f.friendId) && <Check className="w-4 h-4" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-5 border-t border-gray-100 bg-white">
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={step === 1 && (!title || !amount)}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 active:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={selectedFriends.length === 0}
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 active:bg-green-700 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  Create Expense
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
