import React from "react";
import { View, StyleSheet } from "react-native";

export interface ScoreIndicatorProps {
  score: number | null;
  par: number;
  isDark?: boolean;
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({
  score,
  par,
  isDark = false,
}) => {
  if (score === null || score === undefined || score < 0) {
    return null;
  }

  // Hole-in-one: Double Gold Circle
  if (score === 1) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.doubleCircle, { borderColor: "#ffd700" }]}>
          <View style={[styles.innerCircle, { borderColor: "#ffd700" }]} />
        </View>
      </View>
    );
  }

  // Score 0 (special case)
  if (score === 0) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
          <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
        </View>
      </View>
    );
  }

  const diff = score - par;

  // Albatross (-3 or better): Double Teal Circle
  if (diff <= -3) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.doubleCircle, { borderColor: "#006064" }]}>
          <View style={[styles.innerCircle, { borderColor: "#006064" }]} />
        </View>
      </View>
    );
  }

  // Eagle (-2): Double Green Circle
  if (diff === -2) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.doubleCircle, { borderColor: "#2e7d32" }]}>
          <View style={[styles.innerCircle, { borderColor: "#2e7d32" }]} />
        </View>
      </View>
    );
  }

  // Birdie (-1): Single Green Circle
  if (diff === -1) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.singleCircle, { borderColor: "#2e7d32" }]} />
      </View>
    );
  }

  // Par (0): Dashed Gray Square
  if (diff === 0) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View
          style={{
            width: 32,
            height: 32,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: isDark ? "#666" : "#999",
            borderRadius: 4,
          }}
        />
      </View>
    );
  }

  // Bogey (+1): Single Red Square
  if (diff === 1) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.singleSquare, { borderColor: "#d32f2f" }]} />
      </View>
    );
  }

  // Double Bogey (+2): Double Red Square
  if (diff === 2) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.doubleSquare, { borderColor: "#d32f2f" }]}>
          <View style={[styles.innerSquare, { borderColor: "#d32f2f" }]} />
        </View>
      </View>
    );
  }

  // Triple Bogey (+3): Triple Purple Square
  if (diff === 3) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View style={[styles.tripleSquareOuter, { borderColor: "#6a1b9a" }]}>
          <View style={[styles.tripleSquareMid, { borderColor: "#6a1b9a" }]}>
            <View style={[styles.tripleSquareInner, { borderColor: "#6a1b9a" }]} />
          </View>
        </View>
      </View>
    );
  }

  // Quad+ (+4 or more): Single Solid Square
  if (diff >= 4) {
    return (
      <View style={styles.indicatorContainer} pointerEvents="none">
        <View
          style={[
            styles.singleSquare,
            { borderColor: isDark ? "#ffffff" : "#1f2937" },
          ]}
        />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  indicatorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  singleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  doubleCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  singleSquare: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderRadius: 3,
  },
  doubleSquare: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  innerSquare: {
    width: 26,
    height: 26,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  tripleSquareOuter: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareMid: {
    width: 30,
    height: 30,
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  tripleSquareInner: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 2,
  },
});
