import React from "react";
import { View, Text, StyleSheet, Pressable, Linking, Platform, Alert } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Message } from "@/types/message";

export interface BubbleProps {
  message: Message;
}

export function Bubble({ message }: BubbleProps) {
  const isMine = Boolean(message.mine);

  const handleOpenMaps = async (latitude: number, longitude: number) => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics may not be supported on web or simulator
      }

      const webMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const nativeScheme = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}`,
      });

      if (nativeScheme) {
        const canOpen = await Linking.canOpenURL(nativeScheme).catch(() => false);
        if (canOpen) {
          await Linking.openURL(nativeScheme);
          return;
        }
      }

      await Linking.openURL(webMapsUrl);
    } catch {
      Alert.alert("Error", "Unable to open maps application.");
    }
  };

  const renderContent = () => {
    switch (message.kind) {
      case "text":
        return (
          <Text style={[styles.text, isMine && styles.textMine]}>
            {message.text}
          </Text>
        );

      case "photo":
        return (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: message.uri }}
              style={styles.photo}
              contentFit="cover"
              transition={200}
            />
          </View>
        );

      case "location":
        return (
          <Pressable
            style={({ pressed }) => [
              styles.locationCard,
              pressed && styles.locationCardPressed,
            ]}
            onPress={() => handleOpenMaps(message.latitude, message.longitude)}
            accessibilityRole="button"
            accessibilityLabel={`Location: ${message.latitude}, ${message.longitude}. Tap to open in Maps.`}
          >
            <View style={styles.locationHeaderRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={[styles.locationTitle, isMine && styles.textMine]}>
                Shared Location
              </Text>
            </View>

            <Text style={[styles.coordinatesText, isMine ? styles.coordsMine : styles.coordsThem]}>
              {message.latitude.toFixed(5)}°, {message.longitude.toFixed(5)}°
            </Text>

            {message.approximate && (
              <View style={[styles.approximateBadge, isMine && styles.approximateBadgeMine]}>
                <Text style={[styles.approximateBadgeText, isMine && styles.approximateBadgeTextMine]}>
                  Approximate Location
                </Text>
              </View>
            )}

            <View style={[styles.mapActionRow, isMine && styles.mapActionRowMine]}>
              <Text style={[styles.mapActionText, isMine && styles.mapActionTextMine]}>
                Open in Maps ↗
              </Text>
            </View>
          </Pressable>
        );

      default:
        return null;
    }
  };

  const isPhoto = message.kind === "photo";

  return (
    <View
      style={[
        styles.container,
        isMine ? styles.containerMine : styles.containerThem,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleThem,
          isPhoto && styles.bubblePhoto,
        ]}
      >
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 12,
    marginVertical: 4,
    flexDirection: "row",
  },
  containerThem: {
    justifyContent: "flex-start",
  },
  containerMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleThem: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleMine: {
    backgroundColor: "#1a5276", // DAUST navy
    borderBottomRightRadius: 4,
  },
  bubblePhoto: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    overflow: "hidden",
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    color: "#1c2833",
  },
  textMine: {
    color: "#ffffff",
  },
  photoContainer: {
    borderRadius: 14,
    overflow: "hidden",
  },
  photo: {
    width: 240,
    height: 180,
    borderRadius: 14,
    backgroundColor: "#cbd5e1",
  },
  locationCard: {
    minWidth: 200,
    gap: 6,
  },
  locationCardPressed: {
    opacity: 0.85,
  },
  locationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1c2833",
  },
  coordinatesText: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  coordsMine: {
    color: "#e0f2fe",
  },
  coordsThem: {
    color: "#475569",
  },
  approximateBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  approximateBadgeMine: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  approximateBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400e",
  },
  approximateBadgeTextMine: {
    color: "#fef08a",
  },
  mapActionRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e8f0",
    alignItems: "flex-end",
  },
  mapActionRowMine: {
    borderTopColor: "rgba(255, 255, 255, 0.25)",
  },
  mapActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a5276",
  },
  mapActionTextMine: {
    color: "#ffffff",
    textDecorationLine: "underline",
  },
});
