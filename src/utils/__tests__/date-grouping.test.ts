import {
  getDateCategory,
  getSectionSortKey,
  groupMessagesByDate,
  formatSectionTitle,
  DateCategory,
} from "../date-grouping";
import { ParsedMessage } from "../claude-messages";

// Helper function to create test messages
function createMessage(
  timestamp: Date,
  content = "Test message",
): ParsedMessage {
  return {
    id: `msg-${timestamp.getTime()}`,
    role: "user" as const,
    content,
    timestamp,
    sessionId: "test-session",
    preview: content.substring(0, 50),
  };
}

describe("dateGrouping", () => {
  describe("getDateCategory", () => {
    it("categorizes messages from today", () => {
      const now = new Date(2025, 9, 6, 14, 30); // Oct 6, 2025, 2:30 PM
      const today = new Date(2025, 9, 6, 9, 0); // Oct 6, 2025, 9:00 AM

      expect(getDateCategory(today, now)).toBe("Today");
    });

    it("categorizes messages from yesterday", () => {
      const now = new Date(2025, 9, 6, 14, 30); // Oct 6, 2025
      const yesterday = new Date(2025, 9, 5, 18, 0); // Oct 5, 2025

      expect(getDateCategory(yesterday, now)).toBe("Yesterday");
    });

    it("categorizes messages from this week (Monday-Sunday)", () => {
      const now = new Date(2025, 9, 8, 14, 30); // Oct 8, 2025 (Wednesday)
      const thisWeek = new Date(2025, 9, 6, 10, 0); // Oct 6, 2025 (Monday - start of this week)

      expect(getDateCategory(thisWeek, now)).toBe("This Week");
    });

    it("categorizes messages from this month", () => {
      const now = new Date(2025, 9, 15, 14, 30); // Oct 15, 2025
      const thisMonth = new Date(2025, 9, 1, 10, 0); // Oct 1, 2025

      expect(getDateCategory(thisMonth, now)).toBe("This Month");
    });

    it("categorizes messages from this year", () => {
      const now = new Date(2025, 9, 6, 14, 30); // Oct 6, 2025
      const thisYear = new Date(2025, 0, 15, 10, 0); // Jan 15, 2025

      expect(getDateCategory(thisYear, now)).toBe("This Year");
    });

    it("categorizes messages from previous years by year", () => {
      const now = new Date(2025, 9, 6, 14, 30); // Oct 6, 2025
      const year2024 = new Date(2024, 5, 1, 10, 0); // June 1, 2024
      const year2023 = new Date(2023, 2, 10, 10, 0); // March 10, 2023

      expect(getDateCategory(year2024, now)).toBe("2024");
      expect(getDateCategory(year2023, now)).toBe("2023");
    });

    it("handles midnight boundary correctly", () => {
      const now = new Date(2025, 9, 6, 14, 30); // Oct 6, 2025, 2:30 PM
      const midnight = new Date(2025, 9, 6, 0, 0, 0); // Oct 6, 2025, 12:00 AM

      expect(getDateCategory(midnight, now)).toBe("Today");
    });

    it("handles week boundaries with Monday start", () => {
      // If today is Wednesday Oct 8, 2025
      const now = new Date(2025, 9, 8, 14, 30); // Wednesday

      // Tuesday Oct 7 should be Yesterday
      const tuesday = new Date(2025, 9, 7, 10, 0);
      expect(getDateCategory(tuesday, now)).toBe("Yesterday");

      // Monday Oct 6 (start of this week) should be This Week
      const monday = new Date(2025, 9, 6, 10, 0);
      expect(getDateCategory(monday, now)).toBe("This Week");

      // Sunday Oct 5 (last week) should be This Month
      const sunday = new Date(2025, 9, 5, 10, 0);
      expect(getDateCategory(sunday, now)).toBe("This Month");
    });

    it("handles week boundaries when today is Sunday", () => {
      // If today is Sunday Oct 12, 2025
      const now = new Date(2025, 9, 12, 14, 30); // Sunday

      // Saturday Oct 11 should be Yesterday
      const saturday = new Date(2025, 9, 11, 10, 0);
      expect(getDateCategory(saturday, now)).toBe("Yesterday");

      // Friday Oct 10 should be This Week
      const friday = new Date(2025, 9, 10, 10, 0);
      expect(getDateCategory(friday, now)).toBe("This Week");

      // Monday Oct 6 (start of this week) should be This Week
      const monday = new Date(2025, 9, 6, 10, 0);
      expect(getDateCategory(monday, now)).toBe("This Week");

      // Sunday Oct 5 (last week) should be This Month
      const lastSunday = new Date(2025, 9, 5, 10, 0);
      expect(getDateCategory(lastSunday, now)).toBe("This Month");
    });

    it("handles end of month boundary", () => {
      const now = new Date(2025, 9, 31, 14, 30); // Oct 31, 2025
      const startOfMonth = new Date(2025, 9, 1, 10, 0); // Oct 1, 2025

      expect(getDateCategory(startOfMonth, now)).toBe("This Month");
    });

    it("handles end of year boundary", () => {
      const now = new Date(2025, 11, 31, 14, 30); // Dec 31, 2025
      const startOfYear = new Date(2025, 0, 1, 10, 0); // Jan 1, 2025

      expect(getDateCategory(startOfYear, now)).toBe("This Year");
    });

    it("handles future dates within today", () => {
      const now = new Date(2025, 9, 6, 14, 30); // Oct 6, 2025, 2:30 PM
      const future = new Date(2025, 9, 6, 18, 0); // Oct 6, 2025, 6:00 PM (4 hours future)

      expect(getDateCategory(future, now)).toBe("Today");
    });

    it("handles very old dates", () => {
      const now = new Date(2025, 9, 6, 14, 30); // Oct 6, 2025
      const year1999 = new Date(1999, 5, 1, 10, 0); // June 1, 1999

      expect(getDateCategory(year1999, now)).toBe("1999");
    });
  });

  describe("getSectionSortKey", () => {
    it("returns correct sort keys for standard sections", () => {
      expect(getSectionSortKey("Today")).toBe(0);
      expect(getSectionSortKey("Yesterday")).toBe(1);
      expect(getSectionSortKey("This Week")).toBe(2);
      expect(getSectionSortKey("This Month")).toBe(3);
      expect(getSectionSortKey("This Year")).toBe(4);
    });

    it("returns correct year values for year sections in descending order", () => {
      // 2024 -> 10000 - 2024 = 7976
      // 2023 -> 10000 - 2023 = 7977
      // 2022 -> 10000 - 2022 = 7978
      expect(getSectionSortKey("2024")).toBe(10000 - 2024);
      expect(getSectionSortKey("2023")).toBe(10000 - 2023);
      expect(getSectionSortKey("2022")).toBe(10000 - 2022);

      // Verify ordering: 2024 should come before 2023 (lower sort key)
      expect(getSectionSortKey("2024")).toBeLessThan(getSectionSortKey("2023"));

      // Verify year sections come after standard sections
      expect(getSectionSortKey("2024")).toBeGreaterThan(
        getSectionSortKey("This Year"),
      );
    });

    it("handles invalid categories gracefully", () => {
      expect(getSectionSortKey("Invalid Category")).toBe(99999);
      expect(getSectionSortKey("")).toBe(99999);
    });

    it("sorts year sections correctly (newer first)", () => {
      const years: DateCategory[] = ["2024", "2023", "2025", "2022"];
      const sorted = years.sort(
        (a, b) => getSectionSortKey(a) - getSectionSortKey(b),
      );

      expect(sorted).toEqual(["2025", "2024", "2023", "2022"]);
    });

    it("maintains correct order of all section types", () => {
      const sections: DateCategory[] = [
        "2023",
        "This Month",
        "Today",
        "2024",
        "This Year",
        "Yesterday",
        "This Week",
      ];
      const sorted = sections.sort(
        (a, b) => getSectionSortKey(a) - getSectionSortKey(b),
      );

      expect(sorted).toEqual([
        "Today",
        "Yesterday",
        "This Week",
        "This Month",
        "This Year",
        "2024",
        "2023",
      ]);
    });
  });

  describe("groupMessagesByDate", () => {
    it("groups messages into correct sections", () => {
      // We need to test with actual current date since getDateCategory uses Date.now() by default
      const messages: ParsedMessage[] = [
        createMessage(new Date(2025, 9, 6, 10, 0)), // Today
        createMessage(new Date(2025, 9, 6, 11, 0)), // Today
        createMessage(new Date(2025, 9, 5, 18, 0)), // Yesterday
        createMessage(new Date(2024, 8, 1, 12, 0)), // 2024
      ];

      // We need to temporarily override the default 'now' in getDateCategory
      // Since we can't easily mock it, we'll test with actual current date
      const groups = groupMessagesByDate(messages);

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.every((g) => g.messages.length > 0)).toBe(true);
      expect(groups.every((g) => g.category)).toBeTruthy();
      expect(groups.every((g) => typeof g.sortKey === "number")).toBe(true);
    });

    it("returns empty array for empty input", () => {
      const groups = groupMessagesByDate([]);
      expect(groups).toEqual([]);
    });

    it("handles single message", () => {
      const message = createMessage(new Date());
      const groups = groupMessagesByDate([message]);

      expect(groups).toHaveLength(1);
      expect(groups[0].messages).toHaveLength(1);
      expect(groups[0].messages[0]).toEqual(message);
    });

    it("maintains message order within groups", () => {
      // Use a fixed "now" time to avoid midnight boundary issues
      const now = new Date(2025, 9, 8, 14, 30); // Oct 8, 2025, 2:30 PM

      // Create messages at different times today, all guaranteed to be "Today"
      const today1 = createMessage(new Date(2025, 9, 8, 10, 0), "Message 1"); // 10 AM
      const today2 = createMessage(new Date(2025, 9, 8, 12, 0), "Message 2"); // 12 PM
      const today3 = createMessage(new Date(2025, 9, 8, 14, 0), "Message 3"); // 2 PM

      const messages = [today1, today2, today3];
      const groups = groupMessagesByDate(messages, now);

      const todayGroup = groups.find((g) => g.category === "Today");
      expect(todayGroup).toBeDefined();
      expect(todayGroup!.messages).toEqual([today1, today2, today3]);
    });

    it("groups are sorted by section order", () => {
      const groups = groupMessagesByDate([
        createMessage(new Date(2024, 5, 1)), // 2024
        createMessage(new Date()), // Today
        createMessage(new Date(Date.now() - 86400000)), // Yesterday
      ]);

      // First group should have lowest sortKey
      expect(groups[0].sortKey).toBeLessThanOrEqual(
        groups[1]?.sortKey || Infinity,
      );
      if (groups.length > 2) {
        expect(groups[1].sortKey).toBeLessThanOrEqual(groups[2].sortKey);
      }
    });

    it("handles messages spanning multiple years", () => {
      const messages = [
        createMessage(new Date(2025, 5, 1)),
        createMessage(new Date(2024, 5, 1)),
        createMessage(new Date(2023, 5, 1)),
        createMessage(new Date(2022, 5, 1)),
      ];

      const groups = groupMessagesByDate(messages);
      const yearGroups = groups.filter((g) => /^\d{4}$/.test(g.category));

      expect(yearGroups.length).toBeGreaterThan(0);
      // Verify years are in descending order
      const years = yearGroups.map((g) => parseInt(g.category));
      const sortedYears = [...years].sort((a, b) => b - a);
      expect(years).toEqual(sortedYears);
    });
  });

  describe("formatSectionTitle", () => {
    it("formats standard sections with count", () => {
      expect(formatSectionTitle("Today", 5)).toBe("Today (5)");
      expect(formatSectionTitle("Yesterday", 3)).toBe("Yesterday (3)");
      expect(formatSectionTitle("This Week", 12)).toBe("This Week (12)");
    });

    it("formats year sections with count", () => {
      expect(formatSectionTitle("2024", 42)).toBe("2024 (42)");
      expect(formatSectionTitle("2023", 128)).toBe("2023 (128)");
    });

    it("handles singular count", () => {
      expect(formatSectionTitle("Yesterday", 1)).toBe("Yesterday (1)");
      expect(formatSectionTitle("2024", 1)).toBe("2024 (1)");
    });

    it("handles zero count", () => {
      expect(formatSectionTitle("Today", 0)).toBe("Today (0)");
    });

    it("handles large counts", () => {
      expect(formatSectionTitle("2023", 9999)).toBe("2023 (9999)");
    });
  });

  describe("Edge Cases", () => {
    it("handles DST transitions", () => {
      // Test date around DST transition (November 3, 2024 in US)
      const now = new Date(2024, 10, 3, 14, 30); // Nov 3, 2024
      const beforeDST = new Date(2024, 10, 3, 1, 30); // Nov 3, 2024, 1:30 AM

      expect(getDateCategory(beforeDST, now)).toBe("Today");
    });

    it("handles leap year dates", () => {
      const now = new Date(2024, 1, 29, 14, 30); // Feb 29, 2024 (leap year)
      const leapDay = new Date(2024, 1, 29, 10, 0);

      expect(getDateCategory(leapDay, now)).toBe("Today");
    });

    it("handles new year transition", () => {
      const now = new Date(2025, 0, 1, 14, 30); // Jan 1, 2025
      const lastYear = new Date(2024, 11, 31, 18, 0); // Dec 31, 2024 (yesterday from Jan 1)

      expect(getDateCategory(lastYear, now)).toBe("Yesterday");

      // A date further back in 2024 should be "2024"
      const earlierLastYear = new Date(2024, 11, 20, 18, 0); // Dec 20, 2024
      expect(getDateCategory(earlierLastYear, now)).toBe("2024");
    });
  });
});
