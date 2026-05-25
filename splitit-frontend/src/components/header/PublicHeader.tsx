interface PublicHeaderProps {
    title: string;
    subtitle: string;
}

function PublicHeader({title, subtitle} : PublicHeaderProps) {
  return (
        <div className="flex flex-col w-screen h-auto justify-center items-center mt-[10px]">
            <h1 className="text-2xl font-bold dark:text-white">{title}</h1>
            <p className="text-xs font-normal text-[var(--color-lightgray)] dark:text-gray-400">{subtitle}</p>
        </div>
  );
}

export default PublicHeader;
