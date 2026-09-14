import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => {
  const Resend = vi.fn(function (this: any) {
    this.emails = { send: sendMock };
  });
  return { Resend };
});

import { notifyPasswordChanged } from "@/lib/email";

describe("notifyPasswordChanged", () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "re_test_key";
  });

  it("sends a notice to the user's own email", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });

    await notifyPasswordChanged("user@example.com");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.subject).toContain("contraseña");
  });

  it("does nothing when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    await notifyPasswordChanged("user@example.com");

    expect(sendMock).not.toHaveBeenCalled();
  });
});
