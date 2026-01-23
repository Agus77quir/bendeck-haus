import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const navigate = useNavigate();
  const { 
    user, 
    session, 
    isAdmin, 
    userBusiness, 
    isLoading,
    setUser, 
    setSession, 
    setIsAdmin, 
    setUserBusiness, 
    setIsLoading,
    reset 
  } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setUserBusiness(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      setIsAdmin(roleData?.role === 'admin');

      // Fetch user profile for business
      const { data: profileData } = await supabase
        .from('profiles')
        .select('business')
        .eq('id', userId)
        .single();

      setUserBusiness(profileData?.business ?? null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/');
  };

  return {
    user,
    session,
    isAdmin,
    userBusiness,
    isLoading,
    signOut,
  };
};
