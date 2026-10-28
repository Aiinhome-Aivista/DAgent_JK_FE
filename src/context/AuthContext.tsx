import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  userId: number | null;
  userName: string | null;
  roleId: number | null;
  roleName: string | null;
  setUserId: (id: number | null) => void;
  setUserName: (name: string | null) => void;
  setRoleId: (id: number | null) => void;
  setRoleName: (name: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('DAgent_user_id');
    return stored ? parseInt(stored, 10) : null;
  });

  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem('DAgent_user_name');
  });

  const [roleId, setRoleId] = useState<number | null>(() => {
    const stored = localStorage.getItem('DAgent_role_id');
    return stored ? parseInt(stored, 10) : null;
  });

  const [roleName, setRoleName] = useState<string | null>(() => {
    return localStorage.getItem('DAgent_role_name');
  });

  const handleSetUserId = (id: number | null) => {
    setUserId(id);
    if (id !== null) {
      localStorage.setItem('DAgent_user_id', id.toString());
    } else {
      localStorage.removeItem('DAgent_user_id');
    }
  };

  const handleSetUserName = (name: string | null) => {
    setUserName(name);
    if (name !== null) {
      localStorage.setItem('DAgent_user_name', name);
    } else {
      localStorage.removeItem('DAgent_user_name');
    }
  };

  const handleSetRoleId = (id: number | null) => {
    setRoleId(id);
    if (id !== null) {
      localStorage.setItem('DAgent_role_id', id.toString());
    } else {
      localStorage.removeItem('DAgent_role_id');
    }
  };

  const handleSetRoleName = (name: string | null) => {
    setRoleName(name);
    if (name !== null) {
      localStorage.setItem('DAgent_role_name', name);
    } else {
      localStorage.removeItem('DAgent_role_name');
    }
  };

  const logout = () => {
    setUserId(null);
    setUserName(null);
    setRoleId(null);
    setRoleName(null);
    localStorage.removeItem('DAgent_user_id');
    localStorage.removeItem('DAgent_user_name');
    localStorage.removeItem('DAgent_role_id');
    localStorage.removeItem('DAgent_role_name');
  };

  return (
    <AuthContext.Provider value={{ userId, userName, roleId, roleName, setUserId: handleSetUserId, setUserName: handleSetUserName, setRoleId: handleSetRoleId, setRoleName: handleSetRoleName, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
