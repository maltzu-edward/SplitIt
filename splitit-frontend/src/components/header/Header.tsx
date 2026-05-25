import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Moon, Sun } from "lucide-react";
import useFriendStore from "../../store/FriendStore";
import useUserAuth from "../../store/UserAuthStore";
import useThemeStore from "../../store/ThemeStore";

function Header(){
    const navigate = useNavigate();
    const { user } = useUserAuth();
    const { notifications, fetchNotifications } = useFriendStore();
    const { theme, toggle } = useThemeStore();

    useEffect(() => {
      if (user?.id) {
        fetchNotifications(user.id);
      }
    }, [user?.id, fetchNotifications]);

    const notificationCount = notifications?.length ?? 0;

    return(
        <div className="flex flex-row w-full h-auto justify-between items-center px-4 py-3 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <img
            src="/Logo.png"
            alt="Logo"
            className="h-8 antialiased"
          />
        </div>
        <div className="flex flex-row gap-2">
          <button
              onClick={toggle}
              className="h-[31px] w-[31px] bg-[var(--color-gray)] dark:bg-gray-700 flex justify-center items-center rounded-full cursor-pointer"
              aria-label="Toggle dark mode"
          >
            {theme === 'dark'
              ? <Sun className="text-yellow-400 w-4 h-4" strokeWidth={2.5} />
              : <Moon className="text-gray-600 w-4 h-4" strokeWidth={2.5} />
            }
          </button>
          <button
              onClick={() => navigate('/notification')}
              className="relative h-[31px] w-[31px] bg-[var(--color-gray)] dark:bg-gray-700 flex justify-center items-center rounded-full cursor-pointer">
            <Bell className="text-black dark:text-white w-4 h-4" strokeWidth={2.5}/>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    )
}

export default Header;
