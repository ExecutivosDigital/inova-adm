import { CookiesProvider } from "next-client-cookies/server";
import { ApiContextProvider } from "./ApiContext";
import { AuthProvider } from "./AuthContext";
import { SampleContextProvider } from "./SampleContext";

export function ContextProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CookiesProvider>
        <AuthProvider>
          <ApiContextProvider>
            <SampleContextProvider>
              {/* Any other Context Providers */}
              {children}
              {/* Any other Context Providers */}
            </SampleContextProvider>
          </ApiContextProvider>
        </AuthProvider>
      </CookiesProvider>
    </>
  );
}
