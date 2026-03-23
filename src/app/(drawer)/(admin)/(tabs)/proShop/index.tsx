import React, { useState, useEffect } from "react";
import { useColorScheme, Image, ActivityIndicator, TouchableOpacity, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { ThemedText } from "@/components/themed-text";

import { Ionicons } from "@expo/vector-icons";
import Watermark from "@/components/watermark";
import { getProducts, ProductApi } from "@/api/shop";

export default function ProShop() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [products, setProducts] = useState<ProductApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Fetch products error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      <Watermark />

      <VStack className="flex-1">
        {/* HEADER */}
        <HStack style={{ marginBottom: 24, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          <VStack>
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
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#8bc34a" />
            <ThemedText style={{ marginTop: 12, color: "#8bc34a" }}>Loading shop...</ThemedText>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
          >
            <VStack style={{ gap: 16 }}>
              {products.map((item) => (
                <Box
                  key={item.id}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(30,30,30,0.85)"
                      : "rgba(255,255,255,0.85)",
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(139,195,74,0.2)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 10,
                    elevation: 3,
                  }}
                >
                  <HStack style={{ gap: 16, alignItems: 'center' }}>
                    {/* IMAGE */}
                    <Box style={{ 
                      width: 80, 
                      height: 80, 
                      backgroundColor: '#f9f9f9', 
                      borderRadius: 12, 
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: '#eee'
                    }}>
                      <Image
                        source={{ uri: `https://kolve18freeswing.com${item.imageUrl}` }}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        resizeMode="contain"
                      />
                    </Box>

                    {/* INFO */}
                    <Box style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontWeight: "800",
                          fontSize: 16,
                        }}
                      >
                        {item.name}
                      </ThemedText>

                      <ThemedText
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          color: '#888',
                          marginTop: 2
                        }}
                      >
                        {item.description}
                      </ThemedText>

                      <ThemedText
                        style={{
                          color: "#8bc34a",
                          fontWeight: "900",
                          fontSize: 18,
                          marginTop: 6,
                        }}
                      >
                        ₹{item.price.toLocaleString()}
                      </ThemedText>
                    </Box>

                    {/* ACTIONS */}
                    <VStack style={{ gap: 8 }}>
                      <TouchableOpacity
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: "rgba(34,197,94,0.1)",
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: "rgba(34,197,94,0.2)",
                        }}
                        onPress={() => console.log("Edit", item.id)}
                      >
                        <Ionicons name="create-outline" size={18} color="#22C55E" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: "rgba(239,68,68,0.1)",
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: "rgba(239,68,68,0.2)",
                        }}
                        onPress={() => console.log("Delete", item.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
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