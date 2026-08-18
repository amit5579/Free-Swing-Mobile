import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { createGeoJSONCircle, createLineString, createFeatureCollection } from '../../utils/rangefinder/geojson';

export interface ClubDistance {
  name: string;
  distanceYards: number;
}

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
  clubDistances?: ClubDistance[];
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
  clubDistances,
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

  // Create club distance arcs dynamically
  const arcsGeoJSON = useMemo(() => {
    if (!playerLocation) return null;
    
    // Fallback to default distances if none are provided
    const distances = clubDistances && clubDistances.length > 0 ? clubDistances : [
      { name: 'Driver', distanceYards: 250 },
      { name: '3-Wood', distanceYards: 225 },
      { name: '5-Iron', distanceYards: 185 },
      { name: '7-Iron', distanceYards: 160 },
      { name: 'Pitching Wedge', distanceYards: 125 }
    ];

    const arcs = distances.map((club) => {
      // Using distanceYards as radius for the utility
      const radius = club.distanceYards; 
      
      return createGeoJSONCircle(
        playerLocation[1], // longitude
        playerLocation[0], // latitude
        radius
      );
    });
    
    return createFeatureCollection(arcs);
  }, [playerLocation, clubDistances]);

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
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.flagMarker}>
               <View style={styles.flagPole} />
               <View style={styles.flagTriangle} />
               <View style={styles.flagBase} />
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
    width: 40,
    height: 48,
  },
  flagBase: {
    position: 'absolute',
    bottom: 0,
    left: 13,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 3,
    zIndex: 2,
  },
  flagPole: {
    position: 'absolute',
    bottom: 6,
    left: 18.5,
    width: 3,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 1.5,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  flagTriangle: {
    position: 'absolute',
    left: 20,
    top: 6,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: '#4CAF50',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    zIndex: 2,
  }
});
