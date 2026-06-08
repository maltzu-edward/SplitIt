import { Navigate, Outlet } from "react-router-dom";
import useUserAuth from "../store/UserAuthStore";

export function PublicRoute() {
    
    const isAuth = useUserAuth((s) => s.isAuth());
    const authChecked = useUserAuth((s) => s.authChecked);

    
    if (!authChecked) {
        return <div>Loading...</div>; 
    }

    
    if (isAuth) {
        return <Navigate to="/expense" replace />;
    }

    
    return <Outlet />;
}