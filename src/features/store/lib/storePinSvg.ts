export const STORE_PIN_SHAPE_CLASS_NAME =
  "text-brand absolute inset-x-0 top-0 mx-auto block h-[46px] w-[34px] drop-shadow-[0_8px_14px_rgba(15,23,42,0.2)] transition group-hover:text-[#f5a400]";

const STORE_PIN_PATH = "M17 44 L4.16 22.75 A15 15 0 1 1 29.84 22.75 Z";

const getStableHash = (value: string) => {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36);
};

export const getMarkerGradientId = ({
  colors,
  coordinateKey,
  storeIds,
}: {
  colors: string[];
  coordinateKey: string;
  storeIds: string[];
}) =>
  `vita-store-pin-gradient-${getStableHash(
    `${coordinateKey}|${[...storeIds].sort().join(",")}|${colors.join(",")}`,
  )}`;

export const getStorePinSvgMarkup = ({
  colors,
  gradientId,
}: {
  colors: string[];
  gradientId: string;
}) => {
  if (colors.length <= 1) {
    const color = colors[0] ?? "currentColor";

    return `<svg viewBox="0 0 34 46" width="34" height="46" aria-hidden="true" style="display:block"><path d="${STORE_PIN_PATH}" fill="${color}" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" /></svg>`;
  }

  const center = { x: 17, y: 20 };
  const radius = 38;
  const angleStep = 360 / colors.length;
  const getPoint = (angle: number) => {
    const radian = ((angle - 90) * Math.PI) / 180;

    return {
      x: Number((center.x + Math.cos(radian) * radius).toFixed(3)),
      y: Number((center.y + Math.sin(radian) * radius).toFixed(3)),
    };
  };
  const clipPaths = colors
    .map((_, index) => {
      const startAngle = index * angleStep;
      const endAngle = (index + 1) * angleStep;
      const start = getPoint(startAngle);
      const end = getPoint(endAngle);
      const largeArcFlag = angleStep > 180 ? 1 : 0;
      const clipId = `${gradientId}-slice-${index}`;

      return `<clipPath id="${clipId}"><path d="M ${center.x} ${center.y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z" /></clipPath>`;
    })
    .join("");
  const slices = colors
    .map(
      (color, index) =>
        `<path d="${STORE_PIN_PATH}" fill="${color}" clip-path="url(#${gradientId}-slice-${index})" />`,
    )
    .join("");

  return `<svg viewBox="0 0 34 46" width="34" height="46" aria-hidden="true" style="display:block"><defs>${clipPaths}</defs>${slices}<path d="${STORE_PIN_PATH}" fill="none" stroke="rgba(255,255,255,0.86)" stroke-width="1.5" stroke-linejoin="round" /></svg>`;
};
