import { Stack } from 'expo-router';
import { View, StyleSheet, StatusBar } from 'react-native';
import { ThemeColors } from '../constants/theme';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={ThemeColors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: ThemeColors.background },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
});
