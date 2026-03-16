import React, { useState } from "react";
import { useColorScheme, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Text } from "@/components/text";

import { Ionicons } from "@expo/vector-icons";

import Watermark from "@/components/watermark";

export default function AddProduct() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#f2f2f2",
      }}
    >
      <Watermark />

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="px-4 pb-32">

          {/* HEADER */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#8bc34a",
              marginBottom: 16,
            }}
          >
            Add Product
          </Text>

          {/* FORM CARD */}
          <Box
            style={{
              backgroundColor: isDark
                    ? "rgba(30,30,30,0.75)"
                    : "rgba(255,255,255,0.75)",
              padding: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#8bc34a",
            }}
          >
            <VStack space="lg">

              {/* PRODUCT IMAGE */}
              <VStack space="xs">

                <Text
                  style={{
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  Product Image
                </Text>

                <Box
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: isDark ? "#444" : "#d1d5db",
                    borderRadius: 12,
                    padding: 24,
                  }}
                >

                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 10,
                      }}
                    />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={40}
                      color={isDark ? "#aaa" : "#9E9E9E"}
                    />
                  )}

                  <Button className="bg-[#8bc34a] rounded-lg mt-4 px-5">
                    <Text className="text-white font-semibold">
                      Upload Image
                    </Text>
                  </Button>

                </Box>
              </VStack>

              {/* PRODUCT NAME */}
              <VStack space="xs">

                <Text
                  style={{
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  Product Name *
                </Text>

                <TextInput
                  placeholder="Enter product name"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={name}
                  onChangeText={setName}
                  style={{
                    backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isDark ? "#444" : "#e5e7eb",
                    color: isDark ? "#fff" : "#000",
                  }}
                />

              </VStack>

              {/* PRICE */}
              <VStack space="xs">

                <Text
                  style={{
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  Price *
                </Text>

                <HStack
                  style={{
                    alignItems: "center",
                    backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                    borderWidth: 1,
                    borderColor: isDark ? "#444" : "#e5e7eb",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                  }}
                >

                  <Text
                    style={{
                      fontSize: 18,
                      marginRight: 8,
                      color: isDark ? "#fff" : "#000",
                    }}
                  >
                    ₹
                  </Text>

                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      color: isDark ? "#fff" : "#000",
                    }}
                  />

                </HStack>

              </VStack>

              {/* DESCRIPTION */}
              <VStack space="xs">

                <Text
                  style={{
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  Description
                </Text>

                <TextInput
                  placeholder="Enter product description..."
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  style={{
                    backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isDark ? "#444" : "#e5e7eb",
                    minHeight: 120,
                    color: isDark ? "#fff" : "#000",
                  }}
                />

              </VStack>

              {/* ACTION BUTTONS */}
              <HStack className="justify-end mt-4">

                <Button
                  variant="outline"
                  style={{
                    borderColor: isDark ? "#555" : "#ccc",
                    paddingHorizontal: 20,
                    marginRight: 10,
                  }}
                >
                  <Text style={{ color: isDark ? "#fff" : "#000" }}>
                    Cancel
                  </Text>
                </Button>

                <Button className="bg-[#8bc34a] px-6">
                  <Text className="text-white font-semibold">
                    Add Product
                  </Text>
                </Button>

              </HStack>

            </VStack>
          </Box>

        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}