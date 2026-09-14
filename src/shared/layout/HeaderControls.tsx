import Link from "next/link";
import { ThemeToggleButton } from "@/shared/ui/ThemeToggleButton";
import { routes } from "@/shared/constants/routes";

type HeaderControlsProps = {
  onSelectComplete?: () => void;
};

const HeaderControls = ({
  onSelectComplete,
}: HeaderControlsProps) => {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggleButton onToggleComplete={onSelectComplete} />

      <Link
        href={routes.login}
        onClick={onSelectComplete}
        className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover"
      >
        로그인
      </Link>
    </div>
  );
};

export default HeaderControls;
