import { cn } from "../utils/cn";

export interface ExpenseCardProps {
  title: string;
  date: string;
  amount: number;
  type: "owed" | "owe" | "settled";
  icon?: string;
  onClick?: () => void;
}

export default function ExpenseCard({ title, date, amount, type, icon = "🍔", onClick }: ExpenseCardProps) {
  const getAmountColor = () => {
    switch (type) {
      case "owed": return "text-green-600";
      case "owe": return "text-red-500";
      case "settled": return "text-gray-500";
      default: return "text-gray-800";
    }
  };

  const getAmountPrefix = () => {
    switch (type) {
      case "owed": return "+ Rp ";
      case "owe": return "- Rp ";
      case "settled": return "Rp ";
      default: return "Rp ";
    }
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100",
        "hover:shadow-md hover:border-gray-200 transition-all cursor-pointer active:scale-[0.98]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-base leading-tight">{title}</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">{date}</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className={cn("font-bold text-[15px]", getAmountColor())}>
          {getAmountPrefix()}{amount.toLocaleString('id-ID')}
        </p>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
          {type === "owed" ? "You lent" : type === "owe" ? "You borrowed" : "Settled"}
        </p>
      </div>
    </div>
  );
}
