import type { StoreLocation } from "@/features/store/types";

export type ServiceFilterOption = {
  label: string;
  value: string;
};

export type MarkerColorInfo = {
  colors: string[];
  extraServices: { color: string; label: string }[];
};

type ServiceFilterBadgeStyle = {
  backgroundColor: string;
  borderColor: string;
  color: string;
};

export const serviceFilterColors = [
  "#ff8f7f",
  "#f2b84b",
  "#4fc3ae",
  "#3f9dcc",
  "#a98cf0",
  "#ef7fb4",
  "#83c95a",
  "#f39b45",
  "#61aef2",
  "#d779df",
  "#46c4d4",
  "#c9b63f",
];

const withHexAlpha = (color: string, alpha: string) => `${color}${alpha}`;

export const getServiceFilterColor = (index: number) =>
  serviceFilterColors[index % serviceFilterColors.length];

export const getServiceFilterBadgeStyle = (
  color: string,
  isSelected: boolean,
): ServiceFilterBadgeStyle => ({
  backgroundColor: isSelected ? color : "#ffffff",
  borderColor: isSelected ? color : withHexAlpha(color, "55"),
  color: isSelected ? "#ffffff" : color,
});

export const buildServiceFilterColorByValue = (
  options: readonly ServiceFilterOption[],
) =>
  Object.fromEntries(
    options.map((option, index) => [
      option.value,
      getServiceFilterColor(index),
    ]),
  );

export const buildMarkerColorInfoById = ({
  activeServiceFilters,
  colorByValue,
  stores,
}: {
  activeServiceFilters: string[];
  colorByValue: Record<string, string>;
  stores: StoreLocation[];
}): Record<string, MarkerColorInfo> => {
  if (activeServiceFilters.length === 0) {
    return {};
  }

  return Object.fromEntries(
    stores
      .map((store) => {
        const matchedServices = activeServiceFilters.filter(
          (service) =>
            store.consultServices?.includes(service) ||
            store.providedServices?.includes(service),
        );

        if (matchedServices.length === 0) {
          return null;
        }

        const visibleServices = matchedServices.slice(0, 4);
        const extraServices = matchedServices.slice(4).map((service) => ({
          color: colorByValue[service] ?? getServiceFilterColor(0),
          label: service,
        }));
        const colors = visibleServices.map(
          (service) => colorByValue[service] ?? getServiceFilterColor(0),
        );

        return [store.id, { colors, extraServices }];
      })
      .filter((entry): entry is [string, MarkerColorInfo] => entry !== null),
  );
};
