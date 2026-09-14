import Link from "next/link";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { routes } from "@/shared/constants/routes";

type HeaderControlsProps = {
  onSelectComplete?: () => void;
};

const HeaderControls = ({ onSelectComplete }: HeaderControlsProps) => {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggleButton onToggleComplete={onSelectComplete} />

      <Link
        href={routes.login}
        onClick={onSelectComplete}
        className="bg-brand hover:bg-brand-hover inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-bold text-white shadow-sm transition"
      >
        로그인
      </Link>
    </div>
  );
};

export default HeaderControls;
