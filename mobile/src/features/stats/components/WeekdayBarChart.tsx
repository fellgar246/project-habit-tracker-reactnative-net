import { View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { useTheme } from '../../../theme';

type WeekdayChartPoint = {
  label: string;
  value: number;
};

type WeekdayBarChartProps = {
  data: WeekdayChartPoint[];
  color?: string;
  height?: number;
};

export function WeekdayBarChart({ data, color, height = 180 }: WeekdayBarChartProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.success;

  if (data.every((point) => point.value === 0)) {
    return null;
  }

  return (
    <View style={{ height, width: '100%' }}>
      <CartesianChart
        data={data}
        xKey="label"
        yKeys={['value']}
        domainPadding={{ left: 12, right: 12, top: 12 }}
        padding={{ left: 8, right: 8, top: 8, bottom: 8 }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.value}
            chartBounds={chartBounds}
            color={barColor}
            roundedCorners={{ topLeft: 4, topRight: 4 }}
            innerPadding={0.15}
          />
        )}
      </CartesianChart>
    </View>
  );
}
