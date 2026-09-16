import { createContext, useContext, useMemo, useState } from 'react';

const TransferContext = createContext(null);

export function TransferProvider({ children }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [lastShare, setLastShare] = useState(null);

  const value = useMemo(
    () => ({
      selectedFile,
      setSelectedFile,
      clearSelectedFile() {
        setSelectedFile(null);
      },
      lastShare,
      setLastShare,
    }),
    [selectedFile, lastShare]
  );

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>;
}

export function useTransfer() {
  const context = useContext(TransferContext);
  if (!context) throw new Error('useTransfer must be used within TransferProvider');
  return context;
}
