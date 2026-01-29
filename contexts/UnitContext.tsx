/**
 * Unit Preferences Context
 * Manages user preferences for weight and distance units
 * Persists to AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  UnitPreferences,
  DEFAULT_UNIT_PREFERENCES,
  WEIGHT_UNIT_KEY,
  DISTANCE_UNIT_KEY,
  WEIGHT_INCREMENT_KEY,
  DEFAULT_KG_INCREMENT,
  DEFAULT_LBS_INCREMENT,
} from "@/utils/units";

interface UnitContextType extends UnitPreferences {
  setWeightUnit: (unit: "kg" | "lbs") => Promise<void>;
  setDistanceUnit: (unit: "km" | "miles") => Promise<void>;
  setWeightIncrement: (increment: number) => Promise<void>;
  isLoading: boolean;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

interface UnitProviderProps {
  children: ReactNode;
}

export function UnitProvider({ children }: UnitProviderProps) {
  const [preferences, setPreferences] = useState<UnitPreferences>(
    DEFAULT_UNIT_PREFERENCES
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [weightUnit, distanceUnit, weightIncrementStr] = await Promise.all([
          AsyncStorage.getItem(WEIGHT_UNIT_KEY),
          AsyncStorage.getItem(DISTANCE_UNIT_KEY),
          AsyncStorage.getItem(WEIGHT_INCREMENT_KEY),
        ]);

        const loadedWeightUnit = weightUnit === "lbs" ? "lbs" : DEFAULT_UNIT_PREFERENCES.weightUnit;
        
        // Parse weight increment, use default based on unit if not set
        const defaultIncrement = loadedWeightUnit === "lbs" ? DEFAULT_LBS_INCREMENT : DEFAULT_KG_INCREMENT;
        const loadedIncrement = weightIncrementStr ? parseFloat(weightIncrementStr) : defaultIncrement;

        setPreferences({
          weightUnit: loadedWeightUnit,
          distanceUnit:
            distanceUnit === "miles"
              ? "miles"
              : DEFAULT_UNIT_PREFERENCES.distanceUnit,
          weightIncrement: isNaN(loadedIncrement) ? defaultIncrement : loadedIncrement,
        });
      } catch (error) {
        console.error("[UnitContext] Failed to load preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const setWeightUnit = async (unit: "kg" | "lbs") => {
    try {
      await AsyncStorage.setItem(WEIGHT_UNIT_KEY, unit);
      setPreferences((prev) => ({ ...prev, weightUnit: unit }));
    } catch (error) {
      console.error("[UnitContext] Failed to save weight unit:", error);
    }
  };

  const setDistanceUnit = async (unit: "km" | "miles") => {
    try {
      await AsyncStorage.setItem(DISTANCE_UNIT_KEY, unit);
      setPreferences((prev) => ({ ...prev, distanceUnit: unit }));
    } catch (error) {
      console.error("[UnitContext] Failed to save distance unit:", error);
    }
  };

  const setWeightIncrement = async (increment: number) => {
    try {
      await AsyncStorage.setItem(WEIGHT_INCREMENT_KEY, increment.toString());
      setPreferences((prev) => ({ ...prev, weightIncrement: increment }));
    } catch (error) {
      console.error("[UnitContext] Failed to save weight increment:", error);
    }
  };

  return (
    <UnitContext.Provider
      value={{
        ...preferences,
        setWeightUnit,
        setDistanceUnit,
        setWeightIncrement,
        isLoading,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits(): UnitContextType {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error("useUnits must be used within a UnitProvider");
  }
  return context;
}
