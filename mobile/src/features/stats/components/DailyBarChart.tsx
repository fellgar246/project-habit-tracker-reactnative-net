import { View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { useTheme } from '../../../theme';

type ChartPoint = {
  label: string;
  value: number;
};

type DailyBarChartProps = {
  data: ChartPoint[];
  color?: string;
  height?: number;
};

export function DailyBarChart({ data, color, height = 200 }: DailyBarChartProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.primary;

  if (data.every((point) => point.value === 0)) {
    return null;
  }

  return (
    <View style={{ height, width: '100%' }}>
      <CartesianChart
        data={data}
        xKey="label"
        yKeys={['value']}
        domainPadding={{ left: 8, right: 8, top: 12 }}
        padding={{ left: 8, right: 8, top: 8, bottom: 8 }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.value}
            chartBounds={chartBounds}
            color={barColor}
            roundedCorners={{ topLeft: 3, topRight: 3 }}
            innerPadding={0.2}
          />
        )}
      </CartesianChart>
    </View>
  );
}
