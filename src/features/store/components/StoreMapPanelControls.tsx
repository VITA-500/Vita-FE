"use client";

import { ChevronDown, PanelLeft } from "lucide-react";
import type { RefObject } from "react";
import { useState } from "react";
import { StorePanelBenefitFilters } from "@/features/store/components/StorePanelBenefitFilters";
import { StorePanelSearchBar } from "@/features/store/components/StorePanelSearchBar";
import { StorePanelSearchDropdown } from "@/features/store/components/StorePanelSearchDropdown";
import { StorePanelServiceFilters } from "@/features/store/components/StorePanelServiceFilters";
import {
  StorePanelBenefitCategories,
  StorePanelStoreItems,
  StorePanelStoreListHeader,
} from "@/features/store/components/StorePanelStoreList";
import type { StoreMapPanelModel } from "@/features/store/hooks/useStoreMapPanel";
import type { StoreOpenFilter } from "@/entities/store";
import { cn } from "@/shared/lib/cn";

type StoreMapPanelStoreListContentProps = Pick<
  StoreMapPanelModel,
  | "activeMapCategory"
  | "activeStorePage"
  | "benefitCategories"
  | "benefitServiceFilterOptions"
  | "benefitServiceFilters"
  | "changeBenefitCategory"
  | "changeMapCategory"
  | "closeSelectedStoreInfo"
  | "consultServiceFilterOptions"
  | "consultServiceFilters"
  | "currentStorePage"
  | "firstPageSize"
  | "goToStorePage"
  | "handleServiceFilterChange"
  | "handleStoreSelect"
  | "hasMoreStorePages"
  | "isBenefitStoreLoading"
  | "isStorePaginationOn"
  | "mapSelectedStoreId"
  | "mapStores"
  | "openFilter"
  | "pagedMapStores"
  | "providedServiceFilterOptions"
  | "providedServiceFilters"
  | "selectedBenefitCategory"
  | "setBenefitServiceFilters"
  | "setOpenFilter"
  | "showStorePagination"
  | "storePageCount"
> & {
  isDesktop: boolean;
};

export const StoreMapPanelStoreListContent = ({
  activeMapCategory,
  activeStorePage,
  benefitCategories,
  benefitServiceFilterOptions,
  benefitServiceFilters,
  changeBenefitCategory,
  changeMapCategory,
  closeSelectedStoreInfo,
  consultServiceFilterOptions,
  consultServiceFilters,
  currentStorePage,
  firstPageSize,
  goToStorePage,
  handleServiceFilterChange,
  handleStoreSelect,
  hasMoreStorePages,
  isBenefitStoreLoading,
  isDesktop,
  isStorePaginationOn,
  mapSelectedStoreId,
  mapStores,
  openFilter,
  pagedMapStores,
  providedServiceFilterOptions,
  providedServiceFilters,
  selectedBenefitCategory,
  setBenefitServiceFilters,
  setOpenFilter,
  showStorePagination,
  storePageCount,
}: StoreMapPanelStoreListContentProps) => {
  const isBenefitCategory = activeMapCategory === "benefit";
  const [isFilterBadgesOpen, setIsFilterBadgesOpen] = useState(false);
  const selectedFilterCount = isBenefitCategory
    ? benefitServiceFilters.length
    : consultServiceFilters.length + providedServiceFilters.length;
  const isFilterBadgesVisible = isDesktop || isFilterBadgesOpen;
  const handleOpenFilterChange = (nextFilter: StoreOpenFilter) => {
    closeSelectedStoreInfo();
    setOpenFilter(nextFilter);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border shrink-0 border-b dark:border-white/10">
        <StorePanelStoreListHeader
          activeMapCategory={activeMapCategory}
          onCategoryChange={changeMapCategory}
          onOpenFilterChange={handleOpenFilterChange}
          openFilter={openFilter}
        />
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setIsFilterBadgesOpen((isOpen) => !isOpen)}
            className="text-text-secondary hover:text-text-primary flex h-9 w-full items-center justify-between gap-2 px-4 text-xs font-extrabold transition dark:hover:text-white"
            aria-expanded={isFilterBadgesOpen}
            aria-controls="store-filter-badges"
          >
            <span className="flex items-center gap-1.5">
              {isBenefitCategory ? "혜택 카테고리·필터" : "상담·서비스 필터"}
              {selectedFilterCount > 0 && (
                <span className="bg-brand flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-black text-white">
                  {selectedFilterCount}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold">
              {isFilterBadgesOpen ? "접기" : "펼치기"}
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  isFilterBadgesOpen && "rotate-180",
                )}
              />
            </span>
          </button>
        )}
        <div
          id="store-filter-badges"
          className={cn(
            "space-y-2 px-4 pb-3",
            !isFilterBadgesVisible && "hidden",
          )}
        >
          {isBenefitCategory ? (
            <>
              <StorePanelBenefitCategories
                benefitCategories={benefitCategories}
                onBenefitCategoryChange={(category) => {
                  if (category !== selectedBenefitCategory) {
                    closeSelectedStoreInfo();
                  }
                  changeBenefitCategory(category);
                }}
                selectedBenefitCategory={selectedBenefitCategory}
              />
              <StorePanelBenefitFilters
                layout="panel"
                onChange={(nextValue) => {
                  closeSelectedStoreInfo();
                  setBenefitServiceFilters(nextValue);
                }}
                options={benefitServiceFilterOptions}
                value={benefitServiceFilters}
              />
            </>
          ) : (
            <StorePanelServiceFilters
              layout="panel"
              consultOptions={consultServiceFilterOptions}
              consultValue={consultServiceFilters}
              onChange={handleServiceFilterChange}
              providedOptions={providedServiceFilterOptions}
              providedValue={providedServiceFilters}
            />
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <StorePanelStoreItems
          activeMapCategory={activeMapCategory}
          activeStorePage={activeStorePage}
          currentStorePage={currentStorePage}
          firstPageSize={firstPageSize}
          hasMoreStorePages={hasMoreStorePages}
          isBenefitStoreLoading={isBenefitStoreLoading}
          isStorePaginationOn={isStorePaginationOn}
          mapSelectedStoreId={mapSelectedStoreId}
          onPageChange={goToStorePage}
          onSelectStore={(storeId) =>
            handleStoreSelect(storeId, {
              focusMap: true,
              showOnlySelected: true,
            })
          }
          onShowPagination={showStorePagination}
          pagedMapStores={pagedMapStores}
          storeCount={mapStores.length}
          storePageCount={storePageCount}
        />
      </div>
    </div>
  );
};

type StoreMapPanelTopBarProps = Pick<
  StoreMapPanelModel,
  | "activeMapCategory"
  | "addSearchHistory"
  | "applyServiceFilterSearch"
  | "benefitServiceFilterOptions"
  | "benefitServiceFilters"
  | "clearBenefitServiceFilters"
  | "clearSearchHistory"
  | "clearServiceFilters"
  | "closeSelectedStoreInfo"
  | "collapsedSearchRef"
  | "consultServiceFilterOptions"
  | "consultServiceFilters"
  | "handleSearchQueryChange"
  | "handleServiceFilterChange"
  | "hasActiveBenefitServiceFilter"
  | "hasActiveServiceFilter"
  | "hasMoreStorePages"
  | "isSearchHistoryEnabled"
  | "isSearchHistoryOpen"
  | "isTagSearchQuery"
  | "mapStores"
  | "openSearchHistory"
  | "pagedMapStores"
  | "providedServiceFilterOptions"
  | "providedServiceFilters"
  | "removeSearchHistory"
  | "runStoreSearch"
  | "searchedServices"
  | "searchHistory"
  | "searchInputRef"
  | "searchQuery"
  | "searchResultStores"
  | "selectSearchHistory"
  | "setBenefitServiceFilters"
  | "submitStoreSearch"
  | "toggleSearchHistoryEnabled"
  | "toggleSearchHistoryOnInputMouseDown"
> & {
  isDesktop: boolean;
  isListOpen: boolean;
  mapTopBarRef: RefObject<HTMLDivElement | null>;
  onOpenSidebar?: () => void;
  onToggleStoreList: () => void;
};

export const StoreMapPanelTopBar = ({
  activeMapCategory,
  addSearchHistory,
  applyServiceFilterSearch,
  benefitServiceFilterOptions,
  benefitServiceFilters,
  clearBenefitServiceFilters,
  clearSearchHistory,
  clearServiceFilters,
  closeSelectedStoreInfo,
  collapsedSearchRef,
  consultServiceFilterOptions,
  consultServiceFilters,
  handleSearchQueryChange,
  handleServiceFilterChange,
  hasActiveBenefitServiceFilter,
  hasActiveServiceFilter,
  hasMoreStorePages,
  isDesktop,
  isListOpen,
  isSearchHistoryEnabled,
  isSearchHistoryOpen,
  isTagSearchQuery,
  mapStores,
  mapTopBarRef,
  onOpenSidebar,
  onToggleStoreList,
  openSearchHistory,
  pagedMapStores,
  providedServiceFilterOptions,
  providedServiceFilters,
  removeSearchHistory,
  runStoreSearch,
  searchedServices,
  searchHistory,
  searchInputRef,
  searchQuery,
  searchResultStores,
  selectSearchHistory,
  setBenefitServiceFilters,
  submitStoreSearch,
  toggleSearchHistoryEnabled,
  toggleSearchHistoryOnInputMouseDown,
}: StoreMapPanelTopBarProps) => {
  const isBenefitCategory = activeMapCategory === "benefit";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 pt-16 md:pt-0">
      <div
        ref={mapTopBarRef}
        className="pointer-events-auto absolute top-3 right-3 left-3 flex flex-col gap-3 md:top-5 md:right-5 md:left-5 md:flex-row md:flex-wrap md:items-start"
      >
        <div className="flex min-w-0 flex-col gap-3 md:flex-1 md:flex-row md:flex-nowrap md:items-start">
          <div className="flex w-full max-w-[476px] min-w-0 items-start gap-2 self-center sm:self-start md:w-auto md:max-w-none md:shrink-0">
            {onOpenSidebar && (
              <button
                type="button"
                onClick={onOpenSidebar}
                className="text-text-secondary hover:text-text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white shadow-sm transition focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none md:hidden dark:bg-zinc-950 dark:text-gray-300 dark:hover:text-white"
                aria-label="사이드바 열기"
                title="사이드바 열기"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div
              ref={collapsedSearchRef}
              className="relative min-w-0 flex-1 md:w-[360px] md:flex-none lg:w-[420px]"
            >
              <StorePanelSearchBar
                activeMapCategory={activeMapCategory}
                hasActiveServiceFilter={
                  isBenefitCategory
                    ? hasActiveBenefitServiceFilter
                    : hasActiveServiceFilter
                }
                hasMoreStorePages={hasMoreStorePages}
                isStoreListCollapsed={!isListOpen}
                isTagSearchQuery={isTagSearchQuery}
                onClearFilters={
                  isBenefitCategory
                    ? clearBenefitServiceFilters
                    : clearServiceFilters
                }
                onInputFocus={openSearchHistory}
                onInputMouseDown={toggleSearchHistoryOnInputMouseDown}
                onQueryChange={handleSearchQueryChange}
                onSubmit={() => {
                  void submitStoreSearch();
                }}
                onToggleStoreList={onToggleStoreList}
                pagedStoreCount={pagedMapStores.length}
                searchInputRef={searchInputRef}
                searchQuery={searchQuery}
                storeCount={mapStores.length}
              />

              {isSearchHistoryOpen && (
                <StorePanelSearchDropdown
                  isSearchHistoryEnabled={isSearchHistoryEnabled}
                  onClearHistory={clearSearchHistory}
                  onRemoveHistory={removeSearchHistory}
                  onSelectHistory={selectSearchHistory}
                  onSelectService={(service) => {
                    addSearchHistory(searchQuery);
                    applyServiceFilterSearch([service]);
                  }}
                  onSelectStore={(storeId) => runStoreSearch(storeId)}
                  onToggleHistoryEnabled={toggleSearchHistoryEnabled}
                  searchedServices={searchedServices}
                  searchHistory={searchHistory}
                  searchQuery={searchQuery}
                  searchResultStores={searchResultStores}
                />
              )}
            </div>
          </div>

          {isListOpen || !isDesktop ? null : isBenefitCategory ? (
            <StorePanelBenefitFilters
              onChange={(nextValue) => {
                closeSelectedStoreInfo();
                setBenefitServiceFilters(nextValue);
              }}
              options={benefitServiceFilterOptions}
              value={benefitServiceFilters}
            />
          ) : (
            <StorePanelServiceFilters
              consultOptions={consultServiceFilterOptions}
              consultValue={consultServiceFilters}
              onChange={handleServiceFilterChange}
              providedOptions={providedServiceFilterOptions}
              providedValue={providedServiceFilters}
            />
          )}
        </div>
      </div>
    </div>
  );
};
