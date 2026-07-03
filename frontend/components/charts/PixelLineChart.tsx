/**
 * Single-series line chart, hand-built on react-native-svg (template
 * convention — no chart library). Recessive gridlines, square pixel markers,
 * one selective direct label on the max point; identity comes from the frame
 * title, so no legend. Renders real data only — empty states are handled by
 * the screen before this mounts.
 */
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { Hub, PIXEL_FONT } from '@/constants/theme';
import { CHART_HEIGHT } from './ChartFrame';

interface Props {
  values: number[];
  labels: string[]; // x labels, same length
  color: string;
  width: number;
  formatValue?: (v: number) => string;
}

const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 18;
const PAD_B = 20;

export function PixelLineChart({ values, labels, color, width, formatValue }: Props) {
  const h = CHART_HEIGHT;
  const plotW = width - PAD_L - PAD_R;
  const plotH = h - PAD_T - PAD_B;
  const max = Math.max(...values, 1);

  const x = (i: number) =>
    PAD_L + (values.length === 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH;

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const maxIdx = values.indexOf(Math.max(...values));
  const fmt = formatValue ?? ((v: number) => String(Math.round(v)));

  // At most ~5 x labels to avoid collisions.
  const labelStep = Math.max(1, Math.ceil(values.length / 5));

  return (
    <Svg width={width} height={h}>
      {/* recessive grid: 3 horizontal lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <Line
          key={f}
          x1={PAD_L}
          x2={PAD_L + plotW}
          y1={PAD_T + plotH * f}
          y2={PAD_T + plotH * f}
          stroke={Hub.panelBevel}
          strokeWidth={2}
        />
      ))}
      {/* baseline */}
      <Line
        x1={PAD_L}
        x2={PAD_L + plotW}
        y1={PAD_T + plotH}
        y2={PAD_T + plotH}
        stroke={Hub.textDim}
        strokeWidth={2}
      />
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} />
      {/* square pixel markers */}
      {values.map((v, i) => (
        <Rect key={i} x={x(i) - 3} y={y(v) - 3} width={6} height={6} fill={color} />
      ))}
      {/* selective direct label: max point only, in text ink */}
      <SvgText
        x={Math.min(Math.max(x(maxIdx), PAD_L + 16), PAD_L + plotW - 16)}
        y={Math.max(y(values[maxIdx]) - 8, 10)}
        fill={Hub.white}
        fontFamily={PIXEL_FONT}
        fontSize={8}
        textAnchor="middle"
      >
        {fmt(values[maxIdx])}
      </SvgText>
      {/* x labels */}
      {labels.map((lab, i) =>
        i % labelStep === 0 ? (
          <SvgText
            key={i}
            x={x(i)}
            y={h - 6}
            fill={Hub.textDim}
            fontFamily={PIXEL_FONT}
            fontSize={7}
            textAnchor="middle"
          >
            {lab}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}
