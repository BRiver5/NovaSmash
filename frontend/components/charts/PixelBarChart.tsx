/**
 * Single-series bar chart on react-native-svg. Square-edged pixel bars with a
 * 2px surface gap between neighbors, recessive baseline, selective direct
 * label on the max bar only. No legend — the frame title names the series.
 */
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { Hub, PIXEL_FONT } from '@/constants/theme';
import { CHART_HEIGHT } from './ChartFrame';

interface Props {
  values: number[];
  labels: string[];
  color: string;
  width: number;
}

const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 18;
const PAD_B = 20;
const BAR_GAP = 2;

export function PixelBarChart({ values, labels, color, width }: Props) {
  const h = CHART_HEIGHT;
  const plotW = width - PAD_L - PAD_R;
  const plotH = h - PAD_T - PAD_B;
  const max = Math.max(...values, 1);
  const slot = plotW / values.length;
  const barW = Math.max(3, slot - BAR_GAP * 2);
  const maxIdx = values.indexOf(Math.max(...values));
  const labelStep = Math.max(1, Math.ceil(values.length / 5));

  return (
    <Svg width={width} height={h}>
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
      {values.map((v, i) => {
        const barH = Math.max(2, (v / max) * plotH);
        return (
          <Rect
            key={i}
            x={PAD_L + i * slot + BAR_GAP}
            y={PAD_T + plotH - barH}
            width={barW}
            height={barH}
            fill={color}
          />
        );
      })}
      <Line
        x1={PAD_L}
        x2={PAD_L + plotW}
        y1={PAD_T + plotH}
        y2={PAD_T + plotH}
        stroke={Hub.textDim}
        strokeWidth={2}
      />
      <SvgText
        x={Math.min(Math.max(PAD_L + maxIdx * slot + slot / 2, PAD_L + 12), PAD_L + plotW - 12)}
        y={Math.max(PAD_T + plotH - (values[maxIdx] / max) * plotH - 6, 10)}
        fill={Hub.white}
        fontFamily={PIXEL_FONT}
        fontSize={8}
        textAnchor="middle"
      >
        {Math.round(values[maxIdx])}
      </SvgText>
      {labels.map((lab, i) =>
        i % labelStep === 0 ? (
          <SvgText
            key={i}
            x={PAD_L + i * slot + slot / 2}
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
