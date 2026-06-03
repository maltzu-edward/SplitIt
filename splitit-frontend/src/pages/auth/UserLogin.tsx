import { useState } from 'react';
import useUserAuth from "../../store/UserAuthStore";
import { useNavigate, Link } from "react-router-dom";

function UserLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = useUserAuth((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            navigate("/expense");
        } catch (err: any) {
            setError(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background font-body-md text-on-surface">
            {/* Left Side: Visual Illustration (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-lowest overflow-hidden items-center justify-center p-12">
                {/* Abstract Financial Nodes Illustration */}
                <div className="relative z-10 w-full max-w-lg aspect-square flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary-container/5 rounded-full blur-[120px]"></div>
                    {/* Center Hub */}
                    <div className="glass-panel w-48 h-48 rounded-3xl flex flex-col items-center justify-center z-20 floating">
                        <span className="material-symbols-outlined text-primary-container text-[64px] mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
                            account_balance_wallet
                        </span>
                        <span className="font-headline-md text-headline-md text-primary-container">SplitIt</span>
                    </div>
                    {/* Orbiting Nodes */}
                    <div className="absolute top-[10%] left-[50%] -translate-x-1/2 -translate-y-1/2 glass-panel p-4 rounded-2xl flex items-center gap-3 node-pulse z-20" style={{ animationDelay: "0s" }}>
                        <span className="material-symbols-outlined text-secondary">trending_up</span>
                        <span className="font-label-md text-label-md">Share Easily</span>
                    </div>
                    <div className="absolute top-[80%] left-[88%] -translate-x-1/2 -translate-y-1/2 glass-panel p-4 rounded-2xl flex items-center gap-3 node-pulse z-20" style={{ animationDelay: "1.5s" }}>
                        <span className="material-symbols-outlined text-tertiary">group</span>
                        <span className="font-label-md text-label-md">Split Fair</span>
                    </div>
                    <div className="absolute top-[84%] left-[12%] -translate-x-1/2 -translate-y-1/2 glass-panel p-4 rounded-2xl flex items-center gap-3 node-pulse z-20" style={{ animationDelay: "0.7s" }}>
                        <span className="material-symbols-outlined text-primary-container">security</span>
                        <span className="font-label-md text-label-md">Squad Settled</span>
                    </div>
                    {/* Connectors (Dashed Lines) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100">
                        {/* Line to Growth */}
                        <line className="text-primary-container" x1="50%" y1="50%" x2="50%" y2="15%" stroke="currentColor" strokeDasharray="2" strokeWidth="0.5"></line>
                        {/* Line to Shared Vault */}
                        <line className="text-secondary" x1="50%" y1="50%" x2="80%" y2="73%" stroke="currentColor" strokeDasharray="2" strokeWidth="0.5"></line>
                        {/* Line to Encrypted */}
                        <line className="text-tertiary" x1="50%" y1="50%" x2="20%" y2="76%" stroke="currentColor" strokeDasharray="2" strokeWidth="0.5"></line>
                    </svg>
                </div>
                {/* Brand Logo Overlays */}
                <div className="absolute top-12 left-12 flex items-center gap-2">
                    <span className="text-[60px] leading-none font-black text-primary-container">SplitIt</span>
                </div>
                <div className="absolute bottom-12 left-12 max-w-sm">
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Master your shared expenses.</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Experience the future of collaborative finance with precision-engineered split tracking.</p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-surface z-10 relative">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="space-y-2">
                        <div className="lg:hidden flex items-center gap-2 mb-8">
                            <span className="font-headline-md text-headline-md font-black text-primary-container">SplitIt</span>
                        </div>
                        <h1 className="font-headline-xl text-headline-xl text-on-surface">Welcome back</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant">Enter your credentials to access your dashboard.</p>
                    </div>

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 bg-error-container/20 border border-error-container/40 rounded-xl text-error text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="email">Email Address</label>
                            <div className="relative group transition-transform duration-200">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary-container z-10">mail</span>
                                <input
                                    className="w-full bg-surface-container border border-outline/30 rounded-xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container transition-all backdrop-blur-sm relative z-0"
                                    id="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
                                <a className="font-label-sm text-label-sm text-primary-container hover:text-inverse-primary transition-colors" href="#">Forgot Password?</a>
                            </div>
                            <div className="relative group transition-transform duration-200">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary-container z-10">lock</span>
                                <input
                                    className="w-full bg-surface-container border border-outline/30 rounded-xl py-4 pl-12 pr-12 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container transition-all backdrop-blur-sm relative z-0"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors z-10"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-3">
                            <input
                                className="w-5 h-5 rounded border-outline/30 bg-surface-container text-primary-container focus:ring-primary-container/40 focus:ring-offset-0"
                                id="remember"
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                            />
                            <label className="font-body-md text-body-md text-on-surface-variant select-none" htmlFor="remember">Stay logged in for 30 days</label>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full bg-primary-container hover:bg-inverse-primary text-on-primary-container font-headline-md text-headline-md py-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] glow-accent shadow-lg flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Login
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>



                    {/* Sign Up Footer */}
                    <p className="text-center font-body-md text-body-md text-on-surface-variant">
                        Don't have an account?{" "}
                        <Link className="text-primary-container font-bold hover:underline" to="/register">Sign Up</Link>
                    </p>
                </div>

                {/* Abstract Footer Decoration */}
                <div className="absolute bottom-6 right-6 opacity-30 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-1 bg-primary-container rounded-full"></div>
                        <div className="w-4 h-1 bg-secondary rounded-full"></div>
                        <div className="w-4 h-1 bg-tertiary rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserLogin;

