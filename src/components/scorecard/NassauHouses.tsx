import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface NassauHousesProps {
  houses?: number[];
  overallHouses?: number[];
  halfHouses?: number[];
  isSecondNine?: boolean;
  isTotalRow?: boolean;
  isDark?: boolean;
  fontSize?: number;
}

export const NassauHouses: React.FC<NassauHousesProps> = ({
  houses,
  overallHouses,
  halfHouses,
  isSecondNine = false,
  isTotalRow = false,
  isDark = false,
  fontSize = 11,
}) => {
  // If used for total rows or legacy single houses array
  if (isTotalRow || (houses !== undefined && overallHouses === undefined && halfHouses === undefined)) {
    const list = houses || [];
    if (list.length === 0) {
      return <Text style={[styles.text, { color: isDark ? "#999" : "#666", fontSize }]}>-</Text>;
    }

    return (
      <View style={styles.container}>
        {list.map((val: number, idx: number, arr: number[]) => {
          let color = isDark ? "#ffffff" : "#000000";
          if (val > 0) color = isDark ? "#4ade80" : "#198754"; // Team A
          if (val < 0) color = isDark ? "#60a5fa" : "#0d6efd"; // Team B

          return (
            <Text
              key={idx}
              style={[
                styles.text,
                {
                  color,
                  fontSize,
                  fontWeight: "700",
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
  }

  // Hole Row display: overallHouses [& halfHouses if secondNine]
  const oHouses = overallHouses || [];
  const hHouses = halfHouses || [];

  if (oHouses.length === 0 && (!isSecondNine || hHouses.length === 0)) {
    return <Text style={[styles.text, { color: isDark ? "#999" : "#666", fontSize }]}>-</Text>;
  }

  const renderHouseGroup = (items: number[], keyPrefix: string) => {
    return items.map((val: number, idx: number) => {
      let color = isDark ? "#ffffff" : "#000000";
      if (val > 0) color = isDark ? "#4ade80" : "#198754"; // Team A
      if (val < 0) color = isDark ? "#60a5fa" : "#0d6efd"; // Team B

      return (
        <Text
          key={`${keyPrefix}_${idx}`}
          style={[
            styles.text,
            {
              color,
              fontSize,
              fontWeight: "700",
            },
          ]}
        >
          {Math.abs(val)}
          {idx < items.length - 1 ? " " : ""}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      {renderHouseGroup(oHouses, "overall")}
      {isSecondNine && hHouses.length > 0 && (
        <>
          <Text style={[styles.ampText, { color: isDark ? "#71717a" : "#9ca3af", fontSize: fontSize - 1 }]}>
            {" & "}
          </Text>
          {renderHouseGroup(hHouses, "half")}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
  },
  text: {
    textAlign: "center",
  },
  ampText: {
    marginHorizontal: 2,
    fontWeight: "600",
  },
});
