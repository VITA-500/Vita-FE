"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck,
  Check,
  ChevronDown,
  LocateFixed,
  LocateOff,
  Menu,
  Route,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import {
  formatDurationSeconds,
  formatRemainingDistance,
  formatWalkingTime,
  getDistanceMeters,
} from "@/features/store/lib/geo";
import { storeService } from "@/features/store/lib/storeService";
import type { StoreLocation, StoreRoute } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { showToast } from "@/shared/ui/ToastProvider";

type StoreMapPanelProps = {
  onOpenSidebar?: () => void;
};

const defaultMapLocation = {
  lat: 37.5665,
  lng: 126.978,
};

type MapCategory = "store" | "benefit";

type MapSearchPoint = {
  lat: number;
  lng: number;
};

const serviceBadgeClassName =
  "bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300";

type ServiceFilterOption = {
  label: string;
  value: string;
};

const MultiFilterDropdown = ({
  "aria-label": ariaLabel,
  emptyLabel,
  onChange,
  options,
  value,
}: {
  "aria-label": string;
  emptyLabel: string;
  onChange: (value: string[]) => void;
  options: readonly ServiceFilterOption[];
  value: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabels = value
    .map(
      (selectedValue) =>
        options.find((option) => option.value === selectedValue)?.label,
    )
    .filter(Boolean);
  const buttonLabel =
    selectedLabels.length === 0
      ? emptyLabel
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels[0]} 외 ${selectedLabels.length - 1}`;

  const toggleValue = (nextValue: string) => {
    onChange(
      value.includes(nextValue)
        ? value.filter((selectedValue) => selectedValue !== nextValue)
        : [...value, nextValue],
    );
  };

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-border hover:border-brand/40 flex h-12 w-full items-center justify-between gap-2 rounded-sm border bg-white px-4 text-sm font-extrabold text-gray-700 shadow-sm transition hover:text-gray-950 dark:border-white/10 dark:bg-zinc-950/92 dark:text-gray-200 dark:hover:text-white"
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10"
              aria-label="닫기"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              role="listbox"
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="border-border-soft absolute right-0 z-20 mt-2 w-full origin-top-right rounded-sm border bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="max-h-72 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
                {value.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-text-secondary flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm font-semibold transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-white/10"
                  >
                    전체 해제
                  </button>
                )}
                {options.map((option) => {
                  const isSelected = value.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggleValue(option.value)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm font-semibold transition-colors duration-200",
                        isSelected
                          ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10",
                      )}
                    >
                      {option.label}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ServiceBadges = ({
  services,
  title,
}: {
  services?: string[];
  title: string;
}) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-text-secondary mb-2 text-[11px] font-extrabold">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {services.map((service) => (
          <span key={service} className={serviceBadgeClassName}>
            {service}
          </span>
        ))}
      </div>
    </div>
  );
};

const StoreInfoBubble = ({
  isLoading,
  isWaitingForPinSelection,
  onStartRoute,
  onReserve,
  routeSummary,
  store,
}: {
  isLoading: boolean;
  isWaitingForPinSelection: boolean;
  onStartRoute: (store: StoreLocation) => void;
  onReserve: (store: StoreLocation) => void;
  routeSummary?: {
    isLoading?: boolean;
    remainingDistanceText: string;
    walkingTimeText: string;
  } | null;
  store?: StoreLocation;
}) => {
  const title = isLoading
    ? "근처 매장 검색"
    : isWaitingForPinSelection || !store
      ? "매장 선택"
      : "선택한 매장";

  const header = (
    <div className="min-w-0">
      <p className="text-brand text-xs font-bold">{title}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-sm shadow-lg backdrop-blur after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95 dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92">
        {header}
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="border-brand size-4 animate-spin rounded-full border-2 border-t-transparent"
          />
          <div>
            <p className="font-extrabold text-gray-950 dark:text-white">
              근처 매장을 불러오는 중
            </p>
            <p className="text-text-secondary mt-1 text-xs font-semibold">
              새 기준 위치 주변 매장을 찾고 있어요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isWaitingForPinSelection || !store) {
    return (
      <div className="border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-sm shadow-lg backdrop-blur after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95 dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92">
        {header}
        <div className="mt-3">
          <p className="font-extrabold text-gray-950 dark:text-white">
            매장 핀을 선택해 주세요
          </p>
          <p className="text-text-secondary mt-1 text-xs leading-5 font-semibold">
            지도 위 매장 핀을 누르면 운영시간과 예약 정보를 확인할 수 있어요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-left text-sm shadow-lg backdrop-blur after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95 dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92">
      {header}
      <div className="mt-3">
        <p className="text-base font-extrabold text-gray-950 dark:text-white">
          {store.name}
        </p>

        <p className="text-text-secondary mt-1 text-xs leading-5 font-semibold">
          {store.address}
        </p>
        {store.phone && (
          <p className="text-text-secondary mt-2 text-xs font-semibold">
            {store.phone}
          </p>
        )}
        {store.businessHours && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-text-secondary">
              운영시간 {store.businessHours}
            </span>
          </div>
        )}
        <ServiceBadges title="상담 가능" services={store.consultServices} />
        <ServiceBadges title="제공 서비스" services={store.providedServices} />

        {routeSummary && (
          <div className="bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand mt-4 grid grid-cols-2 gap-2 rounded-sm p-3 text-xs font-extrabold">
            <span>
              남은 거리
              <strong className="mt-1 block text-sm">
                {routeSummary.isLoading
                  ? "계산 중"
                  : routeSummary.remainingDistanceText}
              </strong>
            </span>
            <span>
              예상 시간
              <strong className="mt-1 block text-sm">
                {routeSummary.isLoading
                  ? "계산 중"
                  : routeSummary.walkingTimeText}
              </strong>
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            variant="primary"
            size="sm"
            className="rounded-full"
            onClick={() => onStartRoute(store)}
          >
            <Route size={16} />
            길찾기
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onReserve(store)}
          >
            <CalendarCheck size={16} />
            예약하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export const StoreMapPanel = ({ onOpenSidebar }: StoreMapPanelProps) => {
  const [stores, setStores] = useState(() => storeService.getNearbyStores());
  const [, setIsStorePanelOpen] = useState(false);
  const [focusPoint, setFocusPoint] = useState<MapSearchPoint | null>(null);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  const [searchPoint, setSearchPoint] = useState<MapSearchPoint | null>(null);
  const [isMapSearchLoading, setIsMapSearchLoading] = useState(false);
  const [isWaitingForPinSelection, setIsWaitingForPinSelection] =
    useState(false);
  const [hasSelectedStoreInfo, setHasSelectedStoreInfo] = useState(false);
  const [reservationStore, setReservationStore] =
    useState<StoreLocation | null>(null);
  const [isToastBackdropVisible, setIsToastBackdropVisible] = useState(false);
  const [consultServiceFilters, setConsultServiceFilters] = useState<string[]>(
    [],
  );
  const [providedServiceFilters, setProvidedServiceFilters] = useState<
    string[]
  >([]);
  const [activeMapCategory, setActiveMapCategory] =
    useState<MapCategory>("store");
  const collapsedSearchRef = useRef<HTMLDivElement>(null);
  const hasFocusedInitialLocationRef = useRef(false);
  const lastNearbyLookupKeyRef = useRef("");
  const shouldFocusUserLocationRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    displayStores,
    locationStatus,
    requestLocation,
    searchQuery,
    selectedStore,
    setSearchQuery,
    setSelectedStoreId,
    userLocation,
    watchLocation,
  } = useStoreMapState(stores);
  const [routeDestinationStoreId, setRouteDestinationStoreId] = useState("");
  const [walkingRoute, setWalkingRoute] = useState<StoreRoute | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const consultServiceFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(stores.flatMap((store) => store.consultServices ?? [])),
      ).map((service) => ({ label: service, value: service })),
    [stores],
  );
  const providedServiceFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(stores.flatMap((store) => store.providedServices ?? [])),
      ).map((service) => ({ label: service, value: service })),
    [stores],
  );
  const filterStoresByServices = (storeRows: StoreLocation[]) =>
    storeRows.filter((store) => {
      const consultServices = store.consultServices ?? [];
      const providedServices = store.providedServices ?? [];
      const matchesConsultService = consultServiceFilters.every((service) =>
        consultServices.includes(service),
      );
      const matchesProvidedService = providedServiceFilters.every((service) =>
        providedServices.includes(service),
      );

      return matchesConsultService && matchesProvidedService;
    });
  const categoryStores =
    activeMapCategory === "store" ? filterStoresByServices(stores) : [];
  const categoryDisplayStores =
    activeMapCategory === "store" ? filterStoresByServices(displayStores) : [];
  const categorySelectedStore =
    activeMapCategory === "store"
      ? (categoryDisplayStores.find(
          (store) => store.id === selectedStore?.id,
        ) ??
        categoryDisplayStores[0] ??
        categoryStores.find((store) => store.id === selectedStore?.id) ??
        categoryStores[0])
      : undefined;
  const categorySelectedStoreId =
    activeMapCategory === "store" ? (categorySelectedStore?.id ?? "") : "";
  const hasActiveServiceFilter =
    consultServiceFilters.length > 0 || providedServiceFilters.length > 0;
  const mapStores =
    searchQuery || hasActiveServiceFilter
      ? categoryDisplayStores
      : categoryStores;
  const routeDestinationStore =
    categoryStores.find((store) => store.id === routeDestinationStoreId) ??
    stores.find((store) => store.id === routeDestinationStoreId);
  const visibleMapStores =
    routeDestinationStoreId && routeDestinationStore
      ? [routeDestinationStore]
      : mapStores;
  const routeSummary = useMemo(() => {
    if (!userLocation || !routeDestinationStore) {
      return null;
    }

    const remainingDistanceMeters =
      walkingRoute?.distanceMeters ??
      getDistanceMeters(userLocation, routeDestinationStore);

    return {
      isLoading: isRouteLoading,
      remainingDistanceText: formatRemainingDistance(remainingDistanceMeters),
      walkingTimeText: walkingRoute
        ? formatDurationSeconds(walkingRoute.durationSeconds)
        : formatWalkingTime(remainingDistanceMeters),
    };
  }, [isRouteLoading, routeDestinationStore, userLocation, walkingRoute]);
  const routePreview = useMemo(() => {
    if (!userLocation || !routeDestinationStore) {
      return null;
    }

    const destination = {
      lat: routeDestinationStore.lat,
      lng: routeDestinationStore.lng,
    };
    const fallbackPath = [userLocation, destination];
    const routePath = walkingRoute?.path.length
      ? [userLocation, ...walkingRoute.path, destination]
      : fallbackPath;
    const routeKey = walkingRoute?.path.length
      ? `route:${routeDestinationStoreId}`
      : `fallback:${routeDestinationStoreId}`;

    return {
      destination,
      origin: userLocation,
      path: routePath,
      routeKey,
    };
  }, [
    routeDestinationStore,
    routeDestinationStoreId,
    userLocation,
    walkingRoute,
  ]);
  const isRouteSearchOverlayVisible =
    isRouteLoading &&
    locationStatus !== "denied" &&
    locationStatus !== "error" &&
    locationStatus !== "unsupported";
  const nearbyLookup = useMemo(() => {
    const lookupLocation =
      userLocation ??
      (locationStatus === "denied" ||
      locationStatus === "error" ||
      locationStatus === "unsupported"
        ? defaultMapLocation
        : null);

    if (!lookupLocation) {
      return null;
    }

    const lat = Number(lookupLocation.lat.toFixed(3));
    const lng = Number(lookupLocation.lng.toFixed(3));

    return {
      key: `${lat}:${lng}`,
      location: { lat, lng },
    };
  }, [locationStatus, userLocation]);

  const updateStoresByLocation = (
    lookupLocation: MapSearchPoint,
    options?: { showLoadingCard?: boolean },
  ) => {
    let isCurrentRequest = true;

    if (options?.showLoadingCard) {
      setIsMapSearchLoading(true);
      setIsWaitingForPinSelection(false);
      setHasSelectedStoreInfo(false);
    }

    storeService
      .fetchNearbyStores(lookupLocation)
      .then((nearbyStores) => {
        if (isCurrentRequest) {
          setStores(nearbyStores);
          if (options?.showLoadingCard) {
            setHasSelectedStoreInfo(false);
            setSelectedStoreId("");
            setIsWaitingForPinSelection(true);
          }
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setStores(storeService.getNearbyStores());
          if (options?.showLoadingCard) {
            setHasSelectedStoreInfo(false);
            setSelectedStoreId("");
            setIsWaitingForPinSelection(true);
          }
        }
      })
      .finally(() => {
        if (isCurrentRequest && options?.showLoadingCard) {
          setIsMapSearchLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  };

  const handleStoreSelect = (
    storeId: string,
    options?: { focusMap?: boolean },
  ) => {
    setHasSelectedStoreInfo(true);
    setIsWaitingForPinSelection(false);
    setSelectedStoreId(storeId);

    if (options?.focusMap) {
      const nextStore =
        categoryDisplayStores.find((store) => store.id === storeId) ??
        categoryStores.find((store) => store.id === storeId);

      if (nextStore) {
        setFocusPoint({ lat: nextStore.lat, lng: nextStore.lng });
        setSearchPoint(null);
      }
    }
  };

  const handleRouteStart = (store: StoreLocation) => {
    setRouteDestinationStoreId(store.id);
    setWalkingRoute(null);
    setIsRouteLoading(true);
    handleStoreSelect(store.id, { focusMap: true });
    watchLocation();

    if (!userLocation) {
      showToast("현재 위치를 확인한 뒤 경로를 표시할게요.");
    }
  };

  useEffect(() => {
    if (!routeDestinationStoreId || !userLocation) {
      return;
    }

    let isCurrentRequest = true;

    storeService
      .fetchWalkingRoute(routeDestinationStoreId, userLocation)
      .then((route) => {
        if (isCurrentRequest) {
          setWalkingRoute(route);
        }
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setWalkingRoute(null);
          if (!(
            error instanceof Error && error.message === "NON_API_STORE_ID"
          )) {
            showToast("실제 보행 경로를 불러오지 못해 직선 경로로 표시해요.");
          }
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsRouteLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [routeDestinationStoreId, userLocation]);

  const handleReservationConfirm = () => {
    if (!reservationStore) {
      return;
    }

    setReservationStore(null);
    setIsToastBackdropVisible(true);
    showToast("예약이 완료되었습니다.");

    window.setTimeout(() => {
      setIsToastBackdropVisible(false);
    }, 1700);
  };

  const closeSelectedStoreInfo = () => {
    setHasSelectedStoreInfo(false);
  };

  useEffect(() => {
    if (locationStatus === "idle") {
      requestLocation();
    }
  }, [locationStatus, requestLocation]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    if (
      !hasFocusedInitialLocationRef.current ||
      shouldFocusUserLocationRef.current
    ) {
      const shouldShowCurrentLocationSearch =
        shouldFocusUserLocationRef.current;

      setFocusPoint({ lat: userLocation.lat, lng: userLocation.lng });
      setSearchPoint(
        shouldShowCurrentLocationSearch
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : null,
      );
      hasFocusedInitialLocationRef.current = true;
      shouldFocusUserLocationRef.current = false;
    }
  }, [userLocation]);

  useEffect(() => {
    if (!nearbyLookup) {
      return;
    }

    if (lastNearbyLookupKeyRef.current === nearbyLookup.key) {
      return;
    }

    lastNearbyLookupKeyRef.current = nearbyLookup.key;

    let isCurrentRequest = true;

    storeService
      .fetchNearbyStores(nearbyLookup.location)
      .then((nearbyStores) => {
        if (isCurrentRequest) {
          setStores(nearbyStores);
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setStores(storeService.getNearbyStores());
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [nearbyLookup]);

  useEffect(() => {
    if (!isSearchHistoryOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        collapsedSearchRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsSearchHistoryOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSearchHistoryOpen]);

  return (
    <div className="relative h-full min-h-[640px] overflow-hidden">
      <StoreMapPreview
        className="absolute inset-0"
        focusPoint={focusPoint}
        isFullBleed
        isSearchFromMapPointLoading={isMapSearchLoading}
        routePreview={routePreview}
        isRouteCardDocked={
          routeDestinationStoreId === categorySelectedStore?.id
        }
        selectedStore={hasSelectedStoreInfo ? categorySelectedStore : undefined}
        selectedStoreCard={
          hasSelectedStoreInfo ? (
            <StoreInfoBubble
              isLoading={isMapSearchLoading}
              isWaitingForPinSelection={isWaitingForPinSelection}
              routeSummary={
                routeDestinationStoreId === categorySelectedStore?.id
                  ? routeSummary
                  : null
              }
              store={
                isWaitingForPinSelection ? undefined : categorySelectedStore
              }
              onStartRoute={handleRouteStart}
              onReserve={setReservationStore}
            />
          ) : null
        }
        selectedStoreId={hasSelectedStoreInfo ? categorySelectedStoreId : ""}
        stores={visibleMapStores}
        searchPoint={searchPoint}
        userLocation={userLocation}
        onMapPointSelect={setSearchPoint}
        onSelectedStoreCardClose={closeSelectedStoreInfo}
        onSearchFromMapPoint={() => {
          if (!searchPoint) {
            return;
          }

          updateStoresByLocation(searchPoint, { showLoadingCard: true });
        }}
        onSelectStore={handleStoreSelect}
      />

      <div className="pointer-events-none absolute inset-0 z-10 pt-16 md:pt-0">
        <div className="pointer-events-auto absolute top-3 right-3 left-3 flex flex-col gap-3 md:top-5 md:right-5 md:left-5 md:flex-row md:flex-wrap md:items-start">
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-start">
            <div ref={collapsedSearchRef} className="min-w-0 md:w-[420px]">
              <div className="flex h-12 items-center overflow-hidden rounded-sm text-left shadow-sm">
                <div className="bg-brand flex h-full w-[132px] shrink-0 items-center text-white md:w-[116px]">
                  {onOpenSidebar && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenSidebar();
                      }}
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15 md:hidden"
                      aria-label="사이드바 열기"
                    >
                      <Menu size={20} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchHistoryOpen(false);
                      setIsStorePanelOpen(true);
                    }}
                    className="hover:bg-brand-hover flex h-full min-w-0 flex-1 items-center justify-center px-2 text-sm font-extrabold transition md:px-0"
                    aria-label="매장 검색 패널 열기"
                  >
                    VITA map
                  </button>
                </div>
                <label className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 bg-white px-4 text-sm font-semibold text-gray-400 dark:bg-zinc-950">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setIsSearchHistoryOpen(true)}
                    onMouseDown={() => {
                      if (document.activeElement === searchInputRef.current) {
                        setIsSearchHistoryOpen((isOpen) => !isOpen);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        const firstStore = categoryDisplayStores[0];

                        if (firstStore) {
                          handleStoreSelect(firstStore.id, {
                            focusMap: true,
                          });
                        }
                        setIsSearchHistoryOpen(false);
                        setIsStorePanelOpen(true);
                      }
                    }}
                    placeholder="매장명, 주소, 전화번호 검색"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400/85 dark:text-white"
                    aria-label="매장명, 주소, 전화번호 검색"
                  />
                  <Search size={22} className="shrink-0 text-gray-300/90" />
                </label>
              </div>

              {isSearchHistoryOpen && (
                <div className="ml-[116px] w-[calc(100%-116px)] overflow-hidden bg-white text-sm shadow-sm dark:bg-zinc-950">
                  {searchQuery ? (
                    <div className="max-h-48 overflow-y-auto py-1">
                      {categoryDisplayStores.slice(0, 4).map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => {
                            handleStoreSelect(store.id, { focusMap: true });
                            setIsSearchHistoryOpen(false);
                            setIsStorePanelOpen(true);
                          }}
                          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                        >
                          <span className="min-w-0 truncate">{store.name}</span>
                          {store.distanceText && (
                            <span className="shrink-0 text-xs text-gray-400">
                              {store.distanceText}
                            </span>
                          )}
                        </button>
                      ))}

                      {categoryDisplayStores.length === 0 && (
                        <div className="flex h-14 cursor-default items-center justify-center text-sm font-medium text-gray-400/85">
                          검색 결과가 없어요.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-14 cursor-default items-center justify-center gap-2 text-gray-400/85">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-300/80 text-[11px] leading-none font-bold text-gray-300">
                        i
                      </span>
                      <span className="text-sm font-medium">
                        히스토리가 없어요.
                      </span>
                    </div>
                  )}
                  <div className="flex h-12 cursor-default items-center bg-gray-50 px-5 dark:bg-white/[0.04]">
                    <button
                      type="button"
                      className="cursor-pointer text-sm font-medium text-gray-400/90"
                    >
                      히스토리 끄기
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 md:w-[340px]">
              <div className="grid grid-cols-2 gap-2">
                <MultiFilterDropdown
                  aria-label="상담 가능한 카테고리 필터"
                  emptyLabel="상담 전체"
                  options={consultServiceFilterOptions}
                  value={consultServiceFilters}
                  onChange={setConsultServiceFilters}
                />
                <MultiFilterDropdown
                  aria-label="제공서비스 필터"
                  emptyLabel="서비스 전체"
                  options={providedServiceFilterOptions}
                  value={providedServiceFilters}
                  onChange={setProvidedServiceFilters}
                />
              </div>
            </div>

            <div className="flex w-full max-w-[300px] shrink-0 items-center justify-start gap-2 md:w-auto md:justify-end">
              <div className="relative">
                <div className="flex h-12 overflow-hidden rounded-sm bg-white text-sm font-extrabold shadow-sm dark:bg-zinc-950">
                  {[
                    { label: "매장", value: "store" },
                    { label: "혜택", value: "benefit" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setActiveMapCategory(item.value as MapCategory)
                      }
                      className={
                        activeMapCategory === item.value
                          ? "bg-brand dark:bg-brand px-5 text-white dark:text-zinc-950"
                          : "px-5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {activeMapCategory === "benefit" && (
                  <div className="absolute top-full right-0 mt-2 w-[260px] rounded-sm bg-white/95 px-4 py-3 text-xs leading-5 font-semibold text-gray-500 shadow-sm backdrop-blur dark:bg-zinc-950/90 dark:text-gray-300">
                    혜택/제휴 매장은 API 확정 후 표시됩니다.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  shouldFocusUserLocationRef.current = true;
                  requestLocation();
                  if (userLocation) {
                    setFocusPoint({
                      lat: userLocation.lat,
                      lng: userLocation.lng,
                    });
                    setSearchPoint({
                      lat: userLocation.lat,
                      lng: userLocation.lng,
                    });
                    hasFocusedInitialLocationRef.current = true;
                    shouldFocusUserLocationRef.current = false;
                  }

                  if (routeDestinationStoreId) {
                    watchLocation();
                  }
                }}
                disabled={locationStatus === "requesting"}
                className="flex h-12 items-center gap-2 rounded-sm bg-white px-4 text-sm font-extrabold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-950 dark:text-gray-200 dark:hover:bg-zinc-900"
              >
                {locationStatus === "granted" ? (
                  <LocateFixed size={16} className="text-brand" />
                ) : (
                  <LocateOff size={16} className="text-gray-400" />
                )}
                내 위치로 이동
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽 사이드바는 지도 UI 재배치 중 임시 비활성화
        {isStorePanelOpen ? (
          <div className="pointer-events-auto absolute right-0 bottom-0 left-0 h-[min(78vh,620px)] md:top-0 md:bottom-0 md:left-auto md:h-auto md:w-[min(420px,100%)]">
            <button
              type="button"
              onClick={() => setIsStorePanelOpen(false)}
              className="absolute top-px left-1/2 z-20 flex h-5 w-14 -translate-x-1/2 -translate-y-full items-center justify-center rounded-t-sm bg-white shadow-[0_-1px_3px_rgba(15,23,42,0.12)] transition hover:bg-gray-50 md:top-1/2 md:left-px md:h-14 md:w-5 md:-translate-x-full md:-translate-y-1/2 md:rounded-t-none md:rounded-l-sm md:shadow-[-1px_0_3px_rgba(15,23,42,0.12)] dark:bg-zinc-950 dark:hover:bg-zinc-900"
              aria-label="매장 패널 접기"
            >
              <span
                className="bg-brand h-2 w-3 [clip-path:polygon(0_0,100%_0,50%_100%)] md:h-3 md:w-2 md:[clip-path:polygon(0_0,100%_50%,0_100%)]"
                aria-hidden="true"
              />
            </button>

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_32px_rgba(15,23,42,0.10)] transition-transform duration-300 ease-out md:rounded-none md:shadow-[-12px_0_32px_rgba(15,23,42,0.08)] dark:bg-zinc-950">
              <div className="border-border flex h-14 shrink-0 items-center border-b px-4 dark:border-white/10">
                <span className="text-sm font-extrabold text-gray-950 dark:text-white">
                  매장 탐색
                </span>
              </div>

              <StoreList
                activeFilter={activeFilter}
                locationStatus={locationStatus}
                onActiveFilterChange={setActiveFilter}
                onQueryChange={setSearchQuery}
                onRefreshLocation={requestLocation}
                query={searchQuery}
                variant="docked"
                selectedStoreId={categorySelectedStoreId}
                stores={categorySortedStores}
                onSelectStore={setSelectedStoreId}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              ref={collapsedSearchRef}
              className="pointer-events-auto absolute top-3 right-3 left-3 md:top-5 md:right-5 md:left-auto md:w-[min(420px,calc(100%-40px))]"
            >
              <div className="flex h-12 items-center overflow-hidden rounded-sm text-left shadow-sm">
                <div className="bg-brand flex h-full w-[132px] shrink-0 items-center text-white md:w-[116px]">
                  {onOpenSidebar && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenSidebar();
                      }}
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15 md:hidden"
                      aria-label="사이드바 열기"
                    >
                      <Menu size={20} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchHistoryOpen(false);
                      setIsStorePanelOpen(true);
                    }}
                    className="hover:bg-brand-hover flex h-full min-w-0 flex-1 items-center justify-center px-2 text-sm font-extrabold transition md:px-0"
                    aria-label="매장 검색 패널 열기"
                  >
                    VITA map
                  </button>
                </div>
                <label className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 bg-white px-4 text-sm font-semibold text-gray-400 dark:bg-zinc-950">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setIsSearchHistoryOpen(true)}
                    onMouseDown={() => {
                      if (document.activeElement === searchInputRef.current) {
                        setIsSearchHistoryOpen((isOpen) => !isOpen);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        setIsSearchHistoryOpen(false);
                        setIsStorePanelOpen(true);
                      }
                    }}
                    placeholder="매장명, 주소, 전화번호 검색"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400/85 dark:text-white"
                    aria-label="매장명, 주소, 전화번호 검색"
                  />
                  <Search size={22} className="shrink-0 text-gray-300/90" />
                </label>
              </div>

              {isSearchHistoryOpen && (
                <div className="ml-[116px] w-[calc(100%-116px)] overflow-hidden bg-white text-sm shadow-sm dark:bg-zinc-950">
                  {searchQuery ? (
                    <div className="max-h-48 overflow-y-auto py-1">
                      {categoryDisplayStores.slice(0, 4).map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => {
                            setSelectedStoreId(store.id);
                            setIsSearchHistoryOpen(false);
                            setIsStorePanelOpen(true);
                          }}
                          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                        >
                          <span className="min-w-0 truncate">{store.name}</span>
                          {store.distanceText && (
                            <span className="shrink-0 text-xs text-gray-400">
                              {store.distanceText}
                            </span>
                          )}
                        </button>
                      ))}

                      {categoryDisplayStores.length === 0 && (
                        <div className="flex h-14 cursor-default items-center justify-center text-sm font-medium text-gray-400/85">
                          검색 결과가 없어요.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-14 cursor-default items-center justify-center gap-2 text-gray-400/85">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-300/80 text-[11px] leading-none font-bold text-gray-300">
                        i
                      </span>
                      <span className="text-sm font-medium">
                        히스토리가 없어요.
                      </span>
                    </div>
                  )}
                  <div className="flex h-12 cursor-default items-center bg-gray-50 px-5 dark:bg-white/[0.04]">
                    <button
                      type="button"
                      className="cursor-pointer text-sm font-medium text-gray-400/90"
                    >
                      히스토리 끄기
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSearchHistoryOpen(false);
                setIsStorePanelOpen(true);
              }}
              className="pointer-events-auto absolute bottom-0 left-1/2 z-20 flex h-5 w-14 -translate-x-1/2 items-center justify-center rounded-t-sm bg-white shadow-[0_-1px_3px_rgba(15,23,42,0.12)] transition hover:bg-gray-50 md:top-1/2 md:right-0 md:bottom-auto md:left-auto md:h-14 md:w-5 md:translate-x-0 md:-translate-y-1/2 md:rounded-t-none md:rounded-l-sm md:shadow-[-1px_0_3px_rgba(15,23,42,0.12)] dark:bg-zinc-950 dark:hover:bg-zinc-900"
              aria-label="매장 검색 패널 열기"
            >
              <span
                className="bg-brand h-2 w-3 [clip-path:polygon(50%_0,0_100%,100%_100%)] md:h-3 md:w-2 md:[clip-path:polygon(100%_0,0_50%,100%_100%)]"
                aria-hidden="true"
              />
            </button>
          </>
        )}
        */}
      </div>

      {isToastBackdropVisible && (
        <div
          className="pointer-events-none fixed inset-0 z-[990] bg-gray-950/20 transition-opacity"
          aria-hidden="true"
        />
      )}

      {isRouteSearchOverlayVisible && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-6 backdrop-blur-[2px]">
          <div className="border-border w-full max-w-[320px] rounded-sm border bg-white/95 p-5 text-center shadow-2xl dark:border-white/10 dark:bg-zinc-950/95">
            <span
              aria-hidden="true"
              className="border-brand mx-auto block size-8 animate-spin rounded-full border-4 border-t-transparent"
            />
            <p className="mt-4 text-sm font-extrabold text-gray-950 dark:text-white">
              보행 경로 탐색 중
            </p>
            <p className="text-text-secondary mt-2 text-xs leading-5 font-semibold">
              현재 위치에서 선택한 매장까지의 경로와 예상 시간을 계산하고
              있어요.
            </p>
          </div>
        </div>
      )}

      <Modal
        isOpen={reservationStore !== null}
        onClose={() => setReservationStore(null)}
        title="예약 확인"
        description={
          reservationStore
            ? `${reservationStore.name} 방문 예약을 진행할까요?`
            : undefined
        }
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReservationStore(null)}
            >
              취소
            </Button>
            <Button size="sm" onClick={handleReservationConfirm}>
              예약하기
            </Button>
          </>
        }
      >
        예약 후 매장 방문 전 운영시간과 상담 가능 서비스를 한 번 더 확인해
        주세요.
      </Modal>
    </div>
  );
};
