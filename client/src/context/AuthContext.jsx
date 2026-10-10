import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('seg_jwt_token');
    const savedUser = localStorage.getItem('seg_user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify with backend
        api.getMe()
          .then(res => {
            if (res.user) {
              setUser(res.user);
              localStorage.setItem('seg_user', JSON.stringify(res.user));
            }
          })
          .catch(() => {
            // Keep local cached user or logout if invalid
          })
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem('seg_jwt_token');
        localStorage.removeItem('seg_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('seg_jwt_token', data.token);
    localStorage.setItem('seg_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await api.register(name, email, password, role);
    localStorage.setItem('seg_jwt_token', data.token);
    localStorage.setItem('seg_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('seg_jwt_token');
    localStorage.removeItem('seg_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
