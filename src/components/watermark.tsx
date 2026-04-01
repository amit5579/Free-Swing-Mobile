import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function Watermark() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require("../../assets/images/freeswing-watermark.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "80%",
    height: "80%",
    opacity: 0.30,
    transform: [{ rotate: "-5deg" }],
  },
});