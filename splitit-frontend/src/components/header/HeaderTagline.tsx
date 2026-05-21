import { Search } from "lucide-react";

interface HeaderTaglineProps {
  title: string;
  subtitle: string;
  onChange: (val: string) => void;
  value: string;
  placeholder?: string;
}

function HeaderTagline({ title, subtitle, onChange, value, placeholder }: HeaderTaglineProps) {
  return (
    <div className="flex flex-col px-4 mt-4">
      <p className="font-bold text-base text-gray-900">{title}</p>
      <p className="font-normal text-sm text-gray-400">
        {subtitle}
      </p>
      <div className="mt-3">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            placeholder={placeholder || ""}
            className="w-full h-9 rounded-lg px-3 py-2 focus:outline-none bg-gray-100 border border-gray-200 pr-9 text-sm"
          />
          <div className="absolute inset-y-0 right-2 flex items-center pl-3 cursor-pointer">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeaderTagline;
