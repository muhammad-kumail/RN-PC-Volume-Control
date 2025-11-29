import React, { useEffect, useState } from 'react';
import {
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  clamp,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type VolumeSliderProps = {
  height?: number;
  width?: number;
  onChangeValue?: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  fillColor?: string;
  backgroundColor?: string;
};

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  height = 200,
  width = 40,
  onChangeValue,
  style,
  fillColor = '#007AFF',
  backgroundColor = '#E0E0E0',
}) => {
  const [layoutHeight, setLayoutHeight] = useState(height);

  // topShared: 0..layoutHeight (0 -> inner aligned to top -> full visible)
  const topShared = useSharedValue(0);
  // store start top on pan begin
  const startTop = useSharedValue(0);

  const updateVolume = (value: number) => {
    topShared.value = clamp(value, 0, layoutHeight);
    runOnJS(emitValue)(topShared.value);
  };

  // convert top -> normalized value (0..1), where 1 means full (top=0)
  const emitValue = (top: number) => {
    if (!layoutHeight || layoutHeight === 0) return;
    const normalized = clamp(1 - top / layoutHeight, 0, 1);
    if (onChangeValue) runOnJS(onChangeValue)(normalized);
  };

  // Animated style for inner view (animates top)
  const innerAnimatedStyle = useAnimatedStyle(() => {
    return {
      top: topShared.value,
    };
  });

  // Gesture: Pan (drag)
  const pan = Gesture.Pan()
    .onBegin(e => {
      const newTop = clamp(e.y, 0, layoutHeight);
      topShared.value = newTop;
      runOnJS(emitValue)(newTop);
      startTop.value = newTop;
    })
    // .onTouchesDown(e => {
    //   const newTop = clamp(e.y, 0, layoutHeight);
    //   topShared.value = newTop;
    //   runOnJS(emitValue)(newTop);
    // })
    .onUpdate(e => {
      // Use translationY relative to the startTop
      runOnJS(updateVolume)(startTop.value + e.translationY);
      // topShared.value = newTop;
      // emit normalized value
      // runOnJS(emitValue)(newTop);
    })
    .onEnd(() => {
      // optional: slight snap animation already applied by withTiming in style
    });

  // Track container height (in case it's different than passed `height`)
  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setLayoutHeight(h);
    // ensure top stays in range if layout changes
    topShared.value = clamp(topShared.value, 0, h);
  };

  useEffect(() => {
    // initialize at empty (top = layoutHeight -> no fill)
    topShared.value = layoutHeight;
    // emit initial zero value
    runOnJS(emitValue)(layoutHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutHeight]);

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={onLayout}
        style={[
          {
            height,
            width,
            backgroundColor,
            borderRadius: 15,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {/* Inner view same height as container, move it by top */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.inner,
            {
              height: layoutHeight,
              width: '100%',
              backgroundColor: fillColor,
              // borderRadius: width / 2,
            },
            innerAnimatedStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  inner: {
    position: 'absolute',
    left: 0,
  },
});

export default VolumeSlider;
