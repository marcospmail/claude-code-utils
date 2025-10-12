/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChangelogDetail from "../commands/changelog/detail";
import { ChangelogVersion } from "../utils/changelog";

// Mock Raycast API
jest.mock("@raycast/api");

describe("ChangelogDetail", () => {
  const mockVersion: ChangelogVersion = {
    version: "1.2.0",
    changes: ["Added new feature A", "Fixed bug B", "Updated documentation"],
  };

  it("should render changelog detail", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const detail = screen.getByTestId("detail");
    expect(detail).toBeInTheDocument();
  });

  it("should display version in navigation title", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const detail = screen.getByTestId("detail");
    expect(detail).toHaveAttribute("data-navigation-title", "Version 1.2.0");
  });

  it("should include version and changes in markdown", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("# Version 1.2.0");
    expect(markdown).toContain("## Changes");
    expect(markdown).toContain("- Added new feature A");
    expect(markdown).toContain("- Fixed bug B");
    expect(markdown).toContain("- Updated documentation");
  });

  it("should render copy version action", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const copyVersionAction = screen.getByTestId("action-copy-version-number");
    expect(copyVersionAction).toBeInTheDocument();
    expect(copyVersionAction).toHaveAttribute(
      "data-title",
      "Copy Version Number",
    );
  });

  it("should render copy changes action", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const copyChangesAction = screen.getByTestId("action-copy-all-changes");
    expect(copyChangesAction).toBeInTheDocument();
    expect(copyChangesAction).toHaveAttribute("data-title", "Copy All Changes");
  });

  it("should render open in browser action", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const browserAction = screen.getByTestId("action-browser");
    expect(browserAction).toBeInTheDocument();
    expect(browserAction).toHaveAttribute("data-title", "View on GitHub");
  });

  it("should handle single change", () => {
    const singleChangeVersion: ChangelogVersion = {
      version: "1.0.0",
      changes: ["Initial release"],
    };

    render(<ChangelogDetail version={singleChangeVersion} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("# Version 1.0.0");
    expect(markdown).toContain("- Initial release");
  });

  it("should handle empty changes array", () => {
    const emptyVersion: ChangelogVersion = {
      version: "0.1.0",
      changes: [],
    };

    render(<ChangelogDetail version={emptyVersion} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("# Version 0.1.0");
    expect(markdown).toContain("## Changes");
  });

  it("should handle version with special characters", () => {
    const specialVersion: ChangelogVersion = {
      version: "2.0.0-beta.1",
      changes: ["Beta feature"],
    };

    render(<ChangelogDetail version={specialVersion} />);

    const detail = screen.getByTestId("detail");
    expect(detail).toHaveAttribute(
      "data-navigation-title",
      "Version 2.0.0-beta.1",
    );
  });

  it("should handle changes with special characters", () => {
    const specialChangesVersion: ChangelogVersion = {
      version: "1.5.0",
      changes: [
        "Fixed `code` formatting",
        "Updated <component> rendering",
        "Added $variable support",
      ],
    };

    render(<ChangelogDetail version={specialChangesVersion} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("- Fixed `code` formatting");
    expect(markdown).toContain("- Updated <component> rendering");
    expect(markdown).toContain("- Added $variable support");
  });

  it("should handle long changes list", () => {
    const longChangesList: ChangelogVersion = {
      version: "3.0.0",
      changes: Array(20)
        .fill(null)
        .map((_, i) => `Change number ${i + 1}`),
    };

    render(<ChangelogDetail version={longChangesList} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    longChangesList.changes.forEach((change) => {
      expect(markdown).toContain(`- ${change}`);
    });
  });

  it("should format markdown correctly", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    // Check that changes are formatted as bullet points
    mockVersion.changes.forEach((change) => {
      expect(markdown).toMatch(new RegExp(`-\\s+${change}`));
    });
  });

  it("should have all required actions", () => {
    render(<ChangelogDetail version={mockVersion} />);

    const actionPanel = screen.getByTestId("action-panel");
    expect(actionPanel).toBeInTheDocument();

    // Check for both copy actions
    expect(
      screen.getByTestId("action-copy-version-number"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("action-copy-all-changes")).toBeInTheDocument();

    // Check for browser action
    expect(screen.getByTestId("action-browser")).toBeInTheDocument();
  });

  it("should handle changes with newlines", () => {
    const multilineVersion: ChangelogVersion = {
      version: "1.3.0",
      changes: ["Change with\nmultiple\nlines", "Regular change"],
    };

    render(<ChangelogDetail version={multilineVersion} />);

    const detail = screen.getByTestId("detail");
    const markdown = detail.getAttribute("data-markdown");

    expect(markdown).toContain("- Change with\nmultiple\nlines");
    expect(markdown).toContain("- Regular change");
  });
});
