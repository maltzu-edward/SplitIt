import { Camera, Edit2, Check, X, Clipboard, CheckSquare } from "lucide-react";
import useUserAuth from "../store/UserAuthStore";
import { useState, useEffect } from "react";

function UserProfile() {
  const user = useUserAuth((s) => s.user);
  const updateProfile = useUserAuth((s) => s.updateProfile);

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNameInput(user.name);
    }
  }, [user]);

  const handleCopy = async () => {
    if (user?.id) {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user || !nameInput.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user.id, nameInput.trim(), selectedFile || undefined);
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNameInput(user?.name ?? "");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    const parts = name?.trim().split(" ").filter(Boolean) || [];
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="pt-20 md:pt-24 px-4 md:pl-16 md:pr-margin-desktop pb-24 md:pb-12 min-h-screen flex flex-col items-center justify-center">
      <div className="glass-floating w-full max-w-md p-8 rounded-3xl flex flex-col items-center shadow-2xl border border-white/10 relative">
        
        {/* Edit mode toggle button (only in read mode) */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white transition-all cursor-pointer border border-white/5"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}

        {/* Profile Picture Area */}
        <div className="relative group mb-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-primary-container/40 flex items-center justify-center bg-primary-container/20 shadow-xl relative">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : user?.profileImage ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"}${user.profileImage}`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black">
                {getInitials(user?.name || "?")}
              </div>
            )}

            {isEditing && (
              <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider">Change</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        {/* Profile Name & Email */}
        {isEditing ? (
          <div className="w-full mb-6">
            <label className="text-xs font-bold text-on-surface-variant block mb-1.5 uppercase tracking-wider">
              Display Name
            </label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter display name"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary-container text-sm text-on-surface placeholder-on-surface-variant/40"
            />
          </div>
        ) : (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-on-surface mb-1">{user?.name}</h2>
            <p className="text-on-surface-variant text-sm">{user?.email}</p>
          </div>
        )}

        {/* Actions for Edit Mode */}
        {isEditing && (
          <div className="flex gap-3 w-full mb-6">
            <button
              onClick={handleSave}
              disabled={saving || !nameInput.trim()}
              className="flex-1 py-3 bg-success hover:bg-success/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              {saving ? (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-on-surface transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}

        {/* User ID Section */}
        <div className="w-full">
          <div className="glass-surface p-5 rounded-2xl border border-white/10">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              USER ID (Share this with friends)
            </p>
            <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <span className="flex-1 text-xs font-mono px-4 py-3 text-on-surface break-all select-all">
                {user?.id}
              </span>
              <button
                onClick={handleCopy}
                className="flex h-full items-center justify-center px-4 py-3 border-l border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Copy ID"
              >
                {copied ? (
                  <CheckSquare className="w-4 h-4 text-success" />
                ) : (
                  <Clipboard className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default UserProfile;
