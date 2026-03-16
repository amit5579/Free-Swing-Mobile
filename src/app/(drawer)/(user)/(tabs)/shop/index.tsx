import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { Modal, ScrollView, StyleSheet, View, Linking, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: any;
};

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Caps with magnetic marker",
    price: 1150.0,
    description: "mix brand, caps",
    category: "Accessories",
    image: require("@/assets/images/golf_cap.png"),
  },
  {
    id: "2",
    name: "T shirt",
    price: 1150.0,
    description: "polyester licrea",
    category: "Apparel",
    image: require("@/assets/images/golf_cap.png"),
  },
  {
    id: "3",
    name: "golf club",
    price: 3456.0,
    description: "fxcvb",
    category: "Equipment",
    image: require("@/assets/images/golf_cap.png"),
  },
];

type CartItem = Product & {
  quantity: number;
};

export default function ShopScreen() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartTranslateX = useSharedValue(200);

  const cartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cartTranslateX.value }],
  }));

  useEffect(() => {
    cartTranslateX.value = withSpring(cart.length > 0 ? 0 : 200, { damping: 15 });
  }, [cart.length]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const calculateSubtotal = () =>
    cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const checkoutViaWhatsApp = () => {
    const subtotal = calculateSubtotal();
    let message = `*Your Shopping Cart*\n\n`;
    cart.forEach((item) => {
      message += `- ${item.name} (x${item.quantity}): ₹${(item.price * item.quantity).toLocaleString()}\n`;
    });
    message += `\n*Subtotal: ₹${subtotal.toLocaleString()}*`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        alert("WhatsApp is not installed on this device.");
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Watermark />

      {/* Header */}
      <VStack space="xs" className="mx-5 mt-5 mb-3">
        <HStack className="justify-between items-center w-full">
          <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>
            Pro Shop
          </ThemedText>
          <Animated.View style={cartAnimatedStyle}>
            <TouchableOpacity
              onPress={() => setIsCartOpen(true)}
              style={styles.cartButton}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="cart-outline" size={20} color="white" />
              <ThemedText style={{ color: "white", fontWeight: "600", fontSize: 12 }}>
                My Cart {cart.length > 0 ? `(${cart.length})` : ""}
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </HStack>
        <ThemedText type="small" themeColor="textSecondary">
          Browse and purchase official gear and equipment.
        </ThemedText>
      </VStack>


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        <HStack className="flex-wrap justify-between mt-2">
          {PRODUCTS.map((product) => (
            <Box
              key={product.id}
              style={styles.card}
              className="w-[48%]  rounded-xl overflow-hidden mb-4"
            >
              {/* Product Image */}
              <Box className="w-full aspect-square overflow-hidden">
                <Image
                  source={product.image}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                />
              </Box>

              <VStack space="xs" className="p-3">
                <ThemedText type="smallBold" numberOfLines={1} style={{ fontSize: 12 }}>
                  {product.name || "Product"}
                </ThemedText>
                <ThemedText style={{ color: "#8BC34A", fontWeight: "900", fontSize: 14 }}>
                  ₹{product.price.toLocaleString()}
                </ThemedText>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  numberOfLines={1}
                  style={{ fontSize: 10, marginBottom: 4 }}
                >
                  {product.description}
                </ThemedText>

                <Button
                  onPress={() => addToCart(product)}
                  className="bg-[#8BC34A] rounded-lg h-8 w-full flex-row items-center justify-center"
                >
                  <Ionicons name="cart" size={12} color="white" />
                  <ButtonText className="text-white text-[10px] font-bold ml-1">
                    Add to Cart
                  </ButtonText>
                </Button>
              </VStack>
            </Box>
          ))}
        </HStack>
      </ScrollView>

      {/* Cart Modal */}
      <Modal
        visible={isCartOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCartOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            {/* Modal Header */}
            <HStack className="items-center justify-between p-4 border-b border-gray-100">
              <HStack space="xs" className="items-center">
                <Ionicons name="cart" size={20} color="#8BC34A" />
                <ThemedText type="smallBold" style={{ fontSize: 16 }}>
                  Your Shopping Cart
                </ThemedText>
              </HStack>
              <TouchableOpacity onPress={() => setIsCartOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </HStack>

            {/* ✅ FIX: flex: 1 so cart items scroll properly */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              <VStack space="md">
                {cart.length === 0 ? (
                  <VStack className="items-center py-10" space="sm">
                    <Ionicons name="cart-outline" size={48} color="#D1D5DB" />
                    <ThemedText themeColor="textSecondary">Your cart is empty</ThemedText>
                  </VStack>
                ) : (
                  cart.map((item) => (
                    <HStack
                      key={item.id}
                      className="items-center justify-between py-2 border-b border-gray-100"
                    >
                      <HStack space="sm" className="flex-1 items-center">
                        {/* ✅ Actual product image in cart */}
                        <Box style={styles.cartItemImage}>
                          <Image
                            source={item.image}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="contain"
                          />
                        </Box>
                        <VStack style={{ flex: 1 }}>
                          <ThemedText
                            type="smallBold"
                            numberOfLines={1}
                            style={{ fontSize: 13 }}
                          >
                            {item.name}
                          </ThemedText>
                          <ThemedText style={{ color: "#8BC34A", fontWeight: "700", fontSize: 12 }}>
                            ₹{item.price.toLocaleString()}
                          </ThemedText>
                        </VStack>
                      </HStack>

                      <HStack space="xs" className="items-center">
                        {/* Quantity controls */}
                        <HStack style={styles.quantityControl} className="items-center">
                          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} className="p-1">
                            <Ionicons name="remove" size={16} color="#4B5563" />
                          </TouchableOpacity>
                          <ThemedText style={{ paddingHorizontal: 6, fontSize: 13 }}>
                            {item.quantity}
                          </ThemedText>
                          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} className="p-1">
                            <Ionicons name="add" size={16} color="#4B5563" />
                          </TouchableOpacity>
                        </HStack>

                        <VStack className="items-end" style={{ minWidth: 70 }}>
                          <ThemedText type="smallBold" style={{ fontSize: 13 }}>
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </ThemedText>
                          <TouchableOpacity
                            onPress={() => removeFromCart(item.id)}
                            className="flex-row items-center"
                          >
                            <Ionicons name="trash-outline" size={12} color="#EF4444" />
                            <ThemedText style={{ color: "#EF4444", fontSize: 10, marginLeft: 2 }}>
                              Remove
                            </ThemedText>
                          </TouchableOpacity>
                        </VStack>
                      </HStack>
                    </HStack>
                  ))
                )}
              </VStack>
            </ScrollView>

            {/* Footer */}
            <Box style={styles.modalFooter}>
              <HStack className="justify-between items-center mb-4">
                <ThemedText themeColor="textSecondary" style={{ fontSize: 14 }}>
                  Subtotal ({cart.reduce((a, i) => a + i.quantity, 0)} items):
                </ThemedText>
                <ThemedText type="subtitle" style={{ fontSize: 18, color: "#1F2937" }}>
                  ₹{calculateSubtotal().toLocaleString()}
                </ThemedText>
              </HStack>

              <HStack space="xs" className="items-center mb-3">
                <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                <ThemedText style={{ fontSize: 10, color: "#6B7280", flex: 1 }}>
                  You will be redirected to WhatsApp to confirm this order.
                </ThemedText>
              </HStack>

              <HStack space="md">
                <TouchableOpacity
                  onPress={() => setIsCartOpen(false)}
                  style={{ flex: 1, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" }}
                >
                  <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>Continue</ThemedText>
                </TouchableOpacity>

                {/* ✅ FIX: flex-2 → style={{ flex: 2 }} */}
                <TouchableOpacity
                  onPress={checkoutViaWhatsApp}
                  disabled={cart.length === 0}
                  style={{
                    flex: 2,
                    height: 40,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    backgroundColor: cart.length === 0 ? "#D1D5DB" : "#8BC34A",
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="white" />
                  <ThemedText style={{ color: "white", fontSize: 13, fontWeight: "700", marginLeft: 6 }}>
                    Checkout via WhatsApp
                  </ThemedText>
                </TouchableOpacity>
              </HStack>
            </Box>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // ✅ FIX: flex:1 added
    paddingTop: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 14,
    borderColor: "#8bc34a",
    borderWidth: 1,
    overflow: "hidden",
  },
  cartButton: {
    backgroundColor: "#8bc34a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    overflow: "hidden",
    // ✅ FIX: flex column so ScrollView can flex:1 inside
    flexDirection: "column",
  },
  cartItemImage: {
    width: 48,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityControl: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
});