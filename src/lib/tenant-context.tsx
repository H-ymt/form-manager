"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Organization } from "@/server/db/schema";

interface TenantContextType {
  organization: Organization | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  organization: Organization | null;
}

export function TenantProvider({
  children,
  organization,
}: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ organization, isLoading: false }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

export function useOrganizationId() {
  const { organization } = useTenant();
  if (!organization) {
    throw new Error("Organization not found in tenant context");
  }
  return organization.id;
}
