import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ImageBackground,
    Modal
} from "react-native";
import { Keyboard } from "react-native";
import { useEffect } from "react";
import { getAllCourses } from "@/api/teeTime";

export default function SignupScreen() {
    const router = useRouter();

    const [userType, setUserType] = useState("beginner");

    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [course, setCourse] = useState("");
    const [hcp, setHcp] = useState("");
    const [hIndex, setHIndex] = useState("");
    const [slope, setSlope] = useState("");
    const [rating, setRating] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [courseModal, setCourseModal] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [membershipVisible, setMembershipVisible] = useState(false);
    const [membershipNumber, setMembershipNumber] = useState("");
    const [selectedTeeBox, setSelectedTeeBox] = useState("");
    const [teeBoxModal, setTeeBoxModal] = useState(false);
    const [availableTeeBoxes, setAvailableTeeBoxes] = useState<any[]>([]);

    const fetchCourses = async () => {
        try {
            const resp = await getAllCourses();
            setCourses(resp);

        } catch (error) {
            console.log("Error getting courses");

        }
    }

    useEffect(() => {
        fetchCourses();
    }, [])

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            const today = new Date();
            const minDate = new Date(
                today.getFullYear() - 18,
                today.getMonth(),
                today.getDate()
            );
            if (date > minDate) {
                alert("You must be 18+");
                return;
            }
            setSelectedDate(date);
            setDob(formatDate(date));
        }
    };

    const resetForm = () => {
        setName("");
        setDob("");
        setMobile("");
        setEmail("");
        setPassword("");
        setCourse("");
        setHcp("");
        setHIndex("");
        setSlope("");
        setRating("");
        setMembershipNumber("");
        setSelectedTeeBox("");
        setAvailableTeeBoxes([]);
        setSelectedDate(new Date());

        setShowDatePicker(false);
    };

    const handleUserTypeChange = (type: string) => {
        setUserType(type);
        resetForm();
    };

    const bgImage = require("/assets/golf-bgg.jpg");

    const handleSignup = async () => {
        try {
            console.log("🟢 Signup started");

            const payload = {
                Username: name,
                Email: email,
                Password: password,
                MobileNumber: mobile,
                DateOfBirth: dob ? new Date(selectedDate).toISOString().split("T")[0] : null,
                HomeCourse: course || null,
                MembershipNumber: membershipNumber || null,
                TeeBox: selectedTeeBox || null,
                Handicap: hcp || null,
                HandicapIndex: hIndex || null,
                Slope: slope || null,
                Rating: rating || null,
            };

            console.log("📦 Payload:", payload);

            const response = await fetch(
                "https://kolve18freeswing.com/api/Auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            console.log("📡 Status:", response.status);

            const data = await response.json();

            console.log("📩 API Response:", data);

            if (!response.ok) {
                alert(data.message || "Signup failed");
                return;
            }

            alert("Signup successful ✅");

            router.replace({
                pathname: "/login",
                params: { email: email, password: password },
            });

        } catch (error) {
            console.log("❌ Signup error:", error);
        }
    };

    useEffect(() => {
        const showListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
        const hideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ImageBackground
                source={bgImage}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
                    keyboardShouldPersistTaps="handled">

                    <View style={{ alignItems: "center", marginTop: 40, marginBottom: 40 }}>
                        <Text style={{ color: "#2e7d32", fontSize: 32, fontWeight: "bold" }}>
                            Sign Up
                        </Text>
                        <Text style={{ color: "#2e7d32", fontSize: 16, marginTop: 6 }}>
                            Create your golf account
                        </Text>
                    </View>

                    <View
                        style={{
                            backgroundColor: "rgba(255,255,255,0.65)",
                            borderRadius: 24,
                            padding: 28,
                            marginHorizontal: 20,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            // height: 550,
                            height: keyboardVisible ? undefined : 550,
                        }}
                    >

                        <View style={{ flexDirection: "row", marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => setUserType("beginner")}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginRight: 5,
                                    backgroundColor: userType === "beginner" ? "#8bc34a" : "#e5e5e5",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: userType === "beginner" ? "#fff" : "#000" }}>
                                    Beginner
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setUserType("experienced")}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginLeft: 5,
                                    backgroundColor: userType === "experienced" ? "#8bc34a" : "#e5e5e5",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: userType === "experienced" ? "#fff" : "#000" }}>
                                    Experienced
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Name
                            </Text>
                            <TextInput
                                placeholder="Enter your name"
                                placeholderTextColor="rgba(0,0,0,0.4)"
                                value={name}
                                onChangeText={setName}
                                style={{
                                    borderWidth: 1,
                                    borderColor: "rgba(0,0,0,0.1)",
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    height: 50,
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                    color: "#000",
                                }}
                            />

                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Date of Birth
                            </Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: "rgba(0,0,0,0.1)",
                                    borderRadius: 14,
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                    height: 50,
                                    paddingHorizontal: 16,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={{ flex: 1 }}
                                >
                                    <Text style={{ color: dob ? "#000" : "rgba(0,0,0,0.4)" }}>
                                        {dob || "dd-mm-yyyy"}
                                    </Text>
                                </TouchableOpacity>

                                {dob ? (
                                    <TouchableOpacity
                                        onPress={() => setDob("")}
                                        style={{
                                            marginLeft: 10,
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: "#e5e5e5",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Ionicons name="close" size={16} color="red" />
                                    </TouchableOpacity>
                                ) : (
                                    <Ionicons
                                        name="calendar"
                                        size={20}
                                        color="rgba(0,0,0,0.4)"
                                        onPress={() => setShowDatePicker(true)}
                                    />
                                )}
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="default"
                                    maximumDate={new Date()}
                                    onChange={onDateChange}
                                />
                            )}

                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Mobile Number
                            </Text>
                            <TextInput
                                placeholder="Enter your mobile number"
                                placeholderTextColor="rgba(0,0,0,0.4)"
                                value={mobile}
                                onChangeText={setMobile}
                                keyboardType="phone-pad"
                                style={{
                                    borderWidth: 1,
                                    borderColor: "rgba(0,0,0,0.1)",
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    height: 50,
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                    color: "#000",
                                }}
                            />

                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Email
                            </Text>
                            <TextInput
                                placeholder="Enter your email"
                                placeholderTextColor="rgba(0,0,0,0.4)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={{
                                    borderWidth: 1,
                                    borderColor: "rgba(0,0,0,0.1)",
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    height: 50,
                                    marginBottom: 20,
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                    color: "#000",
                                }}
                            />

                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Home Course
                            </Text>
                            <TouchableOpacity
                                onPress={() => setCourseModal(true)}
                                style={{
                                    borderWidth: 1,
                                    borderColor: "rgba(0,0,0,0.1)",
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    height: 50,
                                    width: "100%",
                                    marginBottom: 20,
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Text style={{ color: course ? "#000" : "rgba(0,0,0,0.4)" }}>
                                    {course || "Select Home Course"}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="rgba(0,0,0,0.4)" />
                            </TouchableOpacity>

                            {course !== "" && (
                                <>
                                    {/* <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                        Membership Number (Optional)
                                    </Text> */}
                                    <TextInput
                                        placeholder="Membership Number (Optional)"
                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                        value={membershipNumber}
                                        onChangeText={setMembershipNumber}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: "rgba(0,0,0,0.1)",
                                            borderRadius: 14,
                                            paddingHorizontal: 16,
                                            height: 50,
                                            marginBottom: 20,
                                            backgroundColor: "rgba(255,255,255,0.9)",
                                            color: "#000",
                                        }}
                                    />

                                    <TouchableOpacity
                                        onPress={() => setTeeBoxModal(true)}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: "rgba(0,0,0,0.1)",
                                            borderRadius: 14,
                                            paddingHorizontal: 16,
                                            height: 50,
                                            width: "100%",
                                            marginBottom: 20,
                                            backgroundColor: "rgba(255,255,255,0.9)",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Text style={{ color: selectedTeeBox ? "#000" : "rgba(0,0,0,0.4)" }}>
                                            {selectedTeeBox || "Select Tee Box"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="rgba(0,0,0,0.4)" />
                                    </TouchableOpacity>
                                </>
                            )}

                            {userType === "experienced" && (
                                <>
                                    <View
                                        style={{ flexDirection: "row", justifyContent: "space-between" }}
                                    >
                                        <TextInput
                                            placeholder="Hcp"
                                            value={hcp}
                                            onChangeText={setHcp}
                                            keyboardType="numeric"
                                            // style={{
                                            //     borderWidth: 1,
                                            //     borderColor: "#d1d5db",
                                            //     borderRadius: 6,
                                            //     padding: 12,
                                            //     width: "48%",
                                            //     marginBottom: 16,
                                            // }}
                                            style={{
                                                borderWidth: 1,
                                                borderColor: "rgba(0,0,0,0.1)",
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                height: 50,
                                                width: "48%",
                                                marginBottom: 20,
                                                backgroundColor: "rgba(255,255,255,0.9)",
                                                color: "#000",
                                            }}
                                        />
                                        <TextInput
                                            placeholder="H.Index"
                                            value={hIndex}
                                            onChangeText={setHIndex}
                                            keyboardType="numeric"
                                            style={{
                                                borderWidth: 1,
                                                borderColor: "rgba(0,0,0,0.1)",
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                height: 50,
                                                width: "48%",
                                                marginBottom: 20,
                                                backgroundColor: "rgba(255,255,255,0.9)",
                                                color: "#000",
                                            }}
                                        />
                                    </View>

                                    <View
                                        style={{ flexDirection: "row", justifyContent: "space-between" }}
                                    >
                                        <TextInput
                                            placeholder="Slope"
                                            value={slope}
                                            onChangeText={setSlope}
                                            keyboardType="numeric"
                                            style={{
                                                borderWidth: 1,
                                                borderColor: "rgba(0,0,0,0.1)",
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                height: 50,
                                                width: "48%",
                                                marginBottom: 20,
                                                backgroundColor: "rgba(255,255,255,0.9)",
                                                color: "#000",
                                            }}
                                        />
                                        <TextInput
                                            placeholder="Rating"
                                            value={rating}
                                            onChangeText={setRating}
                                            keyboardType="numeric"
                                            style={{
                                                borderWidth: 1,
                                                borderColor: "rgba(0,0,0,0.1)",
                                                borderRadius: 14,
                                                paddingHorizontal: 16,
                                                height: 50,
                                                width: "48%",
                                                marginBottom: 20,
                                                backgroundColor: "rgba(255,255,255,0.9)",
                                                color: "#000",
                                            }}
                                        />
                                    </View>
                                </>
                            )}

                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Password
                            </Text>
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: "rgba(0,0,0,0.1)",
                                    borderRadius: 14,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 16,
                                    height: 50,
                                    marginBottom: 24,
                                    backgroundColor: "rgba(255,255,255,0.9)",
                                }}
                            >
                                <TextInput
                                    placeholder="Enter your password"
                                    placeholderTextColor="rgba(0,0,0,0.4)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    style={{ flex: 1, height: "100%", color: "#000" }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye" : "eye-off"}
                                        size={22}
                                        color="#374151"
                                    />
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={{
                                backgroundColor: "#8bc34a",
                                paddingVertical: 16,
                                borderRadius: 14,
                                alignItems: "center",
                                marginTop: 10,
                            }}
                            onPress={handleSignup}
                        >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ textAlign: "center", marginTop: 15 }}>
                            Already have an account?{" "}
                            <Text
                                style={{ color: "#2e7d32", fontWeight: "600" }}
                                onPress={() => router.push("/login")}
                            >
                                Login
                            </Text>
                        </Text>

                    </View>
                </ScrollView>
            </ImageBackground>

            <Modal visible={courseModal} transparent animationType="slide">
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                        <View
                            style={{
                                backgroundColor: "#fff",
                                margin: 20,
                                borderRadius: 12,
                                padding: 20,
                                maxHeight: "80%",
                            }}
                        >
                            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" }}>
                                Select Home Course
                            </Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {courses.map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={{
                                            paddingVertical: 15,
                                            borderBottomWidth: 1,
                                            borderBottomColor: "#eee",
                                        }}
                                        onPress={() => {
                                            setCourse(item.name);
                                            setAvailableTeeBoxes(item.teeBoxes || []);
                                            setSelectedTeeBox(""); // Reset tee box when course changes
                                            setCourseModal(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 16 }}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity
                                onPress={() => setCourseModal(false)}
                                style={{ marginTop: 15, padding: 10 }}
                            >
                                <Text style={{ color: "red", textAlign: "center", fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                </View>
            </Modal>

            <Modal visible={teeBoxModal} transparent animationType="slide">
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            margin: 20,
                            borderRadius: 12,
                            padding: 20,
                            maxHeight: "80%",
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" }}>
                            Select Tee Box
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {availableTeeBoxes.length > 0 ? (
                                availableTeeBoxes.map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={{
                                            paddingVertical: 15,
                                            borderBottomWidth: 1,
                                            borderBottomColor: "#eee",
                                        }}
                                        onPress={() => {
                                            setSelectedTeeBox(item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase());
                                            setTeeBoxModal(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 16 }}>
                                            {item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ textAlign: "center", padding: 20, color: "gray" }}>
                                    No tee boxes available for this course
                                </Text>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setTeeBoxModal(false)}
                            style={{ marginTop: 15, padding: 10 }}
                        >
                            <Text style={{ color: "red", textAlign: "center", fontWeight: "600" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const input = {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
};

const passwordInput = {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
};