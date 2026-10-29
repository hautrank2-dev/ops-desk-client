"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { LocationModel } from "@/types/location";
import { DepartmentModel } from "@/types/department";
import { httpClient } from "@/lib/httpClient";
import { TableResponse, UserRoleEnum } from "@/types";
import { AuthPayloadModel } from "@/types/auth";
import { LOCAL_KEYS } from "@/constants/local";

type AppContextValue = {
  authPayload: AuthPayloadModel | null;
  locations: LocationModel[];
  locationsMap: Record<string, LocationModel>;
  locationsLoading: boolean;
  refetchLocations: () => Promise<void>;
  departments: DepartmentModel[];
  departmentsMap: Record<string, DepartmentModel>;
  departmentsLoading: boolean;
  refetchDepartments: () => Promise<void>;
};

const AppContext = createContext<AppContextValue>({
  authPayload: null,
  locations: [],
  locationsMap: {},
  locationsLoading: false,
  refetchLocations: async () => { },
  departments: [],
  departmentsMap: {},
  departmentsLoading: false,
  refetchDepartments: async () => { },
});

const readAuthPayload = (): AuthPayloadModel | null => {
  try {
    const authJson = localStorage.getItem(LOCAL_KEYS.USER);
    if (typeof authJson === 'string') {
      const auth = JSON.parse(authJson);
      if (typeof auth === 'object') {
        const _id = auth._id;
        const username = auth.username;
        const role = auth.role;

        if (
          typeof _id === 'string' &&
          typeof username === 'string' &&
          (Object.values(UserRoleEnum) as string[]).includes(role)
        ) {
          return { _id, username, role } satisfies AuthPayloadModel;
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Đọc sau khi mount: lúc SSR không có localStorage, và render đầu trên
  // client phải khớp SSR (null) để không vỡ hydration.
  const [authPayload, setAuthPayload] = useState<AuthPayloadModel | null>(null);
  useEffect(() => {
    setAuthPayload(readAuthPayload());
  }, []);
  const [locations, setLocations] = useState<LocationModel[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentModel[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const refetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await httpClient.get<TableResponse<LocationModel>>("/location");
      setLocations(res.data.items);
    } catch { /* silent */ }
    finally { setLocationsLoading(false); }
  }, []);

  const refetchDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    try {
      const res = await httpClient.get<DepartmentModel[]>("/department");
      setDepartments(res.data);
    } catch { /* silent */ }
    finally { setDepartmentsLoading(false); }
  }, []);

  useEffect(() => {
    refetchLocations();
    refetchDepartments();
  }, [refetchLocations, refetchDepartments]);

  const locationsMap = locations.reduce<Record<string, LocationModel>>((acc, l) => { acc[l._id] = l; return acc; }, {});
  const departmentsMap = departments.reduce<Record<string, DepartmentModel>>((acc, d) => { acc[d._id] = d; return acc; }, {});

  return (
    <AppContext.Provider value={{
      locations, locationsMap, locationsLoading, refetchLocations,
      departments, departmentsMap, departmentsLoading, refetchDepartments,
      authPayload
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
