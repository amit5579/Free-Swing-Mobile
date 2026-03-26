import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ImageBackground,
    Modal,
    Keyboard,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    signupSchema,
    SignupFormData,
} from "@/schema/authSchemas";

// ─── Helper: Error Text ───────────────────────────────────────────────────────
const ErrorText = ({ message }: { message?: any }) =>
    message ? (
        <Text style={{ color: "#ef4444", fontSize: 12, marginBottom: 10, marginTop: 2 }}>
            {message.toString()}
        </Text>
    ) : null;

// ─── Shared input style ───────────────────────────────────────────────────────
const inputStyle = (hasError: boolean) => ({
    borderWidth: 1,
    borderColor: hasError ? "#ef4444" : "rgba(0,0,0,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.9)",
    color: "#000",
    marginBottom: hasError ? 2 : 16,
});

export default function SignupScreen() {
    const router = useRouter();

    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [courseModal, setCourseModal] = useState(false);

    const bgImage = require("/assets/golf-bgg.jpg");

    const courses = [
        "Pebble Beach",
        "Augusta National",
        "St Andrews",
        "Royal Melbourne",
    ];

    // ── Form setup ──────────────────────────────────────────────────────────
    const {
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            userType: "beginner",
            name: "",
            dob: "",
            mobile: "",
            email: "",
            password: "",
        },
    });

    const userType = watch("userType");

    // Reset form when user type changes
    const handleUserTypeChange = (type: "beginner" | "experienced") => {
        if (type === "experienced") {
            reset({
                userType: "experienced",
                name: "",
                dob: "",
                mobile: "",
                email: "",
                password: "",
                course: "",
                hcp: "",
                hIndex: "",
                slope: "",
                rating: "",
            });
        } else {
            reset({
                userType: "beginner",
                name: "",
                dob: "",
                mobile: "",
                email: "",
                password: "",
            });
        }
        setSelectedDate(new Date());
        setShowDatePicker(false);
    };

    // ── Date helpers ─────────────────────────────────────────────────────────
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
            setValue("dob", formatDate(date), { shouldValidate: true } as any);
        }
    };

    // ── Keyboard listeners ───────────────────────────────────────────────────
    useEffect(() => {
        const showListener = Keyboard.addListener("keyboardDidShow", () =>
            setKeyboardVisible(true)
        );
        const hideListener = Keyboard.addListener("keyboardDidHide", () =>
            setKeyboardVisible(false)
        );
        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    // ── Submit ───────────────────────────────────────────────────────────────
    const onSubmit = async (data: any) => {
        try {
            console.log("🟢 Signup started");

            const payload = {
                Username: data.name,
                Email: data.email,
                Password: data.password,
                MobileNumber: data.mobile,
                DateOfBirth: data.dob
                    ? new Date(selectedDate).toISOString().split("T")[0]
                    : null,
                HomeCourse: data.course || null,
                Handicap: data.hcp || null,
                HandicapIndex: data.hIndex || null,
                Slope: data.slope || null,
                Rating: data.rating || null,
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
            const result = await response.json();
            console.log("📩 API Response:", result);

            if (!response.ok) {
                alert(result.message || "Signup failed");
                return;
            }

            alert("Signup successful ✅");
            router.replace({
                pathname: "/login",
                params: { email: data.email, password: data.password },
            } as any);
        } catch (error) {
            console.log("❌ Signup error:", error);
        }
    };

    const hasError = (name: string) => !!(errors as any)[name];
    const getErrorMessage = (name: string) => (errors as any)[name]?.message;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ImageBackground source={bgImage} style={{ flex: 1 }} resizeMode="cover">
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={{ alignItems: "center", marginTop: 40, marginBottom: 40 }}>
                        <Text style={{ color: "#2e7d32", fontSize: 32, fontWeight: "bold" }}>
                            Sign Up
                        </Text>
                        <Text style={{ color: "#2e7d32", fontSize: 16, marginTop: 6 }}>
                            Create your golf account
                        </Text>
                    </View>

                    {/* Glass Card */}
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
                            height: keyboardVisible ? undefined : 550,
                        }}
                    >
                        {/* User Type Toggle */}
                        <View style={{ flexDirection: "row", marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => handleUserTypeChange("beginner")}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginRight: 5,
                                    backgroundColor:
                                        userType === "beginner" ? "#8bc34a" : "#e5e5e5",
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{ color: userType === "beginner" ? "#fff" : "#000" }}
                                >
                                    Beginner
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleUserTypeChange("experienced")}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 10,
                                    marginLeft: 5,
                                    backgroundColor:
                                        userType === "experienced" ? "#8bc34a" : "#e5e5e5",
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: userType === "experienced" ? "#fff" : "#000",
                                    }}
                                >
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
                            {/* Name */}
                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Name
                            </Text>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Enter your name"
                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        style={inputStyle(hasError("name"))}
                                    />
                                )}
                            />
                            <ErrorText message={getErrorMessage("name")} />

                            {/* Date of Birth */}
                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Date of Birth
                            </Text>
                            <Controller
                                control={control}
                                name="dob"
                                render={({ field: { value } }) => (
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            borderWidth: 1,
                                            borderColor: hasError("dob")
                                                ? "#ef4444"
                                                : "rgba(0,0,0,0.1)",
                                            borderRadius: 14,
                                            backgroundColor: "rgba(255,255,255,0.9)",
                                            height: 50,
                                            paddingHorizontal: 16,
                                            marginBottom: hasError("dob") ? 2 : 16,
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker(true)}
                                            style={{ flex: 1 }}
                                        >
                                            <Text
                                                style={{
                                                    color: value ? "#000" : "rgba(0,0,0,0.4)",
                                                }}
                                            >
                                                {value || "dd-mm-yyyy"}
                                            </Text>
                                        </TouchableOpacity>
                                        {value ? (
                                            <TouchableOpacity
                                                onPress={() =>
                                                    setValue("dob", "", { shouldValidate: true } as any)
                                                }
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
                                )}
                            />
                            <ErrorText message={getErrorMessage("dob")} />

                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="default"
                                    maximumDate={new Date()}
                                    onChange={onDateChange}
                                />
                            )}

                            {/* Mobile */}
                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Mobile Number
                            </Text>
                            <Controller
                                control={control}
                                name="mobile"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Enter your mobile number"
                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="phone-pad"
                                        style={inputStyle(hasError("mobile"))}
                                    />
                                )}
                            />
                            <ErrorText message={getErrorMessage("mobile")} />

                            {/* Email */}
                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Email
                            </Text>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        placeholder="Enter your email"
                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        style={inputStyle(hasError("email"))}
                                    />
                                )}
                            />
                            <ErrorText message={getErrorMessage("email")} />

                            {/* Experienced-only fields */}
                            {userType === "experienced" && (
                                <>
                                    {/* Home Course */}
                                    <Text
                                        style={{
                                            fontWeight: "600",
                                            marginBottom: 6,
                                            color: "#374151",
                                        }}
                                    >
                                        Home Course
                                    </Text>
                                    <Controller
                                        control={control}
                                        name={"course" as any}
                                        render={({ field: { value } }) => (
                                            <TouchableOpacity
                                                onPress={() => setCourseModal(true)}
                                                style={{
                                                    borderWidth: 1,
                                                    borderColor: hasError("course")
                                                        ? "#ef4444"
                                                        : "rgba(0,0,0,0.1)",
                                                    borderRadius: 14,
                                                    paddingHorizontal: 16,
                                                    height: 50,
                                                    width: "100%",
                                                    marginBottom: hasError("course") ? 2 : 16,
                                                    backgroundColor: "rgba(255,255,255,0.9)",
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: value ? "#000" : "rgba(0,0,0,0.4)",
                                                    }}
                                                >
                                                    {value || "Select Home Course"}
                                                </Text>
                                                <Ionicons
                                                    name="chevron-down"
                                                    size={20}
                                                    color="rgba(0,0,0,0.4)"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    />
                                    <ErrorText message={getErrorMessage("course")} />

                                    {/* Hcp & H.Index */}
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <View style={{ width: "48%" }}>
                                            <Controller
                                                control={control}
                                                name={"hcp" as any}
                                                render={({ field: { onChange, onBlur, value } }) => (
                                                    <TextInput
                                                        placeholder="Hcp"
                                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                                        value={value}
                                                        onChangeText={onChange}
                                                        onBlur={onBlur}
                                                        keyboardType="numeric"
                                                        style={{
                                                            ...inputStyle(hasError("hcp")),
                                                            width: "100%",
                                                        }}
                                                    />
                                                )}
                                            />
                                            <ErrorText message={getErrorMessage("hcp")} />
                                        </View>
                                        <View style={{ width: "48%" }}>
                                            <Controller
                                                control={control}
                                                name={"hIndex" as any}
                                                render={({ field: { onChange, onBlur, value } }) => (
                                                    <TextInput
                                                        placeholder="H.Index"
                                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                                        value={value}
                                                        onChangeText={onChange}
                                                        onBlur={onBlur}
                                                        keyboardType="numeric"
                                                        style={{
                                                            ...inputStyle(hasError("hIndex")),
                                                            width: "100%",
                                                        }}
                                                    />
                                                )}
                                            />
                                            <ErrorText message={getErrorMessage("hIndex")} />
                                        </View>
                                    </View>

                                    {/* Slope & Rating */}
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <View style={{ width: "48%" }}>
                                            <Controller
                                                control={control}
                                                name={"slope" as any}
                                                render={({ field: { onChange, onBlur, value } }) => (
                                                    <TextInput
                                                        placeholder="Slope"
                                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                                        value={value}
                                                        onChangeText={onChange}
                                                        onBlur={onBlur}
                                                        keyboardType="numeric"
                                                        style={{
                                                            ...inputStyle(hasError("slope")),
                                                            width: "100%",
                                                        }}
                                                    />
                                                )}
                                            />
                                            <ErrorText message={getErrorMessage("slope")} />
                                        </View>
                                        <View style={{ width: "48%" }}>
                                            <Controller
                                                control={control}
                                                name={"rating" as any}
                                                render={({ field: { onChange, onBlur, value } }) => (
                                                    <TextInput
                                                        placeholder="Rating"
                                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                                        value={value}
                                                        onChangeText={onChange}
                                                        onBlur={onBlur}
                                                        keyboardType="numeric"
                                                        style={{
                                                            ...inputStyle(hasError("rating")),
                                                            width: "100%",
                                                        }}
                                                    />
                                                )}
                                            />
                                            <ErrorText message={getErrorMessage("rating")} />
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Password */}
                            <Text style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}>
                                Password
                            </Text>
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <View
                                        style={{
                                            borderWidth: 1,
                                            borderColor: hasError("password")
                                                ? "#ef4444"
                                                : "rgba(0,0,0,0.1)",
                                            borderRadius: 14,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingHorizontal: 16,
                                            height: 50,
                                            marginBottom: hasError("password") ? 2 : 24,
                                            backgroundColor: "rgba(255,255,255,0.9)",
                                        }}
                                    >
                                        <TextInput
                                            placeholder="Enter your password"
                                            placeholderTextColor="rgba(0,0,0,0.4)"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
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
                                )}
                            />
                            <ErrorText message={getErrorMessage("password")} />
                        </ScrollView>

                        {/* Signup Button */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: "#8bc34a",
                                paddingVertical: 16,
                                borderRadius: 14,
                                alignItems: "center",
                                marginTop: 10,
                            }}
                            onPress={handleSubmit(onSubmit)}
                        >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>

                        {/* Login link */}
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

            {/* Course Modal */}
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
                        }}
                    >
                        {courses.map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={{ padding: 15 }}
                                onPress={() => {
                                    setValue("course" as any, item, { shouldValidate: true });
                                    setCourseModal(false);
                                }}
                            >
                                <Text>{item}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity onPress={() => setCourseModal(false)}>
                            <Text style={{ color: "red", textAlign: "center" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}