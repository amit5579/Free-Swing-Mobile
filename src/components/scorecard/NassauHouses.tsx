import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface NassauHousesProps {
  houses?: number[];
  isTotalRow?: boolean;
  isDark?: boolean;
  fontSize?: number;
}

export const NassauHouses: React.FC<NassauHousesProps> = ({
  houses = [],
  isTotalRow = false,
  isDark = false,
  fontSize = 11,
}) => {
  if (!houses || houses.length === 0) {
    return <Text style={[styles.text, { color: isDark ? "#999" : "#666", fontSize }]}>-</Text>;
  }

  return (
    <View style={styles.container}>
      {houses.map((val: number, idx: number, arr: number[]) => {
        let color = isDark ? "#ffffff" : "#000000";

        if (isTotalRow) {
          if (val > 0) color = isDark ? "#4ade80" : "#1b4332"; // Team A
          if (val < 0) color = isDark ? "#60a5fa" : "#1e3a8a"; // Team B
        } else {
          if (val > 0) color = isDark ? "#4ade80" : "#198754"; // Team A
          if (val < 0) color = isDark ? "#60a5fa" : "#0d6efd"; // Team B
        }

        return (
          <Text
            key={idx}
            style={[
              styles.text,
              {
                color,
                fontSize,
                fontWeight: "bold",
              },
            ]}
          >
            {Math.abs(val)}
            {idx < arr.length - 1 ? " " : ""}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
  },
});
