import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ImageBackground,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import {
  Sparkles,
  Shield,
  Cpu,
  ArrowRight,
  UserPlus,
  LogIn,
  Layers,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, orgName, logoUrl, loaderConfig, isDark, brandColors, appName } = useTheme();

  // Animation drivers
  const intro3D = useRef(new Animated.Value(0)).current; // 0 -> 1 for 3D flip & reveal
  const quoteFade = useRef(new Animated.Value(0)).current; // Quote appearance
  const authSlide = useRef(new Animated.Value(0)).current; // Login/Register buttons appearance
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Staggered perspective word drop animations
  const subtitleWords = (loaderConfig?.subtitle || "Build fast, ship faster").split(" ");
  const wordAnims = useRef(subtitleWords.map(() => new Animated.Value(0))).current;

  const [showAuthActions, setShowAuthActions] = useState(false);

  useEffect(() => {
    // 1. Initial 3D Flip & Entry
    Animated.sequence([
      Animated.timing(intro3D, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      // Staggered words dropping with 3D perspective delay
      Animated.stagger(
        180,
        wordAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          })
        )
      ),
      Animated.timing(quoteFade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(authSlide, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAuthActions(true);
    });

    // 2. Ambient glowing pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Continuous 3D orbit rotation
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 4. Subtle 3D floating effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [intro3D, quoteFade, authSlide, pulseAnim, orbitAnim, floatAnim, wordAnims]);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const timer = setTimeout(() => {
        router.replace("/(tabs)");
      }, loaderConfig.duration_ms || 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router, loaderConfig]);

  // 3D Interpolations
  const logoRotateY = intro3D.interpolate({
    inputRange: [0, 1],
    outputRange: ["90deg", "0deg"],
  });

  const logoRotateX = intro3D.interpolate({
    inputRange: [0, 1],
    outputRange: ["35deg", "0deg"],
  });

  const logoScale = intro3D.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.5, 1.08, 1],
  });

  const logoTranslateY = intro3D.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const quoteTranslateY = quoteFade.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 0],
  });

  const quoteRotateX = quoteFade.interpolate({
    inputRange: [0, 1],
    outputRange: ["20deg", "0deg"],
  });

  const authTranslateY = authSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const orbitSpin = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const activeTitle = loaderConfig?.title || orgName || appName || "supernova";

  return (
    <ImageBackground
      source={require("../assets/images/bg-aimodel.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor:
              loaderConfig.bg_theme === "light"
                ? "rgba(248, 250, 252, 0.88)"
                : "rgba(5, 8, 16, 0.88)",
          },
        ]}
      />

      {/* 3D Perspective Skeleton Grid Background lines */}
      <View style={styles.gridOverlay}>
        <View style={[styles.gridLineHorizontal, { borderColor: `${colors.primary}12` }]} />
        <View style={[styles.gridLineHorizontal, { borderColor: `${colors.primary}12`, top: "35%" }]} />
        <View style={[styles.gridLineHorizontal, { borderColor: `${colors.primary}12`, top: "65%" }]} />
        <View style={[styles.gridLineVertical, { borderColor: `${colors.primary}12`, left: "25%" }]} />
        <View style={[styles.gridLineVertical, { borderColor: `${colors.primary}12`, left: "75%" }]} />
      </View>

      <View style={styles.container}>
        {/* =========================================
            STAGE 1: 3D ANIMATED LOGO & GLOW RINGS
           ========================================= */}
        <Animated.View
          style={[
            styles.logoWrapper3D,
            {
              transform: [
                { perspective: 1000 },
                { translateY: logoTranslateY },
                { translateY: floatAnim },
                { rotateY: logoRotateY },
                { rotateX: logoRotateX },
                { scale: logoScale },
              ],
            },
          ]}
        >
          {/* Dynamic Glowing Outer Rings with DB Primary Color */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                backgroundColor: `${colors.primary}22`,
                borderColor: `${colors.primary}45`,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Dynamic 3D Orbit Ring with DB Secondary Color */}
          <Animated.View
            style={[
              styles.orbitRing,
              {
                borderColor: `${colors.secondary}55`,
                transform: [{ rotate: orbitSpin }],
              },
            ]}
          >
            <View
              style={[
                styles.orbitDot,
                {
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                },
              ]}
            />
          </Animated.View>

          {/* 3D Glassmorphic Central Logo Badge */}
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: colors.cardGlass,
                borderColor: `${colors.primary}60`,
                shadowColor: colors.primary,
              },
            ]}
          >
            <View
              style={[
                styles.iconInner,
                {
                  backgroundColor: `${colors.primary}25`,
                  borderColor: `${colors.secondary}35`,
                },
              ]}
            >
              <Image
                source={
                  logoUrl
                    ? { uri: logoUrl }
                    : require("../assets/images/networking.png")
                }
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
          </View>
        </Animated.View>

        {/* =========================================
            STAGE 2: ORG NAME & STAGGERED 3D SUBTITLE
           ========================================= */}
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: quoteFade,
              transform: [
                { perspective: 1000 },
                { translateY: quoteTranslateY },
                { rotateX: quoteRotateX },
              ],
            },
          ]}
        >
          {/* Dynamic Organization Title */}
          <Text style={[styles.brandTitle, { color: colors.text }]}>
            {activeTitle}
          </Text>

          {/* Staggered 3D Perspective Word Drop */}
          <View style={styles.wordsRow}>
            {subtitleWords.map((word, i) => {
              const anim = wordAnims[i] || new Animated.Value(1);
              const dropY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-35, 0],
              });
              const wordRotateX = anim.interpolate({
                inputRange: [0, 1],
                outputRange: ["45deg", "0deg"],
              });
              const wordOpacity = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });

              return (
                <Animated.View
                  key={i}
                  style={{
                    opacity: wordOpacity,
                    transform: [
                      { perspective: 800 },
                      { translateY: dropY },
                      { rotateX: wordRotateX },
                    ],
                  }}
                >
                  <Text
                    style={[
                      styles.wordText,
                      {
                        color:
                          i === subtitleWords.length - 1
                            ? colors.accent
                            : colors.primaryLight,
                      },
                    ]}
                  >
                    {word}
                  </Text>
                </Animated.View>
              );
            })}
          </View>

          {/* 3D Glass Identity Box */}
          <View
            style={[
              styles.quoteCard,
              {
                backgroundColor: colors.cardGlass,
                borderColor: `${colors.primary}35`,
                shadowColor: colors.primary,
              },
            ]}
          >
            <View style={styles.quoteHeaderRow}>
              <Layers size={14} color={colors.primaryLight} />
              <Text style={[styles.quoteBadge, { color: colors.accent }]}>
                {loaderConfig.bg_theme === "dark" ? "Midnight Dark Studio" : "Daylight Studio"}
              </Text>
            </View>

            <Text style={[styles.quoteText, { color: colors.text }]}>
              "Real-time ticket orchestration & generative AI copilot tailored for {activeTitle}."
            </Text>

            {/* Feature Pills with DB Colors */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.pillBadge,
                  { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` },
                ]}
              >
                <Sparkles size={11} color={colors.primaryLight} />
                <Text style={[styles.pillText, { color: colors.primaryLight }]}>Primary #{brandColors.primary.replace("#", "")}</Text>
              </View>

              <View
                style={[
                  styles.pillBadge,
                  { backgroundColor: `${colors.secondary}18`, borderColor: `${colors.secondary}40` },
                ]}
              >
                <Cpu size={11} color={colors.secondaryLight} />
                <Text style={[styles.pillText, { color: colors.secondaryLight }]}>Secondary #{brandColors.secondary.replace("#", "")}</Text>
              </View>

              <View
                style={[
                  styles.pillBadge,
                  { backgroundColor: `${colors.accent}18`, borderColor: `${colors.accent}40` },
                ]}
              >
                <Shield size={11} color={colors.accent} />
                <Text style={[styles.pillText, { color: colors.accent }]}>Accent #{brandColors.accent.replace("#", "")}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* =========================================
            STAGE 3: LOGIN & REGISTER ACTIONS APPEAR
           ========================================= */}
        <Animated.View
          style={[
            styles.authActionsWrapper,
            {
              opacity: authSlide,
              transform: [{ translateY: authTranslateY }],
            },
          ]}
        >
          {/* Primary Action: Sign In */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/login")}
          >
            <LogIn size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Sign In to {activeTitle}</Text>
            <ArrowRight size={18} color="#ffffff" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>

          {/* Secondary Action: Create Account */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.cardGlass,
                borderColor: `${colors.secondary}50`,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/register")}
          >
            <UserPlus size={18} color={colors.primaryLight} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Create New Account
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: 1,
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoWrapper3D: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  glowRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
  },
  orbitRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  orbitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
    elevation: 6,
    marginTop: -5,
  },
  logoBadge: {
    width: 106,
    height: 106,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  iconInner: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  brandLogo: {
    width: 48,
    height: 48,
  },
  quoteContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: "center",
    textTransform: "capitalize",
  },
  wordsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  wordText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  quoteCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  quoteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  quoteBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 9,
    fontWeight: "700",
  },
  authActionsWrapper: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 15,
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
