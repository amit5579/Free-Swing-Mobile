import { Box } from "@/components/box";
import { Button, ButtonText } from "@/components/button";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  View,
  Linking,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { getProducts, ProductApi } from "@/api/shop";

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  images: { uri: string }[];
};

type CartItem = Product & {
  quantity: number;
};

const ProductCard = ({ product, onAdd }: { product: Product; onAdd: () => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [cardWidth, setCardWidth] = useState(160);

  const displayImages = product.images.slice(0, 3);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    if (!isNaN(index)) {
      setActiveIndex(Math.round(index));
    }
  };

  return (
    <Box
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
      style={{
        width: "48%",
        marginBottom: 20,
        backgroundColor: isDark ? "rgba(22,22,24,0.6)" : "rgba(255,255,255,0.7)",
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(139,195,74,0.3)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 8,
      }}
    >
      <Box style={{ width: "100%", height: 160, backgroundColor: isDark ? "#222" : "#f5f5f5" }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {displayImages.map((img, idx) => (
            <View key={idx} style={{ width: cardWidth, height: 160 }}>
              <Image
                source={img}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
          ))}
        </ScrollView>
        {/* <Box
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(139,195,74,0.9)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <ThemedText style={{ color: "white", fontSize: 10, fontWeight: "800" }}>
            NEW
          </ThemedText>
        </Box> */}

        {/* Pagination Dots */}
        <HStack
          style={{
            position: "absolute",
            bottom: 8,
            alignSelf: "center",
            gap: 6,
          }}
        >
          {displayImages.map((_, i) => (
            <View
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === activeIndex ? "#ffffff" : "rgba(255,255,255,0.4)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.5,
                shadowRadius: 1,
              }}
            />
          ))}
        </HStack>
      </Box>

      <VStack style={{ padding: 12 }}>
        <ThemedText style={{ fontSize: 13, fontWeight: "700" }} numberOfLines={1}>
          {product.name}
        </ThemedText>

        <ThemedText
          style={{
            color: "#8BC34A",
            fontWeight: "900",
            fontSize: 16,
            marginVertical: 4,
          }}
        >
          ₹{product.price.toLocaleString()}
        </ThemedText>

        <ThemedText
          style={{ fontSize: 10, color: "#999", marginBottom: 12 }}
          numberOfLines={1}
        >
          {product.description}
        </ThemedText>

        <TouchableOpacity
          onPress={onAdd}
          style={{
            backgroundColor: "transparent",
            height: 36,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#8BC34A",
          }}
        >
          <Ionicons name="cart-outline" size={16} color="#8BC34A" />
          <ThemedText
            style={{ color: "#8BC34A", fontSize: 11, fontWeight: "800", marginLeft: 6 }}
          >
            Add to Cart
          </ThemedText>
        </TouchableOpacity>
      </VStack>
    </Box>
  );
};

export default function ShopScreen() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const cartTranslateX = useSharedValue(200);

  const cartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cartTranslateX.value }],
  }));

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    cartTranslateX.value = withSpring(cart.length > 0 ? 0 : 200, {
      damping: 15,
    });
  }, [cart.length]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data: ProductApi[] = await getProducts();

      const formatted = data.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        price: item.price,
        description: item.description,
        images: item.imageUrl
          ? item.imageUrl.split(',').map(url => ({ uri: `https://kolve18freeswing.com${url.trim()}` }))
          : [{ uri: `https://kolve18freeswing.com/placeholder.png` }],
      }));

      setProducts(formatted);
    } catch (error) {
      console.log("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updated = [...prev, { ...product, quantity: 1 }];
      }
      console.log('Cart updated. New count:', updated.length);
      return updated;
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
      message += `- ${item.name} (x${item.quantity}): ₹${(
        item.price * item.quantity
      ).toLocaleString()}\n`;
    });

    message += `\n*Subtotal: ₹${subtotal.toLocaleString()}*`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() =>
      alert("WhatsApp is not installed")
    );
  };

  return (
    <ThemedView className="flex-1 pt-4 self-center w-full max-w-[1200px]">
      <Watermark />

      {/* Header */}
      <VStack className="mx-5 mb-3">
        <HStack className="justify-between items-center w-full">
          <HStack className="items-center gap-2">
            <Ionicons name="storefront-outline" size={24} color="#8BC34A" />
            <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>
              Pro Shop
            </ThemedText>
          </HStack>

          <Animated.View style={cartAnimatedStyle}>
            <TouchableOpacity
              onPress={() => setIsCartOpen(true)}
              className="bg-[#8BC34A] px-4 py-2 rounded-lg flex-row items-center gap-2 relative"
            >
              <Ionicons name="cart-outline" size={22} color="white" />
              <ThemedText className="text-white text-sm font-bold">
                My Cart
              </ThemedText>
              {cart.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#EF4444', // Red
                    borderRadius: 12,
                    minWidth: 22,
                    height: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: 'white',
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 1,
                  }}
                >
                  <ThemedText style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>
                    {cart.length}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </HStack>

        <ThemedText className="text-xs text-gray-500">
          Browse and purchase official gear and equipment.
        </ThemedText>
      </VStack>
      {/* Products */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 }}>
            <ActivityIndicator size="large" color="#8BC34A" />
            <ThemedText style={{ marginTop: 12, color: "#8BC34A" }}>Loading products...</ThemedText>
          </View>
        ) : (
          <HStack style={{ flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => addToCart(product)}
              />
            ))}
          </HStack>
        )}
      </ScrollView>

      {/* Cart Modal */}
      <Modal visible={isCartOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <ThemedView className="w-[94%] h-[92%] rounded-[20px] overflow-hidden">
            <HStack className="p-4 border-b border-gray-100 justify-between items-center bg-gray-50/50">

              {/* Left side: Icon + Text */}
              <HStack className="items-center gap-2">
                <Ionicons name="cart-outline" size={24} color="#8BC34A" />

                <ThemedText className="text-lg font-bold">
                  Your Shopping Cart
                </ThemedText>
              </HStack>

              {/* Right side: Close button */}
              <TouchableOpacity onPress={() => setIsCartOpen(false)}>
                <Ionicons name="close-circle" size={28} color="#8BC34A" />
              </TouchableOpacity>

            </HStack>

            <FlatList
              data={cart}
              keyExtractor={(item) => item.id}
              style={{ flex: 1, minHeight: 200 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, flexGrow: 1 }}
              ListEmptyComponent={() => (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                  <Ionicons name="cart-outline" size={64} color="#E0E0E0" />
                  <ThemedText style={{ textAlign: "center", marginTop: 10, color: "#999" }}>
                    Your cart is empty
                  </ThemedText>
                </View>
              )}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                    alignItems: "center",
                  }}
                >
                  {/* Left: Image */}
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: "#f9f9f9",
                      borderRadius: 12,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "#eee",
                    }}
                  >
                    <Image
                      source={item.images[0]}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="contain"
                    />
                  </View>

                  {/* Mid-Left: Name & Price */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText
                      style={{ fontWeight: "bold", fontSize: 14 }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </ThemedText>
                    <ThemedText style={{ color: '#8BC34A', fontWeight: 'bold', fontSize: 12 }}>
                      ₹{item.price.toLocaleString()}
                    </ThemedText>
                  </View>

                  {/* Quantity Controls */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, -1)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="remove" size={18} color="#8BC34A" />
                    </TouchableOpacity>

                    <ThemedText style={{ fontWeight: 'bold', fontSize: 14, minWidth: 30, textAlign: 'center' }}>
                      {item.quantity}
                    </ThemedText>

                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, 1)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="add" size={18} color="#8BC34A" />
                    </TouchableOpacity>
                  </View>

                  {/* Item Total */}
                  <View style={{ minWidth: 80, alignItems: 'flex-end' }}>
                    <ThemedText style={{ fontWeight: 'bold', fontSize: 14 }}>
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </ThemedText>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            />

            {cart.length > 0 && (
              <View
                style={{
                  padding: 24,
                  backgroundColor: '#ffffff',
                  borderTopWidth: 1,
                  borderTopColor: '#f0f0f0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                  elevation: 5
                }}
              >
                {/* Row 1: Total and Continue Shopping */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <View>
                    <ThemedText style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: 'bold' }}>Grand Total</ThemedText>
                    <ThemedText style={{ fontSize: 26, fontWeight: '900', color: '#2E7D32' }}>
                      ₹{calculateSubtotal().toLocaleString()}
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsCartOpen(false)}
                    style={{
                      backgroundColor: '#F5F5F5',
                      height: 52,
                      paddingHorizontal: 20,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ThemedText style={{ color: '#666', fontWeight: 'bold', fontSize: 14 }}>Continue Shopping</ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Row 2: Redirection Message */}
                <View style={{ marginBottom: 15, alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>
                    You will be redirected to WhatsApp to confirm this order.
                  </ThemedText>
                </View>

                {/* Row 3: Full-width Checkout Button */}
                <TouchableOpacity
                  onPress={checkoutViaWhatsApp}
                  style={{
                    backgroundColor: '#8BC34A',
                    height: 56,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    shadowColor: '#8BC34A',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={24} color="white" />
                  <ThemedText style={{ color: 'white', fontWeight: 'bold', fontSize: 17 }}>Checkout</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}