import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Modal,
  Pressable,
  useColorScheme,
  View,
  TextInput,
  FlatList,
  ScrollView,
  RefreshControl,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import { Skeleton } from "@/components/Skeleton";
import Toast from "react-native-toast-message";

import {
  getSubAdminBills,
  generateBatchBill,
  generateBill,
  approvePayment,
  getMembersForBilling,
} from "@/api/modules/billing.api";

export default function SubAdminBillingPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"tracking" | "generate">("tracking");
  const [generateMode, setGenerateMode] = useState<"batch" | "single">("batch");

  // Tracking Data
  const [bills, setBills] = useState<any[]>([]);

  // Batch Generation State
  const [selectedCategory, setSelectedCategory] = useState("Permanent / Legacy");
  const [batchMembers, setBatchMembers] = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());

  // Single Generation State
  const [searchQuery, setSearchQuery] = useState("");
  const [singleMembers, setSingleMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Common Generation State
  const [billingMonth, setBillingMonth] = useState("");
  const [subscriptionAmount, setSubscriptionAmount] = useState("250");
  const [iguAffiliationAmount, setIguAffiliationAmount] = useState("120");
  const [softwareAutomationAmount, setSoftwareAutomationAmount] = useState("180");
  
  // Custom charges
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState<{itemName: string, amount: number}[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "tracking") {
      await fetchBills(false);
    }
    setRefreshing(false);
  }, [activeTab]);

  const fetchBills = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      const data = await getSubAdminBills();
      setBills(data);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  const loadCategoryMembers = async (category: string) => {
    try {
      const catParam = category === "All Categories" ? "All" : category;
      const data = await getMembersForBilling("", catParam);
      setBatchMembers(data || []);
      setSelectedMemberIds(new Set(data.map((m: any) => m.id)));
    } catch (error) {
      console.error("Error loading category members", error);
    }
  };

  const loadSingleMembers = async (query: string) => {
    try {
      if (!query) {
        setSingleMembers([]);
        return;
      }
      const data = await getMembersForBilling(query, "");
      setSingleMembers(data || []);
    } catch (error) {
      console.error("Error loading single members", error);
    }
  };

  useEffect(() => {
    const now = new Date();
    setBillingMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    fetchBills(true);
    loadCategoryMembers(selectedCategory);
  }, []);

  const totalGenerated = useMemo(() => bills.reduce((sum, b) => sum + b.totalAmount, 0), [bills]);
  const totalReceived = useMemo(() => bills.filter(b => b.paymentStatus === "Paid").reduce((sum, b) => sum + b.totalAmount, 0), [bills]);
  const totalPending = useMemo(() => bills.filter(b => b.paymentStatus === "Pending").reduce((sum, b) => sum + b.totalAmount, 0), [bills]);

  const totalBillAmountPerMember = useMemo(() => {
    const base = Number(subscriptionAmount || 0) + Number(iguAffiliationAmount || 0) + Number(softwareAutomationAmount || 0);
    const extras = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
    return base + extras;
  }, [subscriptionAmount, iguAffiliationAmount, softwareAutomationAmount, additionalCharges]);

  const handleAddCharge = () => {
    if (newChargeName && Number(newChargeAmount) > 0) {
      setAdditionalCharges([...additionalCharges, { itemName: newChargeName, amount: Number(newChargeAmount) }]);
      setNewChargeName("");
      setNewChargeAmount("");
    }
  };

  const handleRemoveCharge = (index: number) => {
    const newArr = [...additionalCharges];
    newArr.splice(index, 1);
    setAdditionalCharges(newArr);
  };

  const toggleBatchSelection = (id: number) => {
    const newSet = new Set(selectedMemberIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMemberIds(newSet);
  };

  const toggleSelectAllBatch = () => {
    if (selectedMemberIds.size === batchMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(batchMembers.map(m => m.id)));
    }
  };

  const executeGenerate = async () => {
    if (!billingMonth) {
      Toast.show({ type: "error", text1: "Error", text2: "Please enter billing month" });
      return;
    }

    if (generateMode === "batch") {
      if (selectedMemberIds.size === 0) {
        Toast.show({ type: "error", text1: "Error", text2: "Please select at least 1 member for batch generation" });
        return;
      }
      try {
        setIsGenerating(true);
        const catParam = selectedCategory === "All Categories" ? "All" : selectedCategory;
        const payload = {
          memberCategory: catParam,
          targetUserIds: Array.from(selectedMemberIds),
          billingMonth: `${billingMonth}-01`,
          subscriptionAmount: Number(subscriptionAmount),
          iguAffiliationAmount: Number(iguAffiliationAmount),
          softwareAutomationAmount: Number(softwareAutomationAmount),
          additionalCharges: additionalCharges,
        };
        const res = await generateBatchBill(payload);
        Toast.show({ type: "success", text1: "Success", text2: res.message || `Bills generated for ${res.count} members!` });
        setActiveTab("tracking");
        setAdditionalCharges([]);
        fetchBills(false);
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Error", text2: error?.response?.data?.message || "Failed to generate batch bills" });
      } finally {
        setIsGenerating(false);
      }
    } else {
      if (!selectedMember) {
        Toast.show({ type: "error", text1: "Error", text2: "Please select a member" });
        return;
      }
      try {
        setIsGenerating(true);
        const payload = {
          userId: selectedMember.id,
          billingMonth: `${billingMonth}-01`,
          subscriptionAmount: Number(subscriptionAmount),
          iguAffiliationAmount: Number(iguAffiliationAmount),
          softwareAutomationAmount: Number(softwareAutomationAmount),
          additionalCharges: additionalCharges,
        };
        const res = await generateBill(payload);
        Toast.show({ type: "success", text1: "Success", text2: "Bill generated successfully!" });
        setActiveTab("tracking");
        setSelectedMember(null);
        setSearchQuery("");
        setAdditionalCharges([]);
        fetchBills(false);
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Error", text2: error?.response?.data?.message || "Failed to generate bill" });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleApprove = async (billId: number) => {
    try {
      await approvePayment(billId);
      Toast.show({ type: "success", text1: "Success", text2: "Payment verified successfully" });
      fetchBills(false);
    } catch (error) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to verify payment" });
    }
  };

  const RenderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      <HStack
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => routePage.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
          android_ripple={{ color: "rgba(0,0,0,0.1)" }}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#020617"} />
        </Pressable>

        <VStack style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            style={{
              fontSize: 17,
              fontWeight: "700",
              marginTop: 2,
              color: isDark ? "#fff" : "#020617",
            }}
          >
            Monthly Billing
          </ThemedText>
        </VStack>

        <View style={{ width: 40 }} />
      </HStack>
    </Box>
  );

  const renderBillItem = ({ item }: any) => {    
    const isPaid = item.paymentStatus === "Paid";
    return (
      <Box
        className="p-4 rounded-2xl mb-3"
        style={{
          backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.6)",
        }}
      >
        <HStack className="items-center justify-between mb-2">
          <ThemedText style={{ fontWeight: "600", fontSize: 16 }}>{item.user?.username || `User #${item.userId}`}</ThemedText>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: isPaid ? "rgba(34, 197, 94, 0.2)" : "rgba(234, 179, 8, 0.2)",
            }}
          >
            <ThemedText style={{ fontSize: 12, color: isPaid ? "#22c55e" : "#eab308", fontWeight: "600" }}>
              {item.paymentStatus}
            </ThemedText>
          </View>
        </HStack>
        <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>{item.user?.email || "No Email"}</ThemedText>
        <ThemedText style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Month: {item.billingMonth ? new Date(item.billingMonth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</ThemedText>
        
        <HStack style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
          <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>₹{item.totalAmount}</ThemedText>
          {!isPaid && (
            <Pressable
              onPress={() => handleApprove(item.id)}
              style={{
                borderWidth: 1,
                borderColor: "#3b82f6",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4
              }}
            >
              <Ionicons name="checkmark-done-outline" color="#3b82f6" size={14} />
              <ThemedText style={{ color: "#3b82f6", fontSize: 12, fontWeight: "600" }}>Verify</ThemedText>
            </Pressable>
          )}
        </HStack>
      </Box>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#ffffff" }}>
      <RenderHeader />
      <Watermark />

      <HStack style={{ padding: 12, gap: 10, backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}>
        <Pressable
          onPress={() => setActiveTab("tracking")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            backgroundColor: activeTab === "tracking" ? (isDark ? "#334155" : "#fff") : "transparent",
            borderRadius: 8,
            shadowColor: activeTab === "tracking" ? "#000" : "transparent",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: activeTab === "tracking" ? 2 : 0,
          }}
        >
          <HStack style={{ alignItems: "center", gap: 6 }}>
            <Ionicons name="analytics-outline" size={18} color={activeTab === "tracking" ? "#84cc16" : (isDark ? "#94a3b8" : "#64748b")} />
            <ThemedText style={{ fontWeight: activeTab === "tracking" ? "700" : "500", color: activeTab === "tracking" ? "#84cc16" : (isDark ? "#94a3b8" : "#64748b") }}>
              Tracking
            </ThemedText>
          </HStack>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("generate")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            backgroundColor: activeTab === "generate" ? (isDark ? "#334155" : "#fff") : "transparent",
            borderRadius: 8,
            shadowColor: activeTab === "generate" ? "#000" : "transparent",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: activeTab === "generate" ? 2 : 0,
          }}
        >
          <HStack style={{ alignItems: "center", gap: 6 }}>
            <Ionicons name="receipt-outline" size={18} color={activeTab === "generate" ? "#84cc16" : (isDark ? "#94a3b8" : "#64748b")} />
            <ThemedText style={{ fontWeight: activeTab === "generate" ? "700" : "500", color: activeTab === "generate" ? "#84cc16" : (isDark ? "#94a3b8" : "#64748b") }}>
              Generate
            </ThemedText>
          </HStack>
        </Pressable>
      </HStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8BC34A"]} />}
      >
        <VStack className="px-4 pb-20 pt-2">
          {activeTab === "tracking" ? (
            <>
              {/* Stats Dashboard */}
              <HStack style={{ gap: 10, marginBottom: 16 }}>
                <Box style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? "#1e293b" : "#f1f5f9", alignItems: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4 }}>TOTAL GENERATED</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: isDark ? "#fff" : "#000" }}>₹{totalGenerated}</Text>
                </Box>
                <Box style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? "#1e293b" : "#f1f5f9", alignItems: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4 }}>TOTAL RECEIVED</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#22c55e" }}>₹{totalReceived}</Text>
                </Box>
                <Box style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? "#1e293b" : "#f1f5f9", alignItems: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4 }}>TOTAL PENDING</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#eab308" }}>₹{totalPending}</Text>
                </Box>
              </HStack>

              {loading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} className="p-4 rounded-2xl mb-3" style={{ backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.6)" }}>
                      <HStack className="justify-between mb-2">
                        <Skeleton isDark={isDark} height={18} width="40%" />
                        <Skeleton isDark={isDark} height={20} width={60} borderRadius={8} />
                      </HStack>
                      <Skeleton isDark={isDark} height={14} width="30%" style={{ marginBottom: 12 }} />
                      <Skeleton isDark={isDark} height={20} width="25%" />
                    </Box>
                  ))}
                </>
              ) : bills.length === 0 ? (
                <VStack style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="receipt-outline" size={40} color={isDark ? "#334155" : "#cbd5e1"} />
                  <ThemedText style={{ marginTop: 12, opacity: 0.7 }}>No tracking history found.</ThemedText>
                </VStack>
              ) : (
                <FlatList
                  data={bills}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderBillItem}
                  scrollEnabled={false}
                />
              )}
            </>
          ) : (
            <VStack style={{ gap: 16, marginTop: 10 }}>
              {/* Sub-Tabs for Batch vs Single */}
              <HStack style={{ gap: 10, backgroundColor: isDark ? "#1e293b" : "#e2e8f0", padding: 4, borderRadius: 12 }}>
                <Pressable
                  onPress={() => setGenerateMode("batch")}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: "center",
                    backgroundColor: generateMode === "batch" ? "#84cc16" : "transparent",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontWeight: "700", color: generateMode === "batch" ? "#fff" : (isDark ? "#94a3b8" : "#64748b"), fontSize: 13 }}>
                    Category Bulk
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setGenerateMode("single")}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: "center",
                    backgroundColor: generateMode === "single" ? "#84cc16" : "transparent",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontWeight: "700", color: generateMode === "single" ? "#fff" : (isDark ? "#94a3b8" : "#64748b"), fontSize: 13 }}>
                    Single Member
                  </Text>
                </Pressable>
              </HStack>

              <HStack style={{ alignItems: "flex-start", gap: 16 }}>
                {/* LEFT SIDE: Member Selection based on mode */}
                <VStack style={{ flex: 1, gap: 12, backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.6)", padding: 12, borderRadius: 12 }}>
                  {generateMode === "batch" ? (
                    <>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: isDark ? "#fff" : "#000" }}>Select Category</Text>
                      <Dropdown
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#cbd5f5",
                          borderRadius: 8,
                          padding: 10,
                          backgroundColor: isDark ? "#0f172a" : "#fff",
                        }}
                        selectedTextStyle={{ color: isDark ? "white" : "black", fontSize: 13 }}
                        itemTextStyle={{ color: isDark ? "white" : "black", fontSize: 13 }}
                        containerStyle={{ backgroundColor: isDark ? "#1e293b" : "#fff", borderRadius: 8 }}
                        activeColor={isDark ? "#334155" : "#f1f5f9"}
                        data={[
                          { label: "Permanent / Legacy", value: "Permanent / Legacy" },
                          { label: "Honorary Members", value: "Honorary Members" },
                          { label: "Temporary / Guest", value: "Temporary / Guest" },
                          { label: "All Categories", value: "All Categories" },
                        ]}
                        labelField="label"
                        valueField="value"
                        value={selectedCategory}
                        onChange={(item) => {
                          setSelectedCategory(item.value);
                          loadCategoryMembers(item.value);
                        }}
                      />
                      <HStack style={{ justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <Pressable onPress={toggleSelectAllBatch}>
                          <Text style={{ fontSize: 12, color: "#3b82f6", fontWeight: "600" }}>
                            {selectedMemberIds.size === batchMembers.length ? "Deselect All" : "Select All"}
                          </Text>
                        </Pressable>
                        <Text style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b" }}>
                          {selectedMemberIds.size} / {batchMembers.length}
                        </Text>
                      </HStack>
                      <View style={{ height: 160 }}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                          {batchMembers.map(m => (
                            <Pressable 
                              key={m.id} 
                              onPress={() => toggleBatchSelection(m.id)}
                              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "#334155" : "#e2e8f0" }}
                            >
                              <Ionicons 
                                name={selectedMemberIds.has(m.id) ? "checkbox" : "square-outline"} 
                                size={20} 
                                color={selectedMemberIds.has(m.id) ? "#3b82f6" : (isDark ? "#64748b" : "#94a3b8")} 
                              />
                              <Text style={{ marginLeft: 8, fontSize: 13, color: isDark ? "#fff" : "#000", flex: 1 }} numberOfLines={1}>{m.username}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: isDark ? "#fff" : "#000" }}>Search Member</Text>
                      <TextInput
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          if (text.length > 2) loadSingleMembers(text);
                          else if (text.length === 0) setSingleMembers([]);
                        }}
                        placeholder="Search by name..."
                        placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#cbd5f5",
                          borderRadius: 8,
                          padding: 10,
                          color: isDark ? "#fff" : "#000",
                          backgroundColor: isDark ? "#0f172a" : "#fff",
                        }}
                      />
                      <View style={{ height: 160 }}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                          {singleMembers.map(m => (
                            <Pressable 
                              key={m.id} 
                              onPress={() => setSelectedMember(m)}
                              style={{ 
                                padding: 8, 
                                borderRadius: 8,
                                marginBottom: 4,
                                backgroundColor: selectedMember?.id === m.id ? "rgba(132, 204, 22, 0.2)" : "transparent",
                                borderWidth: 1,
                                borderColor: selectedMember?.id === m.id ? "#84cc16" : "transparent"
                              }}
                            >
                              <Text style={{ fontSize: 13, color: isDark ? "#fff" : "#000", fontWeight: selectedMember?.id === m.id ? "700" : "400" }}>{m.username}</Text>
                              <Text style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b" }}>{m.email}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    </>
                  )}
                </VStack>

                {/* RIGHT SIDE: Details */}
                <VStack style={{ flex: 1.2, gap: 12, backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.6)", padding: 12, borderRadius: 12 }}>
                  <Box>
                    <ThemedText style={{ marginBottom: 4, fontWeight: "600", fontSize: 12 }}>Billing Month (YYYY-MM)</ThemedText>
                    <TextInput
                      value={billingMonth}
                      onChangeText={setBillingMonth}
                      placeholder="2026-07"
                      style={{
                        borderWidth: 1,
                        borderColor: isDark ? "#334155" : "#cbd5f5",
                        borderRadius: 8,
                        padding: 8,
                        color: isDark ? "#fff" : "#000",
                        backgroundColor: isDark ? "#0f172a" : "#fff",
                      }}
                    />
                  </Box>
                  <Box>
                    <ThemedText style={{ marginBottom: 4, fontWeight: "600", fontSize: 12 }}>Subscription Amount</ThemedText>
                    <TextInput
                      value={subscriptionAmount}
                      onChangeText={setSubscriptionAmount}
                      keyboardType="numeric"
                      style={{
                        borderWidth: 1,
                        borderColor: isDark ? "#334155" : "#cbd5f5",
                        borderRadius: 8,
                        padding: 8,
                        color: isDark ? "#fff" : "#000",
                        backgroundColor: isDark ? "#0f172a" : "#fff",
                      }}
                    />
                  </Box>
                  <HStack style={{ gap: 8 }}>
                    <Box style={{ flex: 1 }}>
                      <ThemedText style={{ marginBottom: 4, fontWeight: "600", fontSize: 12 }}>Affiliation</ThemedText>
                      <TextInput
                        value={iguAffiliationAmount}
                        onChangeText={setIguAffiliationAmount}
                        keyboardType="numeric"
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#cbd5f5",
                          borderRadius: 8,
                          padding: 8,
                          color: isDark ? "#fff" : "#000",
                          backgroundColor: isDark ? "#0f172a" : "#fff",
                        }}
                      />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <ThemedText style={{ marginBottom: 4, fontWeight: "600", fontSize: 12 }}>Software</ThemedText>
                      <TextInput
                        value={softwareAutomationAmount}
                        onChangeText={setSoftwareAutomationAmount}
                        keyboardType="numeric"
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#334155" : "#cbd5f5",
                          borderRadius: 8,
                          padding: 8,
                          color: isDark ? "#fff" : "#000",
                          backgroundColor: isDark ? "#0f172a" : "#fff",
                        }}
                      />
                    </Box>
                  </HStack>
                </VStack>
              </HStack>

              {/* Custom Charges */}
              <Box style={{ padding: 12, backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.6)", borderRadius: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: isDark ? "#fff" : "#000", marginBottom: 8 }}>
                  + Add Custom Charge
                </Text>
                <HStack style={{ gap: 8, alignItems: "center" }}>
                  <TextInput
                    value={newChargeName}
                    onChangeText={setNewChargeName}
                    placeholder="Charge name"
                    style={{
                      flex: 1.5,
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#cbd5f5",
                      borderRadius: 8,
                      padding: 8,
                      color: isDark ? "#fff" : "#000",
                      backgroundColor: isDark ? "#0f172a" : "#fff",
                    }}
                  />
                  <TextInput
                    value={newChargeAmount}
                    onChangeText={setNewChargeAmount}
                    placeholder="₹ 0"
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#cbd5f5",
                      borderRadius: 8,
                      padding: 8,
                      color: isDark ? "#fff" : "#000",
                      backgroundColor: isDark ? "#0f172a" : "#fff",
                    }}
                  />
                  <Pressable
                    onPress={handleAddCharge}
                    style={{ padding: 10, borderRadius: 8, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  >
                    <Text style={{ color: "#3b82f6", fontWeight: "700" }}>Add</Text>
                  </Pressable>
                </HStack>
                
                {additionalCharges.length > 0 && (
                  <VStack style={{ marginTop: 12, gap: 6 }}>
                    {additionalCharges.map((c, idx) => (
                      <HStack key={idx} style={{ justifyContent: "space-between", padding: 8, backgroundColor: isDark ? "#0f172a" : "#fff", borderRadius: 8 }}>
                        <Text style={{ fontSize: 13, color: isDark ? "#fff" : "#000" }}>{c.itemName}</Text>
                        <HStack style={{ gap: 12, alignItems: "center" }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#fff" : "#000" }}>₹{c.amount}</Text>
                          <Pressable onPress={() => handleRemoveCharge(idx)}>
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </Pressable>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>

              {/* Total & Submit */}
              <HStack style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <VStack>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>PER MEMBER AMOUNT</Text>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: isDark ? "#fff" : "#000" }}>₹{totalBillAmountPerMember}</Text>
                </VStack>
                
                <Pressable
                  onPress={executeGenerate}
                  disabled={isGenerating}
                  style={{
                    backgroundColor: isGenerating ? "#a3e635" : "#84cc16",
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="paper-plane-outline" color="#fff" size={18} />
                  <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    {isGenerating ? "Processing..." : generateMode === "batch" ? `Generate (${selectedMemberIds.size})` : "Generate Bill"}
                  </ThemedText>
                </Pressable>
              </HStack>

            </VStack>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
