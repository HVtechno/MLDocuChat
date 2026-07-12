import { api } from "./client";

// --- Billing (Polar) ---
export const getSubscription = () => api.get("/billing/subscription");
export const createCheckout = () => api.post("/billing/create-checkout");

// --- Feedback ---
export const submitFeedback = (rating, comment) =>
  api.post("/feedback", { rating, comment });

// --- Admin (aggregate metrics) ---
export const getAdminMetrics = () => api.get("/admin/metrics");
