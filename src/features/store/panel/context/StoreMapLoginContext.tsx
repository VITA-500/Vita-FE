"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type StoreMapLoginContextValue = {
  beforeLogin: (() => void) | null;
  setBeforeLogin: (callback: (() => void) | null) => void;
};

const StoreMapLoginContext = createContext<StoreMapLoginContextValue | null>(
  null,
);

export const StoreMapLoginProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [beforeLogin, setBeforeLogin] = useState<(() => void) | null>(null);
  const registerBeforeLogin = useCallback((callback: (() => void) | null) => {
    // React setter에 함수를 그대로 넘기면 updater로 실행하므로,
    // 콜백 자체를 상태값으로 보관하도록 한 번 감싼다.
    setBeforeLogin(() => callback);
  }, []);
  const value = useMemo(
    () => ({ beforeLogin, setBeforeLogin: registerBeforeLogin }),
    [beforeLogin, registerBeforeLogin],
  );

  return (
    <StoreMapLoginContext.Provider value={value}>
      {children}
    </StoreMapLoginContext.Provider>
  );
};

export const useStoreMapLogin = () => {
  const context = useContext(StoreMapLoginContext);

  return (
    context ?? {
      beforeLogin: null,
      setBeforeLogin: () => undefined,
    }
  );
};
