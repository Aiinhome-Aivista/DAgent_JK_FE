import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminService } from '../services/admin.service';

interface AuthContextType {
  userId: number | null;
  userName: string | null;
  roleId: number | null;
  roleName: string | null;
  visibility: number | null;
  setUserId: (id: number | null) => void;
  setUserName: (name: string | null) => void;
  setRoleId: (id: number | null) => void;
  setRoleName: (name: string | null) => void;
  setVisibility: (vis: number | null) => void;
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

  const [visibility, setVisibilityState] = useState<number | null>(() => {
    const stored = localStorage.getItem('DAgent_user_visibility');
    return stored ? parseInt(stored, 10) : null;
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

  const handleSetVisibility = (vis: number | null) => {
    setVisibilityState(vis);
    if (vis !== null) {
      localStorage.setItem('DAgent_user_visibility', vis.toString());
    } else {
      localStorage.removeItem('DAgent_user_visibility');
    }
  };

  useEffect(() => {
    // If user is logged in but visibility is not yet saved, fetch user's record
    if (userId && visibility === null) {
      adminService.getUsers().then(res => {
        if (res?.data && Array.isArray(res.data)) {
          const me = res.data.find((u: any) => u.id === userId);
          if (me && me.visibility !== undefined) {
            handleSetVisibility(me.visibility);
          }
        }
      }).catch(() => {});
    }
  }, [userId, visibility]);

  const logout = () => {
    setUserId(null);
    setUserName(null);
    setRoleId(null);
    setRoleName(null);
    setVisibilityState(null);
    localStorage.removeItem('DAgent_user_id');
    localStorage.removeItem('DAgent_user_name');
    localStorage.removeItem('DAgent_role_id');
    localStorage.removeItem('DAgent_role_name');
    localStorage.removeItem('DAgent_user_visibility');
  };

  return (
    <AuthContext.Provider value={{
      userId,
      userName,
      roleId,
      roleName,
      visibility,
      setUserId: handleSetUserId,
      setUserName: handleSetUserName,
      setRoleId: handleSetRoleId,
      setRoleName: handleSetRoleName,
      setVisibility: handleSetVisibility,
      logout
    }}>
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
