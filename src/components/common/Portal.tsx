import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { View } from 'react-native';

type PortalEntry = { key: number; node: React.ReactNode };

type PortalContextType = {
  mount: (key: number, node: React.ReactNode) => void;
  update: (key: number, node: React.ReactNode) => void;
  unmount: (key: number) => void;
};

const PortalContext = createContext<PortalContextType | null>(null);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portals, setPortals] = useState<PortalEntry[]>([]);

  const api = useMemo<PortalContextType>(() => ({
    mount: (key, node) => setPortals(prev => [...prev, { key, node }]),
    update: (key, node) => setPortals(prev => prev.map(p => (p.key === key ? { key, node } : p))),
    unmount: (key) => setPortals(prev => prev.filter(p => p.key !== key)),
  }), []);

  return (
    <PortalContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {portals.map(p => (
          <React.Fragment key={p.key}>{p.node}</React.Fragment>
        ))}
      </View>
    </PortalContext.Provider>
  );
};

export const usePortalManager = () => {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('Portal components must be wrapped in PortalProvider');
  return ctx;
};

export const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const manager = usePortalManager();
  const keyRef = useRef<number>(Math.random());

  useEffect(() => {
    manager.mount(keyRef.current, children);
    return () => manager.unmount(keyRef.current);
  }, []);

  useEffect(() => {
    manager.update(keyRef.current, children);
  }, [children]);

  return null;
};


