import React from "react";
import { useColorScheme, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Text } from "@/components/text";

import { Ionicons } from "@expo/vector-icons";

import Watermark from "@/components/watermark";
import { router } from "expo-router";

const products = [
  {
    id: "1",
    name: "Caps with magnetic marker",
    description: "Mixed brand golf caps",
    price: "₹1,150.00",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=200",
  },
  {
    id: "2",
    name: "T-Shirt Sea Blue",
    description: "Polyester lycra sports wear",
    price: "₹1,150.00",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200",
  },
  {
    id: "3",
    name: "Golf Glove",
    description: "Premium leather glove",
    price: "₹3,456.00",
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=200",
  },
  {
    id: "4",
    name: "Golf Balls Pack",
    description: "Professional distance balls",
    price: "₹2,250.00",
    image: "https://images.unsplash.com/photo-1592919505780-303950717480?w=200",
  },
  {
    id: "5",
    name: "Golf Polo Shirt",
    description: "Breathable sports polo",
    price: "₹1,950.00",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=200",
  },
  {
    id: "6",
    name: "Golf Shoes",
    description: "Anti-slip professional shoes",
    price: "₹5,850.00",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
  },
  {
    id: "7",
    name: "Golf Bag",
    description: "Lightweight carry bag",
    price: "₹8,400.00",
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=200",
  },
  {
    id: "8",
    name: "Golf Tee Set",
    description: "Durable plastic tees",
    price: "₹450.00",
    image: "https://images.unsplash.com/photo-1592919505780-303950717480?w=200",
  },
  {
    id: "9",
    name: "Golf Cap Classic",
    description: "Adjustable sports cap",
    price: "₹950.00",
    image: "https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=200",
  },
  {
    id: "10",
    name: "Golf Training Mat",
    description: "Indoor practice mat",
    price: "₹4,250.00",
    image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=200",
  },
];

export default function ProShop() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      <Watermark />

      <VStack className="flex-1 px-4">

        {/* HEADER (FIXED) */}
        <HStack className="mb-4 items-center justify-between">
          <VStack>
            <Text
              style={{
                fontSize: 24,
                lineHeight: 30,
                fontWeight: "700",
                color: "#8bc34a",
              }}
            >
              Manage Products
            </Text>
          </VStack>

          <Button
            size="sm"
            onPress={() =>
              router.push("/(drawer)/(admin)/(tabs)/proShop/addProduct")
            }
            className="bg-[#8bc34a] rounded-lg px-4 flex-row items-center"
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-white font-semibold ml-1">
              Add Product
            </Text>
          </Button>
        </HStack>

        {/* PRODUCT LIST (SCROLLABLE) */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <VStack space="md">

            {products.map((item) => (
              <Box
                key={item.id}
                style={{
                  backgroundColor: isDark
                    ? "rgba(30,30,30,0.75)"
                    : "rgba(255,255,255,0.75)",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: isDark ? "#2c2c2e" : "#e5e7eb",
                }}
              >
                <HStack space="md" className="items-center">

                  {/* IMAGE */}
                  <Image
                    source={{ uri: item.image }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                    }}
                  />

                  {/* INFO */}
                  <VStack className="flex-1">

                    <Text
                      style={{
                        fontWeight: "600",
                        fontSize: 16,
                        color: isDark ? "#fff" : "#000",
                      }}
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#9ca3af" : "#6b7280",
                      }}
                    >
                      {item.description}
                    </Text>

                    <Text
                      style={{
                        color: "#8bc34a",
                        fontWeight: "700",
                        marginTop: 4,
                      }}
                    >
                      {item.price}
                    </Text>

                  </VStack>

                  {/* ACTIONS */}
                  <VStack space="xs">

                    <Button
                      size="sm"
                      style={{
                        backgroundColor: "#22c55e",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                    </Button>

                    <Button
                      size="sm"
                      style={{
                        backgroundColor: "#ef4444",
                        borderRadius: 8,
                        paddingHorizontal: 10,
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </Button>

                  </VStack>

                </HStack>
              </Box>
            ))}

          </VStack>
        </ScrollView>

      </VStack>
    </SafeAreaView>
  );
}