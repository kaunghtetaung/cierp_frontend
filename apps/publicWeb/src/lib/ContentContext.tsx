import React, { createContext, useContext } from "react";

interface ContentContextType {
  contentSettings: any;
  themeName: string;
  contentError?: string | null;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({
  children,
  contentSettings,
  themeName,
  contentError,
}: {
  children: React.ReactNode;
  contentSettings: any;
  themeName: string;
  contentError?: string | null;
}) {
  return (
    <ContentContext.Provider
      value={{ contentSettings, themeName, contentError }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
}

export { ContentContext };
