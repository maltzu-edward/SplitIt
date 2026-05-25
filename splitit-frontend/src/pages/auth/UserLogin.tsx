import FormInput from "../../components/input/FormInput";
import {Mail, Lock} from 'lucide-react';
import { useState } from 'react';
import PublicHeader from "../../components/header/PublicHeader";
import useUserAuth from "../../store/UserAuthStore";
import { useNavigate } from "react-router-dom";

function UserLogin (){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="h-screen w-screen bg-white dark:bg-gray-900">
            <img src="/Logo.png" alt="Logo" className="block mt-[15px] ml-[14px]"/>

            <PublicHeader title="Welcome Back!" subtitle="Ready to split some bills?" />

            <div className="flex flex-col w-screen h-auto mt-[15px]">
                <form onSubmit={handleSubmit} className="flex flex-col w-[343px] h-auto mt-[20px] mx-auto">
                    {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

                    <p className="text-gray-600 dark:text-gray-400 font-bold">EMAIL</p>
                    <FormInput Icon={Mail} placeholder="ex: johndoe@gmail.com" type="email" value={email} onChange={(val) => setEmail(val)}></FormInput>

                    <p className="mt-[17px] text-gray-600 dark:text-gray-400 font-bold">PASSWORD</p>
                    <FormInput Icon={Lock} placeholder="*****************" type="password" value={password} onChange={(val) => setPassword(val)}></FormInput>

                    <button
                        disabled={loading}
                        className="text-white font-bold text-base mt-[20px] w-full h-10 bg-[var(--fun-color-primary)] rounded-lg flex justify-center items-center active:shadow-inner transition-all duration-100 brightness-100 active:brightness-90 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
            <div className="flex flex-col w-screen h-auto justify-center items-center">
                <p className="mt-[15px] dark:text-white">Don't have an account? <a href="/register" className="text-[var(--fun-color-primary)]">Sign Up</a></p>
            </div>
        </div>
    )
}

export default UserLogin;
