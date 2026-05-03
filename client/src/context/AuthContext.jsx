import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'AUTH_FAILURE':
      return { ...state, user: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const res = await api.get('/auth/me');
          const user = res.data.data;
          localStorage.setItem('user', JSON.stringify(user));
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, ...user } = res.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token, ...user } = res.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
