import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  return (
    <div className="relative mx-4 mt-4 mb-2 shadow-md rounded-full bg-white">
      <div className="flex h-12 items-center px-4">
        <Search className="size-5 text-text-secondary" />
        <input
          type="text"
          placeholder="치유의 숲, 휴양림 검색..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="h-full w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>
    </div>
  );
}
