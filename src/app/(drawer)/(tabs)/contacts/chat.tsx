import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Bubble } from "@/components/Bubble";
import { Message } from "@/types/message";

const START_MESSAGES: Message[] = [
  { id: "1", kind: "text", text: "Hi!", mine: false },
  { id: "2", kind: "text", text: "Hello Awa 👋", mine: true },
  { id: "3", kind: "text", text: "Ready for Lab 11?", mine: false },
];

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(START_MESSAGES);
  const [draft, setDraft] = useState("");
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Trigger haptic feedback safely (handling web/simulator where unsupported)
  const safeHaptic = async (type: "light" | "success" | "warning") => {
    try {
      if (type === "light") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === "success") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === "warning") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      // Haptics unavailable on platform
    }
  };

  // 1. Text message sending
  const handleSendText = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    await safeHaptic("light");

    const newMessage: Message = {
      id: String(Date.now()),
      kind: "text",
      text: trimmed,
      mine: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  };

  // 2. Photo capture with ImagePicker.launchCameraAsync and modern File/Paths from expo-file-system
  const handleTakePhoto = async () => {
    try {
      await safeHaptic("light");

      // Check and request camera permissions
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        await safeHaptic("warning");
        if (!permission.canAskAgain) {
          Alert.alert(
            "Camera Permission Required",
            "Camera access has been disabled. Please enable camera access in your device settings to take photos.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert(
            "Permission Denied",
            "Camera permission is required to capture photos in chat."
          );
        }
        return;
      }

      setIsProcessingMedia(true);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsProcessingMedia(false);
        return;
      }

      const tempUri = result.assets[0].uri;

      // Persist the photo to the app's document directory using modern expo-file-system API
      const fileName = `photo_${Date.now()}.jpg`;
      const sourceFile = new File(tempUri);
      const persistentFile = new File(Paths.document, fileName);

      await sourceFile.copy(persistentFile);

      const photoMessage: Message = {
        id: String(Date.now()),
        kind: "photo",
        uri: persistentFile.uri,
        mine: true,
      };

      setMessages((prev) => [...prev, photoMessage]);
      await safeHaptic("success");
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Could not capture or save photo. Please try again.");
    } finally {
      setIsProcessingMedia(false);
    }
  };

  // 3. Location sharing with expo-location & handling approximate/permissions
  const handleShareLocation = async () => {
    try {
      await safeHaptic("light");

      // Check if location services are enabled on the device
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        await safeHaptic("warning");
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services on your device to share your current location."
        );
        return;
      }

      // Check/request foreground location permissions
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        await safeHaptic("warning");
        if (!permission.canAskAgain) {
          Alert.alert(
            "Location Permission Required",
            "Location permission was previously denied. Please enable it in device settings to share your location.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to share your location."
          );
        }
        return;
      }

      setIsProcessingMedia(true);

      // Fetch current position with balanced accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Determine if location is approximate (coarse permission on Android or accuracy > 100m)
      const isApproximate =
        permission.android?.accuracy === "coarse" ||
        (location.coords.accuracy !== null && location.coords.accuracy > 100);

      const locationMessage: Message = {
        id: String(Date.now()),
        kind: "location",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        approximate: isApproximate,
        mine: true,
      };

      setMessages((prev) => [...prev, locationMessage]);
      await safeHaptic("success");
    } catch (error) {
      console.error("Error obtaining location:", error);
      Alert.alert("Error", "Could not retrieve your location. Please check device settings.");
    } finally {
      setIsProcessingMedia(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Image
            source={{ uri: "https://i.pravatar.cc/100?u=awa" }}
            style={styles.avatar}
            contentFit="cover"
          />

          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Awa Diop</Text>
            <Text style={styles.headerStatus}>Computer Science</Text>
          </View>
        </View>

        {/* Messages List wrapped with KeyboardAvoidingView */}
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <Bubble message={item} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No messages yet. Say hello.</Text>
            }
            ListHeaderComponent={
              <Text style={styles.dateLabel}>Today</Text>
            }
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />

          {/* Action composer loading overlay if retrieving media/location */}
          {isProcessingMedia && (
            <View style={styles.processingIndicator}>
              <ActivityIndicator size="small" color="#1a5276" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}

          {/* Footer with action buttons, input, and send */}
          <View style={styles.footer}>
            {/* Camera action button */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={handleTakePhoto}
              disabled={isProcessingMedia}
              accessibilityRole="button"
              accessibilityLabel="Take Photo"
            >
              <Text style={styles.actionIcon}>📷</Text>
            </Pressable>

            {/* Location action button */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={handleShareLocation}
              disabled={isProcessingMedia}
              accessibilityRole="button"
              accessibilityLabel="Share Location"
            >
              <Text style={styles.actionIcon}>📍</Text>
            </Pressable>

            {/* Text input */}
            <TextInput
              style={styles.input}
              placeholder="Write a message…"
              placeholderTextColor="#94a3b8"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={1000}
            />

            {/* Send button */}
            <Pressable
              style={({ pressed }) => [
                styles.send,
                (!draft.trim() || isProcessingMedia) && styles.sendDisabled,
                pressed && styles.sendPressed,
              ]}
              onPress={handleSendText}
              disabled={!draft.trim() || isProcessingMedia}
              accessibilityRole="button"
              accessibilityLabel="Send Message"
            >
              <Text style={styles.sendLabel}>➤</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    height: 60,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#cbd5e1",
  },
  backButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: -4,
  },
  backArrow: {
    fontSize: 28,
    lineHeight: 28,
    color: "#1a5276",
    fontWeight: "300",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  headerStatus: {
    fontSize: 12,
    color: "#64748b",
  },
  messages: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  messagesContent: {
    paddingVertical: 12,
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    paddingVertical: 32,
    fontSize: 14,
  },
  dateLabel: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    paddingBottom: 8,
  },
  processingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    backgroundColor: "#f1f5f9",
    gap: 8,
  },
  processingText: {
    fontSize: 13,
    color: "#475569",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonPressed: {
    backgroundColor: "#e2e8f0",
  },
  actionIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a5276",
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendPressed: {
    opacity: 0.8,
  },
  sendLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
