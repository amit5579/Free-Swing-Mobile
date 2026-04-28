import React, { useState, useEffect } from "react";
import {
  useColorScheme,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Text } from "@/components/text";

import { Ionicons } from "@expo/vector-icons";

import Watermark from "@/components/watermark";
import { addProduct, updateProduct } from "@/api/modules/admin/proShop.api";

export default function AddProduct() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams();
  const isEdit = !!params.id;

  const [name, setName] = useState((params.name as string) || "");
  const [price, setPrice] = useState((params.price as string) || "");
  const [description, setDescription] = useState(
    (params.description as string) || "",
  );
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "Permission required to access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!name || !price) {
      Alert.alert(
        "Error",
        "Please fill in all required fields (Name and Price)",
      );
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("Name", name.trim());
      formData.append("Price", price.trim());
      formData.append("Description", (description || "").trim());

      if (image) {
        formData.append("Images", {
          uri: image.uri,
          name: image.fileName || "product.jpg",
          type: image.mimeType || "image/jpeg",
        } as any);
      }

      if (isEdit) {
        await updateProduct(Number(params.id), formData);
        Alert.alert("Success", "Product updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await addProduct(formData);
        Alert.alert("Success", "Product added successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error("Save Product Error:", error);
      Alert.alert(
        "Error",
        `Failed to ${isEdit ? "update" : "add"} product. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const getImageUri = () => {
    if (image?.uri) return image.uri;
    if (params.imageUrl)
      return `https://kolve18freeswing.com${params.imageUrl}`;
    return null;
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <VStack className="px-4">
          <HStack style={{ marginBottom: 10, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                marginRight: 12,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                padding: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "#eee",
              }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>
            <VStack>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#8bc34a",
                }}
              >
                {isEdit ? "Edit Item" : "New Item"}
              </Text>
              <Text style={{ fontSize: 12, color: "#999", fontWeight: "600" }}>
                {isEdit ? "Modify product details" : "Add product to inventory"}
              </Text>
            </VStack>
          </HStack>

          <Box
            style={{
              backgroundColor: isDark
                ? "rgba(40,40,40,0.6)"
                : "rgba(255,255,255,0.9)",
              padding: 24,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(139,195,74,0.15)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.3 : 0.05,
              shadowRadius: 20,
              elevation: 4,
            }}
          >
            <VStack space="lg">
              <VStack space="xs">
                <Text
                  style={{
                    fontWeight: "600",
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  Product Image
                </Text>

                <TouchableOpacity
                  onPress={pickImage}
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: isDark ? "#444" : "#d1d5db",
                    borderRadius: 12,
                    padding: 12,
                    minHeight: 280,
                  }}
                >
                  {getImageUri() ? (
                    <Image
                      source={{ uri: getImageUri() }}
                      style={{
                        width: "100%",
                        height: 250,
                        borderRadius: 10,
                      }}
                      resizeMode="contain"
                    />
                  ) : (
                    <VStack style={{ alignItems: "center" }}>
                      <Ionicons
                        name="image-outline"
                        size={60}
                        color={isDark ? "#aaa" : "#9E9E9E"}
                      />
                      <Text
                        style={{
                          marginTop: 12,
                          color: isDark ? "#aaa" : "#888",
                          fontWeight: "600",
                        }}
                      >
                        Click to select product image
                      </Text>
                    </VStack>
                  )}

                  <Box className="bg-[#8bc34a] rounded-lg mt-4 px-8 py-3">
                    <Text className="text-white font-bold">
                      {getImageUri()
                        ? "Change Product Photo"
                        : "Upload Product Photo"}
                    </Text>
                  </Box>
                </TouchableOpacity>
              </VStack>

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

              <HStack className="justify-end mt-4">
                <Button
                  variant="outline"
                  onPress={() => router.back()}
                  style={{
                    borderColor: isDark ? "#555" : "#ccc",
                    paddingHorizontal: 20,
                    marginRight: 10,
                  }}
                  disabled={loading}
                >
                  <Text style={{ color: isDark ? "#fff" : "#000" }}>
                    Cancel
                  </Text>
                </Button>

                <Button
                  className="bg-[#8bc34a] px-6"
                  onPress={() => handleSave()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">
                      {isEdit ? "Update Product" : "Add Product"}
                    </Text>
                  )}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
