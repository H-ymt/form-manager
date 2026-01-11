import { type ClientResponse, hc } from "hono/client";

import type { AppType } from "@/server/api";

// APIクライアント
const baseClient = hc<AppType>("/");

// 型定義（APIの実際のレスポンスに基づく）
interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

interface CreateOrganizationInput {
  name: string;
  slug: string;
}

interface OrganizationsApi {
  $get: () => Promise<ClientResponse<Organization[]>>;
  $post: (options: {
    json: CreateOrganizationInput;
  }) => Promise<ClientResponse<Organization>>;
  [":id"]: {
    $get: (options: {
      param: { id: string };
    }) => Promise<ClientResponse<Organization>>;
    $put: (options: {
      param: { id: string };
      json: Partial<CreateOrganizationInput & { logoUrl: string | null }>;
    }) => Promise<ClientResponse<Organization>>;
    $delete: (options: {
      param: { id: string };
    }) => Promise<ClientResponse<null>>;
  };
}

// 拡張されたクライアント型
interface ExtendedClient {
  api: {
    platform: {
      organizations: OrganizationsApi;
    };
    admin: {
      health: {
        $get: () => Promise<ClientResponse<{ status: string }>>;
      };
      "form-fields": ReturnType<typeof hc>["api"];
      entries: ReturnType<typeof hc>["api"];
      "mail-templates": ReturnType<typeof hc>["api"];
      "csv-field-settings": ReturnType<typeof hc>["api"];
      "captcha-settings": ReturnType<typeof hc>["api"];
    };
  };
}

export const client = baseClient as unknown as typeof baseClient &
  ExtendedClient;
