import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  inviteCode: null,
  baby: null,
  isAuthenticated: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS': {
      const { token, user, baby, inviteCode } = action.payload;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (baby) localStorage.setItem('baby', JSON.stringify(baby));
      if (inviteCode) localStorage.setItem('inviteCode', inviteCode);
      return {
        ...state,
        token,
        user,
        baby: baby || state.baby,
        inviteCode: inviteCode || state.inviteCode,
        isAuthenticated: true,
        loading: false,
      };
    }
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('baby');
      localStorage.removeItem('inviteCode');
      return {
        ...initialState,
        loading: false,
      };
    case 'SET_BABY':
      return { ...state, baby: action.payload };
    case 'INIT_DONE':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化时从 localStorage 恢复登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const babyStr = localStorage.getItem('baby');
    const inviteCode = localStorage.getItem('inviteCode');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const baby = babyStr ? JSON.parse(babyStr) : null;
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, user, baby, inviteCode },
        });
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    } else {
      dispatch({ type: 'INIT_DONE' });
    }
  }, []);

  const login = (data) => dispatch({ type: 'LOGIN_SUCCESS', payload: data });
  const register = (data) => dispatch({ type: 'REGISTER_SUCCESS', payload: data });
  const logout = () => dispatch({ type: 'LOGOUT' });
  const setBaby = (baby) => dispatch({ type: 'SET_BABY', payload: baby });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setBaby }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
