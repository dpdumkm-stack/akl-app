import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CombinedPdfButton from "./CombinedPdfButton";
import { ToastProvider } from "@/context/ToastContext";

// Mock window.URL.createObjectURL and window.URL.revokeObjectURL
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

describe("CombinedPdfButton", () => {
  const props = {
    quotationId: "q123",
    invoiceId: "i456",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders correctly with Indonesian text", () => {
    render(
      <ToastProvider>
        <CombinedPdfButton {...props} />
      </ToastProvider>
    );
    expect(screen.getByText(/Unduh PDF Gabungan/i)).toBeInTheDocument();
  });

  it("shows loading state when clicked", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              blob: () => Promise.resolve(new Blob()),
              headers: { get: () => null },
            }),
          100
        )
      )
    );

    render(
      <ToastProvider>
        <CombinedPdfButton {...props} />
      </ToastProvider>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByText(/Mengunduh…/i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("shows error toast when fetch fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    render(
      <ToastProvider>
        <CombinedPdfButton {...props} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      // Check if toast is rendered. Our ToastContext renders a div with the message.
      expect(screen.getByText(/Gagal mengunduh PDF gabungan/i)).toBeInTheDocument();
    });
  });
});
