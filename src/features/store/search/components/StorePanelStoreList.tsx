import { StoreOpenFilterMenu } from "@/features/store/search/components/StoreOpenFilterMenu";
import { StoreOpenStatusBadge } from "@/entities/store";
import { StorePanelPagination } from "@/features/store/search/components/StorePanelPagination";
import { mapCategoryOptions } from "@/features/store/constants";
import { renderBenefitCategoryIcon } from "@/entities/benefit";
import { getStoreMarkerLabel } from "@/entities/store";
import type { MapCategory } from "@/features/store/types";
import type { StoreLocation, StoreOpenFilter } from "@/entities/store";
import { cn } from "@/shared/lib/cn";
import type { BenefitCategoryOption } from "@/entities/benefit";

const getListTitle = (category: MapCategory) =>
  category === "store" ? "매장 목록" : "제휴 혜택/서비스 목록";

type StorePanelStoreListHeaderProps = {
  activeMapCategory: MapCategory;
  onCategoryChange: (category: MapCategory) => void;
  onOpenFilterChange: (nextFilter: StoreOpenFilter) => void;
  /** 영업 시간 필터(전체 / 지금 영업 중 / 선택한 시각에 영업 중) */
  openFilter: StoreOpenFilter;
};

/** 매장 목록 상단: 목록 제목, 영업 시간 필터, 매장/제휴 혜택 전환 */
export const StorePanelStoreListHeader = ({
  activeMapCategory,
  onCategoryChange,
  onOpenFilterChange,
  openFilter,
}: StorePanelStoreListHeaderProps) => (
  <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-4">
    <span className="min-w-0 truncate text-sm font-extrabold text-gray-950 dark:text-white">
      {getListTitle(activeMapCategory)}
    </span>
    <div className="flex shrink-0 items-center gap-2">
      <StoreOpenFilterMenu
        onChange={onOpenFilterChange}
        openFilter={openFilter}
      />
      <div className="flex items-center gap-1 rounded-sm border border-gray-200 bg-white p-0.5 text-[11px] font-extrabold dark:border-white/10 dark:bg-zinc-950">
        {mapCategoryOptions.map((item) => {
          const Icon = item.icon;
          const isSelected = activeMapCategory === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onCategoryChange(item.value)}
              className={cn(
                "group relative flex h-7 w-7 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
                isSelected
                  ? "bg-brand text-white dark:text-zinc-950"
                  : "text-text-secondary hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand",
              )}
              aria-label={`${item.label} 보기`}
              aria-pressed={isSelected}
            >
              <Icon size={14} />
              {/* 아이콘만 있는 토글이라 hover/포커스 시 어떤 목록인지 툴팁으로 알려준다. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-[calc(100%+8px)] right-0 z-50 flex translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              >
                {getListTitle(item.value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

type StorePanelBenefitCategoriesProps = {
  benefitCategories: BenefitCategoryOption[];
  onBenefitCategoryChange: (category: string) => void;
  selectedBenefitCategory: string;
};

/** 제휴 혜택 탭의 카테고리 뱃지(쇼핑·식음료 등). 카테고리가 없으면 그리지 않는다. */
export const StorePanelBenefitCategories = ({
  benefitCategories,
  onBenefitCategoryChange,
  selectedBenefitCategory,
}: StorePanelBenefitCategoriesProps) => {
  if (benefitCategories.length === 0) {
    return null;
  }

  return (
    // 모바일: 한 줄로 두고 손가락으로 좌우 드래그(스크롤바 숨김), 데스크톱: 가로 스크롤 없이 줄바꿈
    <div className="flex snap-x snap-proximity scrollbar-none gap-1.5 overflow-x-auto overscroll-x-contain md:flex-wrap md:overflow-x-visible">
      {benefitCategories.map((category) => {
        const isSelected = selectedBenefitCategory === category.value;

        return (
          <button
            key={category.value}
            type="button"
            onClick={() => onBenefitCategoryChange(category.value)}
            className={cn(
              "flex shrink-0 snap-start items-center gap-1 rounded-sm px-2.5 py-1.5 text-[11px] font-extrabold transition focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
              isSelected
                ? "bg-brand text-white dark:text-zinc-950"
                : "hover:bg-brand-soft hover:text-brand bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300",
            )}
            aria-pressed={isSelected}
          >
            {renderBenefitCategoryIcon(category.value, 12)}
            {category.label}
          </button>
        );
      })}
    </div>
  );
};

/** 제휴 매장 행에 붙는 카테고리 아이콘(텍스트 대신 아이콘만, 이름은 툴팁·스크린리더로) */
const BenefitCategoryIconBadge = ({ category }: { category?: string }) => (
  <span
    className="bg-brand/10 text-brand inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
    title={category}
    aria-label={category}
    role="img"
  >
    {renderBenefitCategoryIcon(category, 12)}
  </span>
);

type StoreRowProps = {
  index: number;
  isBenefit: boolean;
  isSelected: boolean;
  onSelect: () => void;
  store: StoreLocation;
};

/** 매장 한 줄: 핀 글자, 이름, 영업 상태·거리, 주소(제휴 매장은 혜택 정보) */
const StoreRow = ({
  index,
  isBenefit,
  isSelected,
  onSelect,
  store,
}: StoreRowProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      // 페이지가 바뀌면(key 변경으로 새로 그려짐) 서서히 나타난다.
      "animate-store-page-in flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.04]",
      isSelected && "bg-brand-soft dark:bg-brand/10",
    )}
    aria-pressed={isSelected}
  >
    <span
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-black",
        isSelected ? "bg-brand text-white" : "bg-brand/10 text-brand",
      )}
    >
      {getStoreMarkerLabel(index)}
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-extrabold text-gray-800 dark:text-white">
          {store.name}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <StoreOpenStatusBadge
            businessHours={store.businessHours}
            openNow={store.openNow}
          />
          {store.distanceText && (
            <span className="text-[11px] font-bold text-gray-400">
              {store.distanceText}
            </span>
          )}
        </span>
      </span>
      {isBenefit ? (
        <>
          <span className="mt-1 flex min-w-0 items-center gap-1.5">
            <BenefitCategoryIconBadge category={store.benefitCategory} />
            <span className="truncate text-xs font-medium text-gray-400">
              {store.benefitName || store.benefitBrand}
            </span>
          </span>
          {store.benefitDescription && (
            <span className="mt-1 block truncate text-xs font-medium text-gray-400">
              {store.benefitDescription}
            </span>
          )}
        </>
      ) : (
        <span className="mt-1 block truncate text-xs font-medium text-gray-400">
          {store.address || "상세 주소 확인 중"}
        </span>
      )}
    </span>
  </button>
);

const emptyMessageClassName =
  "flex h-20 items-center justify-center text-sm font-semibold text-gray-400";

type StorePanelStoreItemsProps = {
  activeMapCategory: MapCategory;
  activeStorePage: number;
  currentStorePage: number;
  isDesktop: boolean;
  /** 첫 페이지(처음 보여주는 핀) 매장 수. "더보기"에 남은 개수를 계산한다. */
  firstPageSize: number;
  hasMoreStorePages: boolean;
  isStorePaginationOn: boolean;
  isBenefitStoreLoading: boolean;
  mapSelectedStoreId: string;
  onPageChange: (page: number) => void;
  onSelectStore: (storeId: string) => void;
  onShowPagination: () => void;
  pagedMapStores: StoreLocation[];
  /** 목록 전체 매장 수 */
  storeCount: number;
  storePageCount: number;
};

/** 매장 리스트: 현재 페이지 매장, 빈 목록·불러오는 중 안내, 페이지 이동 */
export const StorePanelStoreItems = ({
  activeMapCategory,
  activeStorePage,
  currentStorePage,
  isDesktop,
  hasMoreStorePages,
  isBenefitStoreLoading,
  mapSelectedStoreId,
  onPageChange,
  onSelectStore,
  pagedMapStores,
  storeCount,
  storePageCount,
}: StorePanelStoreItemsProps) => {
  const isBenefit = activeMapCategory === "benefit";

  return (
    <>
      <div
        className={cn("py-1", isDesktop && "min-h-0 flex-1 overflow-y-auto")}
      >
        {pagedMapStores.map((store, index) => (
          <StoreRow
            key={`${currentStorePage}:${store.id}`}
            index={index}
            isBenefit={isBenefit}
            isSelected={mapSelectedStoreId === store.id}
            onSelect={() => onSelectStore(store.id)}
            store={store}
          />
        ))}

        {isBenefit && isBenefitStoreLoading && (
          <div className={emptyMessageClassName}>
            제휴 매장을 불러오는 중이에요.
          </div>
        )}

        {!(isBenefit && isBenefitStoreLoading) && storeCount === 0 && (
          <div className={emptyMessageClassName}>
            {isBenefit ? "표시할 제휴 매장이 없어요." : "표시할 매장이 없어요."}
          </div>
        )}
      </div>

      {hasMoreStorePages && (
        <StorePanelPagination
          activePage={activeStorePage}
          onPageChange={onPageChange}
          pageCount={storePageCount}
        />
      )}
    </>
  );
};
