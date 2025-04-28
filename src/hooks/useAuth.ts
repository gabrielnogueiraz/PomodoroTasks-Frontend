import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

interface LoginDTO {
  email: string;
  password: string;
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const signIn = useCallback(async (data: LoginDTO) => {
    setIsLoading(true);
    try {
      await authService.login(data);
      navigate('/tasks');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return {
    signIn,
    isLoading
  };
} 