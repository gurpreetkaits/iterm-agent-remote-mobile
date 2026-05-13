import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../lib/ThemeContext";
import type { Cursor, StyledLine, StyledRun } from "../lib/types";
import { useStore } from "../store/useStore";

interface Props {
  lines: StyledLine[];
  cursor?: Cursor | null;
}

const F_BOLD = 1;
const F_ITALIC = 2;
const F_UNDERLINE = 4;
const F_INVERSE = 8;

// Menlo / monospace cell width ratio (cell_width / font_size). Empirical.
const CELL_RATIO = 0.6;
const LINE_RATIO = 1.4;

function normalize(line: unknown): StyledLine {
  if (typeof line === "string") {
    return line.length > 0 ? [{ t: line }] : [];
  }
  if (Array.isArray(line)) return line as StyledLine;
  return [];
}

export function TerminalOutput({ lines, cursor }: Props) {
  const t = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const fontSize = useStore((s) => s.terminalFontSize);
  const setFontSize = useStore((s) => s.setTerminalFontSize);

  const cellW = fontSize * CELL_RATIO;
  const lineH = Math.round(fontSize * LINE_RATIO);

  const pinchStart = useRef<{ dist: number; size: number } | null>(null);
  const [showZoom, setShowZoom] = useState(false);
  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only claim the responder when 2 fingers are down — leaves scroll + tap
  // events to the ScrollView and any wrapping Pressable.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (e) =>
          e.nativeEvent.touches.length === 2,
        onMoveShouldSetPanResponder: (e) =>
          e.nativeEvent.touches.length === 2,
        onPanResponderGrant: (e) => {
          const touches = e.nativeEvent.touches;
          if (touches.length === 2) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            pinchStart.current = {
              dist: Math.hypot(dx, dy),
              size: fontSize,
            };
            setShowZoom(true);
          }
        },
        onPanResponderMove: (e) => {
          const touches = e.nativeEvent.touches;
          if (touches.length === 2 && pinchStart.current) {
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            const dist = Math.hypot(dx, dy);
            if (pinchStart.current.dist > 0) {
              const scale = dist / pinchStart.current.dist;
              const next = Math.round(pinchStart.current.size * scale);
              setFontSize(next);
            }
          }
        },
        onPanResponderRelease: () => {
          pinchStart.current = null;
          if (zoomTimer.current) clearTimeout(zoomTimer.current);
          zoomTimer.current = setTimeout(() => setShowZoom(false), 700);
        },
        onPanResponderTerminate: () => {
          pinchStart.current = null;
          if (zoomTimer.current) clearTimeout(zoomTimer.current);
          zoomTimer.current = setTimeout(() => setShowZoom(false), 700);
        },
      }),
    [fontSize, setFontSize]
  );

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [lines]);

  const runStyle = (run: StyledRun) => {
    const fl = run.fl || 0;
    const inverse = (fl & F_INVERSE) !== 0;
    const fg = inverse ? run.b || t.colors.termBg : run.f;
    const bg = inverse ? run.f || t.colors.termFg : run.b;
    return {
      color: fg,
      backgroundColor: bg,
      fontWeight: (fl & F_BOLD) !== 0 ? ("700" as const) : undefined,
      fontStyle: (fl & F_ITALIC) !== 0 ? ("italic" as const) : undefined,
      textDecorationLine:
        (fl & F_UNDERLINE) !== 0 ? ("underline" as const) : undefined,
    };
  };

  const rendered = useMemo(
    () =>
      (lines || []).map((raw, i) => {
        const runs = normalize(raw);
        if (runs.length === 0) {
          return (
            <Text
              key={i}
              style={[
                styles.line,
                {
                  color: t.colors.termFg,
                  fontSize,
                  lineHeight: lineH,
                },
              ]}
            >
              {" "}
            </Text>
          );
        }
        return (
          <Text
            key={i}
            style={[
              styles.line,
              {
                color: t.colors.termFg,
                fontSize,
                lineHeight: lineH,
              },
            ]}
            selectable
          >
            {runs.map((run, j) => (
              <Text key={j} style={runStyle(run)}>
                {run.t}
              </Text>
            ))}
          </Text>
        );
      }),
    [lines, t.colors.termFg, t.colors.termBg, fontSize, lineH]
  );

  const showCursor =
    cursor && cursor.y >= 0 && cursor.y < (lines?.length ?? 0);

  return (
    <View
      {...responder.panHandlers}
      style={[styles.container, { backgroundColor: t.colors.termBg }]}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingVertical: 8,
          paddingHorizontal: 10,
          position: "relative",
        }}
        showsVerticalScrollIndicator
      >
        {rendered}
        {showCursor ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 8 + cursor!.y * lineH,
              left: 10 + cursor!.x * cellW,
              width: cellW,
              height: lineH,
              backgroundColor: t.colors.termFg,
              opacity: 0.55,
              borderRadius: 1,
            }}
          />
        ) : null}
      </ScrollView>
      {showZoom ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 4,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: "Menlo",
              fontSize: 11,
            }}
          >
            {fontSize}px
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  line: {
    fontFamily: "Menlo",
  },
});
