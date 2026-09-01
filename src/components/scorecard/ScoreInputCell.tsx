import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { ScoreIndicator } from "./ScoreIndicator";

export interface ScoreInputCellProps {
  score: number | null;
  par: number;
  isReadOnly?: boolean;
  isDark?: boolean;
  valueText: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  inputRef?: (el: TextInput | null) => void;
  sandy?: boolean;
  onToggleSandy?: () => void;
  r?: boolean;
  onToggleR?: () => void;
  multiplier?: number;
  showBadges?: boolean;
  isPrimary?: boolean;
  allowPartnerEdit?: boolean;
}

export const ScoreInputCell: React.FC<ScoreInputCellProps> = ({
  score,
  par,
  isReadOnly = false,
  isDark = false,
  valueText,
  onChangeText,
  onFocus,
  inputRef,
  sandy = false,
  onToggleSandy,
  r = false,
  onToggleR,
  multiplier = 0,
  showBadges = false,
  isPrimary = true,
  allowPartnerEdit = true,
}) => {
  const editable = !isReadOnly && allowPartnerEdit;

  const handleChange = (text: string) => {
    if (!onChangeText) return;
    let clean = text.replace(/[^0-9]/g, "");
    if (clean !== "") {
      const num = parseInt(clean, 10);
      if (num > 15) return;
      clean = num.toString();
    }
    onChangeText(clean);
  };

  const parsedScore = valueText !== "" && valueText !== undefined ? Number(valueText) : score;

  return (
    <View style={styles.container}>
      <View style={styles.cellWrapper}>
        <ScoreIndicator score={parsedScore} par={par} isDark={isDark} />

        {editable ? (
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: isDark ? "#ffffff" : "#111827",
                backgroundColor: "transparent",
                borderColor: isDark ? "#3f3f46" : "#cbd5e1",
              },
            ]}
            keyboardType="number-pad"
            maxLength={2}
            value={valueText ?? (score !== null && score !== undefined ? String(score) : "")}
            onChangeText={handleChange}
            onFocus={onFocus}
            textAlign="center"
            selectTextOnFocus
            placeholder="-"
            placeholderTextColor={isDark ? "#666666" : "#9ca3af"}
          />
        ) : (
          <View style={styles.readOnlyCell}>
            <Text
              style={[
                styles.readOnlyText,
                { color: isDark ? "#ffffff" : "#111827" },
              ]}
            >
              {parsedScore !== null && parsedScore !== undefined && parsedScore >= 0
                ? String(parsedScore)
                : "-"}
            </Text>
          </View>
        )}
      </View>

      {/* Sandy & Regulation Badges */}
      {showBadges && (
        <View style={styles.badgeRow}>
          {onToggleSandy && editable ? (
            <Pressable
              onPress={onToggleSandy}
              style={[
                styles.miniBadge,
                sandy
                  ? styles.sandyBadgeActive
                  : isDark
                    ? styles.badgeInactiveDark
                    : styles.badgeInactiveLight,
              ]}
            >
              <Text
                style={[
                  styles.miniBadgeText,
                  { color: sandy ? "#ffffff" : isDark ? "#888888" : "#666666" },
                ]}
              >
                S
              </Text>
            </Pressable>
          ) : sandy ? (
            <View style={[styles.miniBadge, styles.sandyBadgeActive]}>
              <Text style={[styles.miniBadgeText, { color: "#ffffff" }]}>S</Text>
            </View>
          ) : null}

          {onToggleR && editable ? (
            <Pressable
              onPress={onToggleR}
              style={[
                styles.miniBadge,
                r
                  ? styles.rBadgeActive
                  : isDark
                    ? styles.badgeInactiveDark
                    : styles.badgeInactiveLight,
              ]}
            >
              <Text
                style={[
                  styles.miniBadgeText,
                  { color: r ? "#ffffff" : isDark ? "#888888" : "#666666" },
                ]}
              >
                R
              </Text>
            </Pressable>
          ) : r ? (
            <View style={[styles.miniBadge, styles.rBadgeActive]}>
              <Text style={[styles.miniBadgeText, { color: "#ffffff" }]}>R</Text>
            </View>
          ) : null}

          {multiplier > 0 && (
            <View style={styles.multiplierBadge}>
              <Text style={styles.multiplierText}>{multiplier}x</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  cellWrapper: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  input: {
    width: 36,
    height: 36,
    fontSize: 15,
    fontWeight: "700",
    padding: 0,
    zIndex: 2,
    borderWidth: 1,
    borderRadius: 6,
  },
  readOnlyCell: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  readOnlyText: {
    fontSize: 15,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    gap: 3,
  },
  miniBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    lineHeight: 11,
  },
  sandyBadgeActive: {
    backgroundColor: "#d97706",
    borderColor: "#b45309",
  },
  rBadgeActive: {
    backgroundColor: "#2563eb",
    borderColor: "#1d4ed8",
  },
  badgeInactiveLight: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  badgeInactiveDark: {
    backgroundColor: "#262626",
    borderColor: "#404040",
  },
  multiplierBadge: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  multiplierText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
  },
});
