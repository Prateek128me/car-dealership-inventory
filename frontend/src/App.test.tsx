import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { request, ApiError } from "./api";

const vehicle = {
  id: 1,
  make: "Toyota",
  model: "Camry",
  category: "Sedan",
  price: "1000000.25",
  quantity: 2,
};
const session = (role = "user") => ({
  access_token: "test-token",
  user: { id: 1, email: "buyer@example.com", role },
});
const response = (data: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => data,
});

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      response(url.includes("/auth/") ? session() : [vehicle]),
    ),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
});
afterEach(() => vi.unstubAllGlobals());

async function login() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "buyer@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password123!" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "Sign in" }).closest("form")!,
  );
  await screen.findByText("Camry");
}

describe("application workflows", () => {
  it("registers, displays inventory, applies filters and signs out", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password123!" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Create account" }).closest("form")!,
    );
    await screen.findByText("Camry");
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({ method: "POST" }),
    );
    fireEvent.change(screen.getByLabelText("Make"), {
      target: { value: "Toyota" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/vehicles/search?make=Toyota",
        expect.anything(),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Electric" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/vehicles/search?make=Toyota&category=Electric",
        expect.anything(),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    await screen.findByText("Camry");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(
      screen.getByRole("heading", { name: "Welcome back." }),
    ).toBeInTheDocument();
  });

  it("reports login errors", async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({ detail: "Invalid email or password" }, 401) as Response,
    );
    render(<App />);
    fireEvent.submit(
      screen.getByRole("button", { name: "Sign in" }).closest("form")!,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
  });

  it("purchases and refreshes stock", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/auth/")) return response(session());
        if (url.endsWith("/purchase"))
          return response({ ...vehicle, quantity: 1 });
        return response([vehicle]);
      }),
    );
    render(<App />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: "Purchase vehicle" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("purchased"),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles/1/purchase",
      expect.objectContaining({ method: "POST" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByText(/One unit removed/)).not.toBeInTheDocument();
  });

  it("handles empty searches and expired authentication", async () => {
    render(<App />);
    await login();
    vi.mocked(fetch).mockResolvedValue(response([]) as Response);
    fireEvent.click(screen.getByRole("button", { name: "SUV" }));
    await screen.findByRole("heading", { name: "No vehicles found" });
    vi.mocked(fetch).mockResolvedValue(
      response({ detail: "Expired" }, 401) as Response,
    );
    fireEvent.click(screen.getByRole("button", { name: "All vehicles" }));
    await screen.findByRole("heading", { name: "Welcome back." });
    expect(screen.getByRole("status")).toHaveTextContent("session expired");
  });

  it("shows an API outage with retry", async () => {
    render(<App />);
    await login();
    vi.mocked(fetch).mockRejectedValue(new Error("Network unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "SUV" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent("Network unavailable");
    vi.mocked(fetch).mockResolvedValue(response([vehicle]) as Response);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });

  it("submits admin add, edit, restock and delete dialogs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: RequestInit) => {
        if (url.includes("/auth/")) return response(session("admin"));
        if (options?.method === "DELETE") return response(null, 204);
        if (options?.method) return response(vehicle);
        return response([vehicle]);
      }),
    );
    render(<App />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: "Add vehicle" }));
    let dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Make"), {
      target: { value: "Toyota" },
    });
    fireEvent.change(dialog.getByLabelText("Model"), {
      target: { value: "Camry" },
    });
    fireEvent.change(dialog.getByLabelText("Price (₹)"), {
      target: { value: "1000000" },
    });
    fireEvent.submit(
      dialog.getByRole("button", { name: "Save vehicle" }).closest("form")!,
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    for (const [action, submit] of [
      ["Edit", "Save vehicle"],
      ["Restock", "Add stock"],
      ["Delete", "Delete vehicle"],
    ]) {
      fireEvent.click(screen.getByRole("button", { name: action }));
      dialog = within(screen.getByRole("dialog"));
      fireEvent.submit(
        dialog.getByRole("button", { name: submit }).closest("form")!,
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    }
    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles/1/restock",
      expect.objectContaining({ method: "POST", body: '{"quantity":1}' }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("keeps failed admin forms open for correction", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: RequestInit) => {
        if (url.includes("/auth/")) return response(session("admin"));
        if (options?.method)
          return response({ detail: "Stock limit exceeded" }, 409);
        return response([vehicle]);
      }),
    );
    render(<App />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: "Restock" }));
    fireEvent.submit(
      screen.getByRole("button", { name: "Add stock" }).closest("form")!,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Stock limit exceeded",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("API error formatting", () => {
  it("formats field validation failures", async () => {
    vi.mocked(fetch).mockResolvedValue(
      response(
        { detail: [{ loc: ["body", "price"], msg: "Must be positive" }] },
        422,
      ) as Response,
    );
    await expect(request("/vehicles")).rejects.toThrow(
      "price: Must be positive",
    );
  });
  it("handles non-JSON error responses", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error();
      },
    } as unknown as Response);
    await expect(request("/vehicles")).rejects.toEqual(
      new ApiError(502, "Request failed (502)"),
    );
  });
});
