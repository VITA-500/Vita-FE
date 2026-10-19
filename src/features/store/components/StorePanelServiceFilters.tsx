import {
  ServiceFilterCarousel,
  ServiceFilterWrapList,
} from "@/features/store/components/StoreServiceFilterCarousel";
import type { ServiceFilterOption } from "@/features/store/lib/markerColors";

type StorePanelServiceFiltersProps = {
  consultOptions: readonly ServiceFilterOption[];
  consultValue: string[];
  /**
   * bar: 지도 위 검색창 옆(모바일은 아래) 한 줄. 들어가는 만큼만 보여주고 나머지는 더보기(…)로 보낸다.
   * panel: 매장 목록 사이드바·바텀 시트 안. 줄이지 않고 모두 보여준다(넘치면 줄바꿈).
   */
  layout?: "bar" | "panel";
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
  layout = "bar",
  onChange,
  providedOptions,
  providedValue,
}: StorePanelServiceFiltersProps) =>
  layout === "panel" ? (
    <ServiceFilterWrapList
      aria-label="상담 및 서비스 카테고리 필터"
      consultOptions={consultOptions}
      consultValue={consultValue}
      onConsultChange={(value) => onChange("consult", value)}
      onProvidedChange={(value) => onChange("provided", value)}
      providedOptions={providedOptions}
      providedValue={providedValue}
    />
  ) : (
    <>
      {/* 모바일·태블릿: 검색창 바로 아래. 가로 슬라이드는 끝 뱃지가 잘려 보여 최대 3개 + 더보기(…)로 보여준다. */}
      {/* 좁은 화면(sm 미만)에서는 위 검색창 줄과 같은 폭으로 가운데에 두고 뱃지도 가운데 정렬한다. */}
      <div className="w-full max-w-[476px] min-w-0 self-center sm:self-start md:hidden">
        <ServiceFilterCarousel
          isCentered
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
