import React, { useEffect, useMemo, useRef } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "../lib/theme";
import type { StyledLine, StyledRun } from "../lib/types";

interface Props {
  lines: StyledLine[];
}

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "Courier" });

const DEFAULT_FG = "#e6edf3";
const DEFAULT_BG = "#000000";

const F_BOLD = 1;
const F_ITALIC = 2;
const F_UNDERLINE = 4;
const F_INVERSE = 8;

function runStyle(run: StyledRun) {
  const fl = run.fl || 0;
  const inverse = (fl & F_INVERSE) !== 0;
  const fg = inverse ? run.b || DEFAULT_BG : run.f;
  const bg = inverse ? run.f || DEFAULT_FG : run.b;
  return {
    color: fg,
    backgroundColor: bg,
    fontWeight: (fl & F_BOLD) !== 0 ? ("700" as const) : undefined,
    fontStyle: (fl & F_ITALIC) !== 0 ? ("italic" as const) : undefined,
    textDecorationLine:
      (fl & F_UNDERLINE) !== 0 ? ("underline" as const) : undefined,
  };
}

const LineRow = React.memo(function LineRow({ runs }: { runs: StyledLine }) {
  if (runs.length === 0) {
    return <Text style={styles.line}> </Text>;
  }
  return (
    <Text style={styles.line} selectable>
      {runs.map((run, i) => (
        <Text key={i} style={runStyle(run)}>
          {run.t}
        </Text>
      ))}
    </Text>
  );
});

export function TerminalOutput({ lines }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [lines]);

  const rendered = useMemo(
    () => lines.map((runs, i) => <LineRow key={i} runs={runs} />),
    [lines]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
      >
        {rendered}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DEFAULT_BG,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  line: {
    fontFamily: MONO,
    fontSize: 14,
    color: DEFAULT_FG,
    lineHeight: 20,
  },
});
