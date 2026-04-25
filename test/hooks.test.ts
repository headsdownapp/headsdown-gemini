import { describe, it, expect, vi } from "vitest";
import { handleSessionStart } from "../src/hooks/session-start.js";
import { handleBeforeTool } from "../src/hooks/check-availability.js";
import { HeadsDownClient, ProposalStateStore } from "@headsdown/sdk";

vi.mock("@headsdown/sdk", async () => {
  const actual = await vi.importActual("@headsdown/sdk");
  return {
    ...actual,
    HeadsDownClient: {
      fromCredentials: vi.fn()
    },
    ProposalStateStore: vi.fn(),
    describeExecutionDirective: undefined
  };
});

describe("Hooks", () => {
  describe("SessionStart", () => {
    it("returns summary when contract exists", async () => {
      vi.mocked(HeadsDownClient.fromCredentials).mockResolvedValue({
        getAvailability: vi.fn().mockResolvedValue({
          contract: { mode: "busy", statusText: "Deep work" },
          schedule: {
            inReachableHours: true,
            wrapUpGuidance: { active: true, remainingMinutes: 12, selectedMode: "wrap_up" }
          }
        })
      } as any);

      const result = await handleSessionStart();
      expect(result?.systemMessage).toContain("busy");
      expect(result?.systemMessage).toContain("Deep work");
      expect(result?.systemMessage).toContain("Wrap-Up instruction");
      expect(result?.systemMessage).toContain("Execution policy for this task");
    });

    it("returns null when no contract exists", async () => {
      vi.mocked(HeadsDownClient.fromCredentials).mockResolvedValue({
        getAvailability: vi.fn().mockResolvedValue({
          contract: null,
          schedule: { inReachableHours: false, nextWindow: null }
        })
      } as any);

      const result = await handleSessionStart();
      expect(result).toBeNull();
    });
  });

  describe("BeforeTool", () => {
    it("allows non-modification tools", async () => {
      const result = await handleBeforeTool({ tool_name: "list_directory" });
      expect(result.decision).toBe("allow");
    });

    it("denies write_file in busy mode without proposal", async () => {
      vi.mocked(HeadsDownClient.fromCredentials).mockResolvedValue({
        getAvailability: vi.fn().mockResolvedValue({
          contract: { mode: "busy" }
        })
      } as any);

      vi.mocked(ProposalStateStore).mockImplementation(() => ({
        hasApprovedProposal: vi.fn().mockResolvedValue(false)
      } as any));

      const result = await handleBeforeTool({ tool_name: "write_file" });
      expect(result.decision).toBe("deny");
      expect(result.reason).toContain("submit a task proposal");
    });

    it("allows write_file in busy mode with approved proposal", async () => {
      vi.mocked(HeadsDownClient.fromCredentials).mockResolvedValue({
        getAvailability: vi.fn().mockResolvedValue({
          contract: { mode: "busy" }
        })
      } as any);

      vi.mocked(ProposalStateStore).mockImplementation(() => ({
        hasApprovedProposal: vi.fn().mockResolvedValue(true)
      } as any));

      const result = await handleBeforeTool({ tool_name: "write_file" });
      expect(result.decision).toBe("allow");
      expect(result.systemMessage).toContain("proposal approved");
    });
  });
});
