import FormInput from "../../components/input/FormInput";
import {UserRound, Mail, Lock} from 'lucide-react';
import InputErrorMessage from "../../components/error/InputErrorMessage";
import { useState } from "react";
import PublicHeader from "../../components/header/PublicHeader";
import useUserAuth from "../../store/UserAuthStore";
import { useNavigate } from "react-router-dom";

function UserRegister() {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const register = useUserAuth((s) => s.register);
    const navigate = useNavigate();

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    const validateName = (name: string) => {
        return name.length >= 5 && name.length <= 20;
    }

    const validatePassword = (password: string) => {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    }

    const validateConfirmPassword = (confirmPassword: string) => {
        return confirmPassword === password;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateName(name) || !validateEmail(email) || !validatePassword(password) || !validateConfirmPassword(confirmPassword)) {
            setError("Please fix the validation errors before submitting.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await register(name, email, password);
            navigate("/login");
        } catch (err: any) {
            setError(err.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-white dark:bg-gray-900">
            <img src="/Logo.png" alt="Logo" className="block mt-[15px] ml-[14px]"/>

            <PublicHeader title="Create Account" subtitle="Join For Fun & Start Sharing" />

            <div className="flex flex-col w-screen h-auto mt-[15px]">
                <form onSubmit={handleSubmit} className="flex flex-col w-[343px] h-auto mt-[20px] mx-auto">
                    {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

                    <p className="text-gray-600 dark:text-gray-400 font-bold">NAME</p>
                    <FormInput Icon={UserRound} placeholder="Your Name" type="text" value={name} onValidate={validateName} errorMessage={InputErrorMessage("Name must be 5-20 characters!")} onChange={(val) => setName(val)}></FormInput>

                    <p className="mt-[17px] text-gray-600 dark:text-gray-400 font-bold">EMAIL</p>
                    <FormInput Icon={Mail} placeholder="ex:johndoe@gmail.com" type="email" value={email} onChange={(val) => setEmail(val)} onValidate={validateEmail} errorMessage={InputErrorMessage("Please enter a valid email")}></FormInput>

                    <p className="mt-[17px] text-gray-600 dark:text-gray-400 font-bold">PASSWORD</p>
                    <FormInput Icon={Lock} placeholder="Create strong password" type="password" onValidate={validatePassword} value={password} onChange={(val) => setPassword(val)} errorMessage={InputErrorMessage("Password must contain symbol, uppercase, lowercase, and at least 8 characters")}></FormInput>

                    <p className="mt-[17px] text-gray-600 dark:text-gray-400 font-bold">CONFIRM PASSWORD</p>
                    <FormInput Icon={Lock} placeholder="Confirm your password" type="password" onValidate={validateConfirmPassword} value={confirmPassword} onChange={(val) => setConfirmPassword(val)} errorMessage={InputErrorMessage("Password doesn't match")}></FormInput>

                    <button
                        disabled={loading}
                        className="text-white font-bold text-base mt-[20px] w-full h-10 bg-[var(--fun-color-primary)] rounded-lg flex justify-center items-center active:shadow-inner transition-all duration-100 brightness-100 active:brightness-90 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>
            </div>
            <div className="flex flex-col w-screen h-auto justify-center items-center">
                <p className="mt-[15px] dark:text-white">Already have an account? <a href="/login" className="text-[var(--fun-color-primary)]">Login</a></p>
            </div>
        </div>
    )
}

export default UserRegister;
