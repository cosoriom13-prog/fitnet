import { useRef, useEffect } from 'react';
import { View, Animated, Pressable, StyleSheet, Platform } from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

export default function WheelPicker({ data, selectedValue, onValueChange, theme }) {
  const scrollRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const selectedIndex = Math.max(0, data.indexOf(selectedValue));

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    // Only sync on mount — subsequent position changes come from the user's own scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitIndex = (index) => {
    const clamped = Math.max(0, Math.min(data.length - 1, index));
    const value = data[clamped];
    if (value !== selectedValue) onValueChange(value);
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  const handleMomentumEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    commitIndex(index);
  };

  return (
    <View style={[styles.container, { height: PICKER_HEIGHT }]}>
      <View
        pointerEvents="none"
        style={[
          styles.selectionBar,
          { top: PADDING + 6, borderColor: theme.accent, backgroundColor: theme.accentDim },
        ]}
      />
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: PADDING }}
      >
        {data.map((value, index) => {
          const inputRange = [
            (index - 2) * ITEM_HEIGHT,
            (index - 1) * ITEM_HEIGHT,
            index * ITEM_HEIGHT,
            (index + 1) * ITEM_HEIGHT,
            (index + 2) * ITEM_HEIGHT,
          ];
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.2, 0.4, 1, 0.4, 0.2],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.68, 0.8, 1, 0.8, 0.68],
            extrapolate: 'clamp',
          });

          return (
            <Pressable key={value} style={styles.item} onPress={() => commitIndex(index)}>
              <Animated.Text
                style={[styles.itemText, { color: theme.text, opacity, transform: [{ scale }] }]}
              >
                {value}
              </Animated.Text>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT - 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 19, fontWeight: '700' },
});
