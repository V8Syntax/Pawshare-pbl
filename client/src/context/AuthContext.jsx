import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth as authApi } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    authApi.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const finish = useCallback((data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = async (email, password) => finish(await authApi.login({ email, password }));
  const register = async (payload) => finish(await authApi.register(payload));
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  const refresh = async () => setUser((await authApi.me()).user);

  const isProvider = user && ['shelter', 'caregiver', 'admin'].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, isProvider }}>
      {children}
    </AuthContext.Provider>
  );
}
