import React, { useState } from "react";

interface FormInputProps {
  Icon: React.ElementType;
  placeholder: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  onValidate?: (value: string) => boolean;
  errorMessage?: React.ReactNode;
}

function FormInput({
  Icon,
  placeholder = "Enter your text........",
  type = "text",
  value,
  onChange,
  onValidate,
  errorMessage,
}: FormInputProps) {

  const [isON, setON] = useState<boolean>(false);
  const isValid = onValidate ? onValidate(value) : true;

  const showUIError: boolean = isON && !isValid;

  return (
    <div className="w-full max-w-sm">
      <div className="relative">
        <div
          className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none transition-all duration-300 ease-in-out
          ${value.length > 0 ? "opacity-0 -translate-x-2 scale-75" : "opacity-100 translate-x-0 scale-100"}`}
        >
          {Icon && (
            <Icon
              className={`w-5 h-5 ${
                !showUIError
                  ? "text-gray-400"
                  : "text-[var(--color-error)]"
              }`}
            />
          )}
        </div>

        <input
          type={type}
          value={value}
          onBlur={() => setON(true)}
          onChange={
            (e) => {
              setON(true);
              onChange(e.target.value)}
            }
          placeholder={value ? "" : placeholder}
          className={`w-full h-10 rounded-lg px-3 py-2 focus:outline-none dark:text-white dark:placeholder-gray-500
          ${value.length > 0 ? "pl-3" : "pl-10"}
          ${!showUIError ? "bg-[var(--color-gray)] dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500" : "border-red-500 bg-red-50 dark:bg-red-900/20"}`}
        />
      </div>
      {showUIError && errorMessage}
    </div>
  );
}

export default FormInput;
