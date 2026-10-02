import {
  MobileServiceFilterCarousel,
  ServiceFilterCarousel,
} from "@/features/store/components/StoreServiceFilterCarousel";
import type { ServiceFilterOption } from "@/features/store/lib/markerColors";

type StorePanelServiceFiltersProps = {
  consultOptions: readonly ServiceFilterOption[];
  consultValue: string[];
  onChange: (kind: "consult" | "provided", nextValue: string[]) => void;
  providedOptions: readonly ServiceFilterOption[];
  providedValue: string[];
};

/** 상담·서비스 필터 뱃지 줄. 모바일은 검색창 아래 가로 슬라이드, 데스크톱은 검색창 오른쪽 */
export const StorePanelServiceFilters = ({
  consultOptions,
  consultValue,
  onChange,
  providedOptions,
  providedValue,
}: StorePanelServiceFiltersProps) => (
  <>
    {/* 모바일: 검색창 바로 아래 가로 슬라이드 필터 */}
    <div className="-mx-3 w-[calc(100%+24px)] max-w-none min-w-0 self-stretch sm:mx-0 sm:w-[min(420px,calc(100vw-48px))] sm:max-w-full sm:self-start md:hidden">
      <MobileServiceFilterCarousel
        aria-label="상담 및 서비스 카테고리 필터"
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
