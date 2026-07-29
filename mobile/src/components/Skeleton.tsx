import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme';

type SkeletonProps = {
  height?: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ height = 16, width = '100%', borderRadius, style }: SkeletonProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        {
          height,
          width,
          borderRadius: borderRadius ?? spacing.sm,
          backgroundColor: colors.border,
          opacity: 0.45,
        },
        style,
      ]}
    />
  );
}

type SkeletonListProps = {
  count?: number;
  itemHeight?: number;
  gap?: number;
};

export function SkeletonList({ count = 3, itemHeight = 72, gap }: SkeletonListProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: gap ?? spacing.sm }}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={itemHeight} />
      ))}
    </View>
  );
}
