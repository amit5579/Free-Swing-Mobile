import React, { useMemo, useRef, useState, useEffect } from "react";
import { StyleSheet, View, Platform } from "react-native";
import MapView, {
  Marker,
  Polyline,
  Circle,
  MAP_TYPES,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

export interface ClubDistance {
  name: string;
  distanceYards: number;
}

interface RangefinderMapProps {
  playerLocation: [number, number] | null; // [longitude, latitude]
  pinLocation: [number, number] | null; // [longitude, latitude]
  aimLocation: [number, number] | null; // [longitude, latitude]
  onMapPress: (feature: any) => void;
  isDark?: boolean;
  isFlagMode?: boolean;
  isAimMode?: boolean;
  onPinDragEnd?: (coords: [number, number]) => void;
  onAimDragEnd?: (coords: [number, number]) => void;
  cameraRef?: React.RefObject<MapView | null>;
  clubDistances?: ClubDistance[];
}

export const RangefinderMap: React.FC<RangefinderMapProps> = ({
  playerLocation,
  pinLocation,
  aimLocation,
  onMapPress,
  isDark = false,
  isFlagMode = false,
  isAimMode = false,
  onPinDragEnd,
  onAimDragEnd,
  cameraRef,
  clubDistances,
}) => {
  // Convert [lng, lat] to { latitude, longitude } safely
  const toCoord = (loc: [number, number] | null) => {
    if (!loc || !Array.isArray(loc) || loc.length < 2) return null;
    const [lng, lat] = loc;
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    )
      return null;
    if (lat === 0 && lng === 0) return null;
    return { latitude: lat, longitude: lng };
  };

  const playerCoord = toCoord(playerLocation);
  const pinCoord = toCoord(pinLocation);
  const aimCoord = toCoord(aimLocation);

  // Controlled tracksViewChanges to allow initial native snapshot without continuous GPU overhead
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [
    pinCoord?.latitude,
    pinCoord?.longitude,
    aimCoord?.latitude,
    aimCoord?.longitude,
    playerCoord?.latitude,
    playerCoord?.longitude,
    isFlagMode,
    isAimMode,
  ]);

  // Connecting lines
  const lineCoords = useMemo(() => {
    if (!playerCoord || !pinCoord) return null;
    return aimCoord
      ? [playerCoord, aimCoord, pinCoord]
      : [playerCoord, pinCoord];
  }, [playerCoord, pinCoord, aimCoord]);

  // Club distances
  const distances = useMemo(() => {
    return clubDistances && clubDistances.length > 0
      ? clubDistances
      : [
          { name: "Driver", distanceYards: 250 },
          { name: "3-Wood", distanceYards: 225 },
          { name: "5-Iron", distanceYards: 185 },
          { name: "7-Iron", distanceYards: 160 },
          { name: "Pitching Wedge", distanceYards: 125 },
        ];
  }, [clubDistances]);

  // Static initial region - set once so Android MapView doesn't reset on GPS ticks
  const initialRegionRef = useRef({
    latitude: pinCoord?.latitude || playerCoord?.latitude || 37.78825,
    longitude: pinCoord?.longitude || playerCoord?.longitude || -122.4324,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent?.coordinate;
    if (
      coord &&
      typeof coord.latitude === "number" &&
      typeof coord.longitude === "number"
    ) {
      onMapPress({
        geometry: {
          coordinates: [coord.longitude, coord.latitude],
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={cameraRef as any}
        style={styles.map}
        provider={Platform.OS === "android" ? "google" : undefined}
        mapType={MAP_TYPES.SATELLITE}
        onPress={handleMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor="#8BC34A"
        initialRegion={initialRegionRef.current}
      >
        {/* Club Arcs */}
        {playerCoord &&
          distances.map((club, index) => (
            <Circle
              key={`club_${index}`}
              center={playerCoord}
              radius={club.distanceYards * 0.9144} // Convert yards to meters
              strokeColor="rgba(255, 255, 255, 0.5)"
              strokeWidth={1}
              lineDashPattern={[5, 5]}
            />
          ))}

        {/* Connecting Lines */}
        {lineCoords && lineCoords.length >= 2 && (
          <Polyline
            coordinates={lineCoords}
            strokeColor="#FFA500"
            strokeWidth={3}
          />
        )}

        {/* Player Marker */}
        {playerCoord && (
          <Marker
            coordinate={playerCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={4}
          >
            <View style={[styles.marker, { backgroundColor: "#4285F4" }]}>
              <View style={styles.innerPlayerDot} />
            </View>
          </Marker>
        )}

        {/* Aim Marker */}
        {aimCoord && (
          <Marker
            coordinate={aimCoord}
            draggable={isAimMode}
            onDragEnd={(e) => {
              if (onAimDragEnd) {
                const coord = e.nativeEvent.coordinate;
                onAimDragEnd([coord.longitude, coord.latitude]);
              }
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={5}
          >
            <View style={[styles.marker, { backgroundColor: "#FFA500" }]}>
              <View style={styles.innerAimDot} />
            </View>
          </Marker>
        )}

        {/* Pin / Flag Marker */}
        {pinCoord && (
          <Marker
            coordinate={pinCoord}
            draggable={isFlagMode}
            onDragEnd={(e) => {
              if (onPinDragEnd) {
                const coord = e.nativeEvent.coordinate;
                onPinDragEnd([coord.longitude, coord.latitude]);
              }
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={tracksViewChanges}
            zIndex={10}
          >
            <View style={styles.flagMarkerContainer}>
              <View
                style={[
                  styles.flagBadge,
                  isFlagMode && styles.flagBadgeActive,
                ]}
              >
                <Ionicons name="flag" size={16} color="#ffffff" />
              </View>
              <View style={styles.flagPole} />
              <View style={styles.flagBaseDot} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  innerPlayerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  innerAimDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
  },
  flagMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 48,
  },
  flagBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 6,
  },
  flagBadgeActive: {
    backgroundColor: "#15803d",
    borderColor: "#fbbf24",
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  flagPole: {
    width: 2.5,
    height: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  flagBaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
});
