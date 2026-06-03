import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import useUserAuth from "../../store/UserAuthStore";
import useExpenseStore from "../../store/ExpenseStore";
import useFriendStore from "../../store/FriendStore";
import useThemeStore from "../../store/ThemeStore";
import { Sun, Moon } from "lucide-react";

function DashboardLayout() {
    const user = useUserAuth((s) => s.user);
    const logout = useUserAuth((s) => s.logout);
    const location = useLocation();
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const searchQuery = useExpenseStore((s) => s.searchQuery);
    const setSearchQuery = useExpenseStore((s) => s.setSearchQuery);
    const { notifications, fetchNotifications } = useFriendStore();
    const { theme, toggle } = useThemeStore();
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchNotifications(user.id);
        }
    }, [user?.id, fetchNotifications]);

    const notificationCount = notifications?.length ?? 0;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Ambient interactive particles in the background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            x!: number;
            y!: number;
            size!: number;
            speedX!: number;
            speedY!: number;
            opacity!: number;

            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.3;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas!.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas!.height) this.speedY *= -1;
            }
            draw() {
                ctx!.fillStyle = `rgba(183, 196, 255, ${this.opacity})`;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }

        resize();
        window.addEventListener("resize", resize);

        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const navItems = [
        { path: "/expense", label: "Dashboard", icon: "dashboard" },
        { path: "/friends", label: "Friends", icon: "person_add" },
        { path: "/profile", label: "Profile", icon: "settings" }
    ];

    const getInitials = (fullName: string) => {
        const parts = fullName.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div className="flex min-h-screen bg-background text-on-surface select-none">
            {/* Ambient Interactive Particles */}
            <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0" />

            {/* SideNavBar — hidden on mobile, shown on desktop */}
            <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col bg-surface/70 backdrop-blur-xl w-64 border-r border-white/10 shadow-2xl shadow-primary-container/5 z-50">
                <div className="p-8 pb-4">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-primary-container">SplitIt</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                                    isActive
                                        ? "text-primary-container bg-primary-container/10 font-bold border-r-4 border-primary-container"
                                        : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
                                }`}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    {item.icon}
                                </span>
                                <span className="font-label-md text-label-md">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-error hover:bg-error/10 transition-all duration-300"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-label-md text-label-md">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Canvas — full width on mobile, offset on desktop */}
            <div className="flex-1 md:ml-64 min-h-screen relative flex flex-col z-10">
                {/* Background Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary-container/5 blur-[120px]" />
                    <div className="absolute -bottom-[5%] -left-[5%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]" />
                </div>

                {/* TopNavBar — full width on mobile, right-panel on desktop */}
                <header className="fixed top-0 right-0 left-0 md:left-64 z-40 flex justify-between items-center px-4 md:pl-8 md:pr-6 bg-surface/40 backdrop-blur-md h-14 md:h-16 border-b border-white/10 shadow-sm">
                    {/* Left: Mobile logo / Desktop search */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Mobile: SplitIt wordmark */}
                        <span className="md:hidden font-headline-md text-headline-md font-bold text-primary-container shrink-0">SplitIt</span>
                        {/* Desktop: search bar */}
                        <div className="hidden md:flex relative w-full max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-md">search</span>
                            <input
                                className="w-full bg-surface-container border border-outline/30 rounded-full py-2 pl-10 pr-4 text-label-md focus:outline-none focus:border-primary-container/50 transition-colors text-on-surface placeholder-on-surface-variant/40"
                                placeholder="Search expenses, groups..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1 md:gap-6 shrink-0">
                        {/* Mobile search toggle */}
                        <button
                            onClick={() => setMobileSearchOpen((v) => !v)}
                            className="md:hidden p-2 rounded-full text-on-surface-variant hover:bg-white/10 transition-colors"
                            aria-label="Search"
                        >
                            <span className="material-symbols-outlined text-xl">search</span>
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={toggle}
                            className="p-2 rounded-full text-on-surface-variant hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-5 h-5 text-yellow-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-500" />
                            )}
                        </button>

                        {/* Notifications Bell */}
                        <button
                            onClick={() => navigate("/friend-requests")}
                            className="relative p-2 rounded-full text-on-surface-variant hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            {notificationCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-background">
                                    {notificationCount}
                                </span>
                            )}
                        </button>

                        {/* Avatar */}
                        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-white/10">
                            <span className="font-label-md text-on-surface hidden lg:block">{user?.name || "User"}</span>
                            {user?.profileImage ? (
                                <img
                                    alt="User Avatar"
                                    className="w-8 h-8 rounded-full border border-primary-container/30 object-cover"
                                    src={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"}${user.profileImage}`}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white text-xs font-bold border border-primary-container/30">
                                    {getInitials(user?.name || "User")}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Search Dropdown */}
                {mobileSearchOpen && (
                    <div className="fixed top-14 left-0 right-0 z-40 md:hidden bg-surface/95 backdrop-blur-xl border-b border-white/10 p-3 shadow-lg">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                            <input
                                autoFocus
                                className="w-full bg-surface-container border border-outline/30 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-container/50 transition-colors text-on-surface placeholder-on-surface-variant/40"
                                placeholder="Search expenses, groups..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Render Route Child Content */}
                <main className="flex-1 w-full relative">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar — only visible on mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200"
                        >
                            <span
                                className={`material-symbols-outlined text-[26px] transition-colors ${
                                    isActive ? "text-primary-container" : "text-on-surface-variant"
                                }`}
                                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {item.icon}
                            </span>
                            <span className={`text-[10px] font-semibold transition-colors ${
                                isActive ? "text-primary-container" : "text-on-surface-variant"
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200"
                >
                    <span className="material-symbols-outlined text-[26px] text-error">logout</span>
                    <span className="text-[10px] font-semibold text-error">Logout</span>
                </button>
            </nav>
        </div>
    );
}

export default DashboardLayout;
