import { initializeSchema } from "@/db/database";
import { SQLiteProvider } from "expo-sqlite";
import React, { createContext, useContext, useState } from "react";

interface DatabaseContextType {
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
});

function DatabaseReadyProvider({ children }: { children: React.ReactNode }) {
  // If we get here, SQLiteProvider has initialized the database
  return (
    <DatabaseContext.Provider value={{ isReady: true }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [initError, setInitError] = useState<Error | null>(null);

  if (initError) {
    console.error("Database initialization failed:", initError);
  }

  return (
    <SQLiteProvider
      databaseName="workout.db"
      onInit={initializeSchema}
      onError={(error) => {
        console.error("SQLiteProvider error:", error);
        setInitError(error);
      }}
    >
      <DatabaseReadyProvider>{children}</DatabaseReadyProvider>
    </SQLiteProvider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
