import { Routes, Route, Navigate } from "react-router-dom";
import { PublicRoute } from "./route/PublicRoute";
import { ProtectedRoute } from "./route/ProtectedRoute";

import UserRegister from "./pages/auth/UserRegister";
import UserLogin from "./pages/auth/UserLogin";
import ExpenseMain from "./pages/ExpenseMain";
import GroupDetail from "./pages/GroupDetail";
import PaymentValidation from "./pages/PaymentValidation";
import FriendMain from "./pages/FriendMain";
import UserProfile from "./pages/UserProfile";
import Notification from "./pages/Notification";
import Chat from "./pages/Chat";
import { useEffect } from "react";
import useUserAuth from "./store/UserAuthStore";

function App() {
    const fetchProfile = useUserAuth((s) => s.fetchProfile);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/expense" replace />} />
            
            <Route element={<PublicRoute />}>
                <Route path="/register" element={<UserRegister />} />
                <Route path="/login" element={<UserLogin />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route path="/expense" element={<ExpenseMain />} />
                <Route path="/group/:groupId" element={<GroupDetail />} />
                <Route path="/payment-validation/:splitId" element={<PaymentValidation />} />
                <Route path="/friends" element={<FriendMain />} />
                <Route path="/chat/:friendId" element={<Chat />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/notification" element={<Notification />} />
            </Route>
        </Routes>
    );
}

export default App;
