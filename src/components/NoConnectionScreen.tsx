import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";

const { width } = Dimensions.get("window");

interface NoConnectionScreenProps {
  onRetry?: () => void;
}

export default function NoConnectionScreen({ onRetry }: NoConnectionScreenProps) {
  const isDark = useColorScheme() === "dark";

  // Pulse animation for the wifi icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Fade-in for the whole container
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Gentle bounce for the card
  const slideAnim = useRef(new Animated.Value(60)).current;
  // Spin animation for the retry button icon
  const spinAnim = useRef(new Animated.Value(0)).current;
  // Toast slide-in
  const toastAnim = useRef(new Animated.Value(40)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const [isChecking, setIsChecking] = React.useState(false);
  const [showFailToast, setShowFailToast] = React.useState(false);

  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Fade + slide in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite pulse on icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const startSpin = () => {
    spinAnim.setValue(0);
    spinLoop.current = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      })
    );
    spinLoop.current.start();
  };

  const stopSpin = () => {
    spinLoop.current?.stop();
    spinAnim.setValue(0);
  };

  const showToast = () => {
    setShowFailToast(true);
    toastAnim.setValue(40);
    toastOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(toastAnim, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Auto-hide after 2.5s
      setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowFailToast(false));
      }, 2500);
    });
  };

  const handleRetry = async () => {
    if (isChecking) return;
    setIsChecking(true);
    startSpin();

    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        // Connection restored — the root layout listener will auto-swap the screen
        if (onRetry) onRetry();
        // No need to reset state — the component will unmount
      } else {
        // Still offline — show feedback toast
        stopSpin();
        setIsChecking(false);
        showToast();
      }
    } catch {
      stopSpin();
      setIsChecking(false);
      showToast();
    }
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bg = isDark ? "#0F1A0A" : "#F4F9EE";
  const card = isDark ? "#1A2810" : "#FFFFFF";
  const iconBg = isDark ? "rgba(139,195,74,0.12)" : "rgba(139,195,74,0.10)";

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, opacity: fadeAnim }]}>
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTop, { backgroundColor: isDark ? "rgba(139,195,74,0.08)" : "rgba(139,195,74,0.12)" }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: isDark ? "rgba(139,195,74,0.05)" : "rgba(139,195,74,0.08)" }]} />

      <Animated.View
        style={[
          styles.card,
          { backgroundColor: card, transform: [{ translateY: slideAnim }] },
          isDark && styles.cardDark,
        ]}
      >
        {/* Brand logo */}
        {/* <Image
          source={require("@/assets/FreeSwing.png")}
          style={styles.logo}
          resizeMode="contain"
        /> */}

        {/* Icon container with pulse */}
        <Animated.View
          style={[
            styles.iconWrapper,
            { backgroundColor: iconBg, transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Ionicons name="wifi-outline" size={52} color="#8BC34A" />
          {/* Small cross badge */}
          <View style={styles.badge}>
            <Ionicons name="close" size={12} color="#fff" />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: isDark ? "#E8F5E9" : "#1B5E20" }]}>
          No Connection
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#90A4AE" : "#607D8B" }]}>
          Please check your internet connection and try again. The app needs data to work properly.
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "rgba(139,195,74,0.2)" }]} />

        {/* Tips */}
        <View style={styles.tips}>
          {[
            { icon: "cellular-outline", text: "Turn on mobile data" },
            { icon: "wifi", text: "Connect to a Wi-Fi network" },
            { icon: "airplane-outline", text: "Disable Airplane mode" },
          ].map((tip) => (
            <View key={tip.text} style={styles.tipRow}>
              <Ionicons name={tip.icon as any} size={16} color="#8BC34A" />
              <Text style={[styles.tipText, { color: isDark ? "#B0BEC5" : "#546E7A" }]}>
                {tip.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Retry button */}
        <TouchableOpacity
          style={[styles.retryBtn, isChecking && styles.retryBtnChecking]}
          activeOpacity={0.8}
          onPress={handleRetry}
          disabled={isChecking}
        >
          <Animated.View style={{ transform: [{ rotate: spinInterpolate }], marginRight: 8 }}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
          </Animated.View>
          <Text style={styles.retryText}>
            {isChecking ? "Checking..." : "Try Again"}
          </Text>
        </TouchableOpacity>

        {/* Failure toast */}
        {showFailToast && (
          <Animated.View
            style={[
              styles.toast,
              {
                backgroundColor: isDark ? "#2C1810" : "#FFF3E0",
                borderColor: isDark ? "#FF8A65" : "#FF7043",
                opacity: toastOpacity,
                transform: [{ translateY: toastAnim }],
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={16} color="#FF7043" />
            <Text style={[styles.toastText, { color: isDark ? "#FF8A65" : "#BF360C" }]}>
              Still no connection. Please try later.
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  blobTop: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.3,
    right: -width * 0.2,
  },
  blobBottom: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  logo: {
    width: 160,
    height: 60,
    marginBottom: 8,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  cardDark: {
    borderWidth: 1,
    borderColor: "rgba(139,195,74,0.12)",
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  badge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  divider: {
    width: "100%",
    height: 1,
    marginBottom: 18,
  },
  tips: {
    width: "100%",
    gap: 10,
    marginBottom: 28,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8BC34A",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    shadowColor: "#8BC34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  retryBtnChecking: {
    backgroundColor: "#A5C36A",
    shadowOpacity: 0.2,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  toastText: {
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 1,
  },
  retryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
