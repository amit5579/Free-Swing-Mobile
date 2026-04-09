import React, { useState, useCallback } from "react";
import { useColorScheme, Image, ActivityIndicator, TouchableOpacity, ScrollView, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";

import { Ionicons } from "@expo/vector-icons";
import Watermark from "@/components/watermark";
import { getProducts } from "@/api/shop";
import { deleteProduct, Product } from "@/api/admin/proShop";
import { Skeleton } from "@/components/Skeleton";
// import { getProducts, deleteProduct, Product } from "@/api/adminAPI/proShop";

export default function ProShop() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgLoadingMap, setImgLoadingMap] = useState<{ [key: number]: boolean }>({});
  const [imgErrorMap, setImgErrorMap] = useState<{ [key: number]: boolean }>({});

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      // Only show full-screen skeleton on initial load or if list is empty
      if (products.length === 0) setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Fetch products error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(id);
            Alert.alert("Success", "Product deleted successfully");
            fetchProducts();
          } catch (error) {
            Alert.alert("Error", "Failed to delete product");
          }
        },
      },
    ]);
  };


  return (
    <SafeAreaView
    edges={["left", "right"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      <Watermark />

      <VStack className="flex-1">
        <HStack style={{ marginBottom: 24, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          <VStack className="mt-4">
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#8bc34a",
              }}
            >
              Pro Shop
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: '#999', fontWeight: '600' }}>
              Manage Inventory
            </ThemedText>
          </VStack>

          <TouchableOpacity
            onPress={() =>
              router.push("/(drawer)/(admin)/(tabs)/proShop/addProduct")
            }
            style={{
              backgroundColor: '#8bc34a',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#8bc34a',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <ThemedText style={{ color: 'white', fontWeight: '800', marginLeft: 6, fontSize: 14 }}>
              Add Item
            </ThemedText>
          </TouchableOpacity>
        </HStack>

        {loading ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 16 }}
          >
            <VStack style={{ gap: 20 }}>
              {[1, 2, 3, 4].map((item) => (
                <Box
                  key={item}
                  style={{
                    shadowColor: "#8BC34A",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 12,
                    backgroundColor: isDark ? "rgba(26, 26, 26, 0.6)" : "rgba(255, 255, 255, 0.6)",
                    borderRadius: 22,
                    borderLeftWidth: 6,
                    borderLeftColor: "#8BC34A",
                    borderTopWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: isDark ? "rgba(139, 195, 74, 0.6)" : "#E0E0E0",
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <HStack space="md" className="items-center">
                    <Skeleton isDark={isDark} width={90} height={90} borderRadius={18} style={{ borderWidth: 2, borderColor: "#8BC34A" }} />
                    <VStack style={{ flex: 1 }}>
                      <HStack className="justify-between items-start">
                        <Skeleton isDark={isDark} width={120} height={20} />
                        <Skeleton isDark={isDark} width={40} height={16} borderRadius={6} />
                      </HStack>
                      <Skeleton isDark={isDark} width="90%" height={12} style={{ marginTop: 8 }} />
                      <Skeleton isDark={isDark} width="60%" height={12} style={{ marginTop: 4 }} />
                      <HStack className="items-center justify-between mt-4">
                        <Skeleton isDark={isDark} width={60} height={24} />
                        <HStack space="sm">
                          <Skeleton isDark={isDark} width={32} height={32} borderRadius={8} />
                          <Skeleton isDark={isDark} width={32} height={32} borderRadius={8} />
                        </HStack>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 16 }}
          >
            <VStack style={{ gap: 20 }}>
              {products.map((item) => (
                <Box
                  key={item.id}
                  style={{
                    shadowColor: "#8BC34A",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 12,
                    backgroundColor: isDark ? "rgba(26, 26, 26, 0.6)" : "rgba(255, 255, 255, 0.6)",
                    borderRadius: 22,
                    borderLeftWidth: 6,
                    borderLeftColor: "#8BC34A",
                    borderTopWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: isDark ? "rgba(139, 195, 74, 0.6)" : "#D1D5DB",
                    padding: 12,
                    marginBottom: 16,
                    overflow: "hidden",
                  }}
                >
                  <HStack space="md" className="items-center">
                    <Box style={{ 
                      width: 90, 
                      height: 90, 
                      backgroundColor: isDark ? '#1a1a1c' : '#ffffff', 
                      borderRadius: 18, 
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: "#8BC34A",
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      {imgErrorMap[item.id] ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                          <Ionicons name="bag-outline" size={28} color={isDark ? "#8BC34A" : "#aaa"} />
                          <ThemedText
                            numberOfLines={2}
                            style={{ fontSize: 9, color: isDark ? "#8BC34A" : "#888", textAlign: 'center', marginTop: 4, fontWeight: '700' }}
                          >
                            {item.name}
                          </ThemedText>
                        </View>
                      ) : (
                        <>
                          {imgLoadingMap[item.id] !== false && (
                            <ActivityIndicator style={{ position: 'absolute' }} color="#8BC34A" size="small" />
                          )}
                          <Image
                            source={{ uri: item.imageUrl ? `https://kolve18freeswing.com${item.imageUrl}` : '' }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                            onLoadStart={() => setImgLoadingMap(prev => ({...prev, [item.id]: true}))}
                            onLoadEnd={() => setImgLoadingMap(prev => ({...prev, [item.id]: false}))}
                            onError={() => setImgErrorMap(prev => ({...prev, [item.id]: true}))}
                          />
                        </>
                      )}
                    </Box>

                    <VStack style={{ flex: 1 }}>
                      <HStack className="justify-between items-start">
                        <ThemedText
                          numberOfLines={1}
                          style={{
                            fontWeight: "900",
                            fontSize: 16,
                            letterSpacing: -0.5,
                            flex: 1
                          }}
                        >
                          {item.name}
                        </ThemedText>
                        
                        <Box style={{ 
                          backgroundColor: 'rgba(139,195,74,0.1)', 
                          paddingHorizontal: 8, 
                          paddingVertical: 2, 
                          borderRadius: 6 
                        }}>
                          <ThemedText style={{ color: '#8bc34a', fontSize: 9, fontWeight: '800' }}>
                            STOCK
                          </ThemedText>
                        </Box>
                      </HStack>

                      <ThemedText
                        numberOfLines={2}
                        style={{
                          fontSize: 11,
                          color: isDark ? '#94a3b8' : '#64748b',
                          marginTop: 2,
                          lineHeight: 15
                        }}
                      >
                        {item.description || "No description provided"}
                      </ThemedText>

                      <HStack className="items-center justify-between mt-3">
                        <ThemedText
                          style={{
                            color: "#8bc34a",
                            fontWeight: "900",
                            fontSize: 18,
                          }}
                        >
                          ₹{item.price.toLocaleString()}
                        </ThemedText>

                        <HStack space="sm">
                          <TouchableOpacity
                            onPress={() => router.push({
                              pathname: "/(drawer)/(admin)/(tabs)/proShop/addProduct",
                              params: {
                                id: item.id,
                                name: item.name,
                                price: item.price.toString(),
                                description: item.description,
                                imageUrl: item.imageUrl
                              }
                            })}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color="#8bc34a" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2",
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </HStack>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </ScrollView>
        )}
      </VStack>
    </SafeAreaView>
  );
}