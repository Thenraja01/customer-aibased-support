import React from "react";
import { Tabs } from "expo-router";
import { View, Platform, StyleSheet } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { Home, Bot, Ticket, BookOpen, User } from "lucide-react-native";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBar,
            borderTopColor: `${colors.secondary}30`,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.primary}25`, borderColor: `${colors.primary}50` },
              ]}
            >
              <Home size={19} color={focused ? colors.primaryLight : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.secondary}25`, borderColor: `${colors.secondary}50` },
              ]}
            >
              <Bot size={19} color={focused ? colors.secondaryLight : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: "Tickets",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.accent}25`, borderColor: `${colors.accent}50` },
              ]}
            >
              <Ticket size={19} color={focused ? colors.accent : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="faq"
        options={{
          title: "Knowledge",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.secondary}25`, borderColor: `${colors.secondary}50` },
              ]}
            >
              <BookOpen size={19} color={focused ? colors.secondaryLight : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.primary}25`, borderColor: `${colors.primary}50` },
              ]}
            >
              <User size={19} color={focused ? colors.primaryLight : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 88 : 68,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    paddingTop: 8,
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
