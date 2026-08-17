import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { createGeoJSONCircle, createLineString, createFeatureCollection } from '../../utils/rangefinder/geojson';

interface RangefinderMapProps {
  playerLocation: [number, number] | null;
  pinLocation: [number, number] | null;
  aimLocation: [number, number] | null;
  onMapPress: (feature: any) => void;
  isDark?: boolean;
  isFlagMode?: boolean;
  isAimMode?: boolean;
  onPinDragEnd?: (coords: [number, number]) => void;
  onAimDragEnd?: (coords: [number, number]) => void;
  cameraRef?: React.RefObject<Mapbox.Camera>;
}

// Ensure Mapbox gets initialized with public token in the main app layout.
// The public token is passed via EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.
if (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN) {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
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
}) => {

  const mapStyle = Mapbox.StyleURL.Satellite;

  // Create connecting lines
  const lineGeoJSON = useMemo(() => {
    if (!playerLocation || !pinLocation) return null;
    
    // Line: Player -> Aim -> Pin (if aim exists), else Player -> Pin
    const coords = aimLocation 
      ? [playerLocation, aimLocation, pinLocation]
      : [playerLocation, pinLocation];

    return createLineString(coords);
  }, [playerLocation, pinLocation, aimLocation]);

  // Create club distance arcs (e.g. 100, 150, 200 yards)
  const arcsGeoJSON = useMemo(() => {
    if (!playerLocation) return null;
    
    const arcs = [
      createGeoJSONCircle(playerLocation[1], playerLocation[0], 100),
      createGeoJSONCircle(playerLocation[1], playerLocation[0], 150),
      createGeoJSONCircle(playerLocation[1], playerLocation[0], 200),
    ];
    
    return createFeatureCollection(arcs);
  }, [playerLocation]);

  const centerCoordinate = playerLocation || pinLocation || [0,0];

  return (
    <View style={styles.container}>
      <Mapbox.MapView 
        style={styles.map}
        styleURL={mapStyle}
        onPress={onMapPress}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={true}
        scaleBarPosition={{ top: 195, left: 16 }}
      >
        <Mapbox.Camera 
          ref={cameraRef}
          zoomLevel={16}
          centerCoordinate={centerCoordinate}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Club Arcs */}
        {arcsGeoJSON && (
          <Mapbox.ShapeSource id="clubArcsSource" shape={arcsGeoJSON}>
            <Mapbox.LineLayer 
              id="clubArcsLayer" 
              style={{
                lineColor: '#ffffff',
                lineWidth: 1,
                lineOpacity: 0.5,
                lineDasharray: [2, 2]
              }} 
            />
          </Mapbox.ShapeSource>
        )}

        {/* Connecting Lines */}
        {lineGeoJSON && (
          <Mapbox.ShapeSource id="lineSource" shape={lineGeoJSON}>
            <Mapbox.LineLayer 
              id="lineLayer" 
              style={{
                lineColor: '#FFA500',
                lineWidth: 3,
                lineOpacity: 0.8
              }} 
            />
          </Mapbox.ShapeSource>
        )}

        {/* Player Marker */}
        {playerLocation && (
          <Mapbox.PointAnnotation id="playerMarker" coordinate={playerLocation}>
            <View style={[styles.marker, { backgroundColor: '#4285F4' }]} />
          </Mapbox.PointAnnotation>
        )}

        {/* Aim Marker */}
        {aimLocation && (
          <Mapbox.PointAnnotation 
            id="aimMarker" 
            coordinate={aimLocation}
            draggable={isAimMode}
            onDragEnd={(e: any) => {
              if (onAimDragEnd && e?.geometry?.coordinates) {
                onAimDragEnd(e.geometry.coordinates as [number, number]);
              }
            }}
          >
            <View style={[styles.marker, { backgroundColor: '#FFA500' }]} />
          </Mapbox.PointAnnotation>
        )}

        {/* Pin Marker */}
        {pinLocation && (
          <Mapbox.PointAnnotation 
            id="pinMarker" 
            coordinate={pinLocation}
            draggable={isFlagMode}
            onDragEnd={(e: any) => {
              if (onPinDragEnd && e?.geometry?.coordinates) {
                onPinDragEnd(e.geometry.coordinates as [number, number]);
              }
            }}
          >
            <View style={styles.flagMarker}>
               {/* Custom SVG or styling for a flag. We can use a simple view for now or an icon if Ionicons is imported. Since Ionicons might not be available here, let's use a stylized view. */}
               <View style={styles.flagPole} />
               <View style={styles.flagTriangle} />
            </View>
          </Mapbox.PointAnnotation>
        )}
      </Mapbox.MapView>
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
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 4,
  },
  flagMarker: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 24,
    height: 32,
  },
  flagPole: {
    width: 3,
    height: 32,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 4,
    bottom: 0,
    borderRadius: 1.5,
  },
  flagTriangle: {
    position: 'absolute',
    left: 7,
    top: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 14,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: '#4CAF50',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  }
});
