import { ServiceFilterCarousel } from "@/features/store/components/StoreServiceFilterCarousel";
import type { ServiceFilterOption } from "@/features/store/lib/markerColors";

type StorePanelServiceFiltersProps = {
  consultOptions: readonly ServiceFilterOption[];
  consultValue: string[];
  onChange: (kind: "consult" | "provided", nextValue: string[]) => void;
  providedOptions: readonly ServiceFilterOption[];
  providedValue: string[];
};

/**
 * 상담·서비스 필터 뱃지 줄. 모바일·태블릿(768px 미만)은 검색창 아래, 데스크톱은 검색창 오른쪽.
 * 두 화면 모두 한 줄에 들어가는 만큼만 보여주고 나머지는 더보기(…)로 보낸다(모바일 최대 3개, 데스크톱 최대 6개).
 */
export const StorePanelServiceFilters = ({
  consultOptions,
  consultValue,
  onChange,
  providedOptions,
  providedValue,
}: StorePanelServiceFiltersProps) => (
  <>
    {/* 모바일·태블릿: 검색창 바로 아래. 가로 슬라이드는 끝 뱃지가 잘려 보여 최대 3개 + 더보기(…)로 보여준다. */}
    <div className="w-full min-w-0 self-stretch sm:w-[min(420px,calc(100vw-48px))] sm:max-w-full sm:self-start md:hidden">
      <ServiceFilterCarousel
        aria-label="상담 및 서비스 카테고리 필터"
        maxVisibleCount={3}
        moreMenuAlign="right"
        consultOptions={consultOptions}
        consultValue={consultValue}
        onConsultChange={(value) => onChange("consult", value)}
        onProvidedChange={(value) => onChange("provided", value)}
        providedOptions={providedOptions}
        providedValue={providedValue}
      />
    </div>
    <div className="hidden min-w-0 md:flex md:flex-1">
      <ServiceFilterCarousel
        aria-label="상담 및 서비스 카테고리 필터"
        consultOptions={consultOptions}
        consultValue={consultValue}
        onConsultChange={(value) => onChange("consult", value)}
        onProvidedChange={(value) => onChange("provided", value)}
        providedOptions={providedOptions}
        providedValue={providedValue}
      />
    </div>
  </>
);
