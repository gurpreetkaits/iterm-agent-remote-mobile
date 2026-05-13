import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { Card, CardRow, Dot, SectionLabel } from "../../components/ui";
import { listSessions } from "../../lib/api";
import { useTheme } from "../../lib/ThemeContext";
import { useStore } from "../../store/useStore";

type Filter = "all" | "agents" | "shell";

export default function SessionsScreen() {
  const t = useTheme();
  const sessions = useStore((s) => s.sessions);
  const setSessions = useStore((s) => s.setSessions);
  const setActiveSession = useStore((s) => s.setActiveSession);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const fetchSessions = useCallback(async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch {
      // ignore
    }
  }, [setSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, [fetchSessions]);

  const counts = useMemo(() => {
    const agents = sessions.filter((s) => s.is_agent).length;
    return {
      all: sessions.length,
      agents,
      shell: sessions.length - agents,
    };
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (filter === "agents" && !s.is_agent) return false;
      if (filter === "shell" && s.is_agent) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.agent_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [sessions, query, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.fg}
          />
        }
      >
        {/* Search */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              position: "absolute",
              left: 12,
              top: 11,
              fontSize: 14,
              color: t.colors.fgMuted,
            }}
          >
            ⌕
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search sessions…"
            placeholderTextColor={t.colors.fgSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: t.colors.bgElev,
              borderWidth: 1,
              borderColor: t.colors.border,
              borderRadius: 8,
              paddingLeft: 32,
              paddingRight: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: t.colors.fg,
            }}
          />
        </View>

        {/* Filter tabs */}
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: t.colors.border,
            marginBottom: 16,
          }}
        >
          {(
            [
              { key: "all", label: "All" },
              { key: "agents", label: "Agents" },
              { key: "shell", label: "Shell" },
            ] as { key: Filter; label: string }[]
          ).map(({ key, label }) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  marginRight: 4,
                  marginBottom: -1,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? t.colors.fg : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: active ? t.colors.fg : t.colors.fgMuted,
                  }}
                >
                  {label}
                  <Text
                    style={{
                      fontFamily: t.fonts.mono,
                      fontSize: 11,
                      color: t.colors.fgMuted,
                      opacity: 0.7,
                    }}
                  >
                    {"  "}
                    {counts[key]}
                  </Text>
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Session rows */}
        {filtered.length === 0 ? (
          <Card>
            <CardRow last>
              <Text style={{ color: t.colors.fgMuted, fontSize: 13 }}>
                {query ? "No matches" : "No sessions yet"}
              </Text>
            </CardRow>
          </Card>
        ) : (
          <Card>
            {filtered.map((s, i) => {
              const tone = s.is_agent ? "green" : "amber";
              const subtitle = [
                `${s.grid_size.width}×${s.grid_size.height}`,
                s.agent_type ? s.agent_type : "shell",
                s.foreground_pid ? `pid ${s.foreground_pid}` : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <CardRow
                  key={s.session_id}
                  last={i === filtered.length - 1}
                  onPress={() => {
                    setActiveSession(s.session_id);
                    router.push("/(tabs)/control");
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Dot tone={tone} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: t.fonts.mono,
                          fontSize: 14,
                          fontWeight: "500",
                          color: t.colors.fg,
                        }}
                        numberOfLines={1}
                      >
                        {s.name || "shell"}
                      </Text>
                      <Text
                        style={{
                          fontFamily: t.fonts.mono,
                          fontSize: 11,
                          color: t.colors.fgMuted,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {subtitle}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: t.colors.fgSubtle, fontSize: 16 }}>
                    ›
                  </Text>
                </CardRow>
              );
            })}
          </Card>
        )}

        <View style={{ marginTop: 24 }}>
          <SectionLabel>Tips</SectionLabel>
          <Card>
            <CardRow>
              <Text style={{ color: t.colors.fg, fontSize: 13 }}>
                Pull down to refresh
              </Text>
              <Text
                style={{
                  fontFamily: t.fonts.mono,
                  fontSize: 12,
                  color: t.colors.fgMuted,
                }}
              >
                live via WS
              </Text>
            </CardRow>
            <CardRow last>
              <Text style={{ color: t.colors.fg, fontSize: 13 }}>
                Tap a session
              </Text>
              <Text
                style={{
                  fontFamily: t.fonts.mono,
                  fontSize: 12,
                  color: t.colors.fgMuted,
                }}
              >
                opens Control
              </Text>
            </CardRow>
          </Card>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(tabs)/control")}
        style={({ pressed }) => ({
          position: "absolute",
          right: 20,
          bottom: 24,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: t.colors.fg,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 4,
        })}
      >
        <Text
          style={{
            color: t.colors.bg,
            fontSize: 28,
            fontWeight: "300",
            lineHeight: 30,
          }}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}
