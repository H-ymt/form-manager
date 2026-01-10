import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { formFieldsRoutes } from "./routes/form-fields";
import { entriesRoutes } from "./routes/entries";
import { mailTemplatesRoutes } from "./routes/mail-templates";
import { csvFieldSettingsRoutes } from "./routes/csv-field-settings";
import { captchaSettingsRoutes } from "./routes/captcha-settings";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono().basePath("/api/admin");

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use("*", authMiddleware);
app.onError(errorHandler);

// Routes
app.route("/form-fields", formFieldsRoutes);
app.route("/entries", entriesRoutes);
app.route("/mail-templates", mailTemplatesRoutes);
app.route("/csv-field-settings", csvFieldSettingsRoutes);
app.route("/captcha-settings", captchaSettingsRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
export type AppType = typeof app;
