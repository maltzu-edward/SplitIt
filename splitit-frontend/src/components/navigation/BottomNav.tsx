import { UserRound, UsersRound } from "lucide-react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/expense", label: "Expenses", Icon: BanknotesIcon, type: "heroicon" },
  { to: "/friends", label: "Friends", Icon: UsersRound, type: "lucide" },
  { to: "/profile", label: "Profile", Icon: UserRound, type: "lucide" },
] as const;

function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 h-16 w-screen border-t border-gray-200 dark:border-gray-700 flex flex-row z-40">
      {tabs.map((tab) => {
        const active = isActive(tab.to);
        const colorClass = active ? "text-blue-600" : "text-gray-400 dark:text-gray-500";
        return (
          <Link
            key={tab.to}
            className="flex flex-col flex-1 items-center justify-center"
            to={tab.to}
          >
            <tab.Icon className={`w-6 h-6 ${colorClass}`} />
            <p className={`text-[10px] ${colorClass} font-bold`}>{tab.label}</p>
          </Link>
        );
      })}
    </div>
  );
}

export default BottomNav;
