import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { TABS } from "../../lib/config";

const BRAND = "#c17b7b";

export default function TabsLayout() {
  const { status } = useAuth();
  if (status === "loading") return null;
  if (status === "out") return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: "#a3a3a3",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#f1f1f1" },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={(focused ? tab.icon : `${tab.icon}-outline`) as keyof typeof Ionicons.glyphMap}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
