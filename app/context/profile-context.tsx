'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { createClient } from '@supabase/supabase-js';

// Initialise Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Profile types
export interface UserProfile {
  id?: string;
  user_id: string;
  display_name: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  activity_level?: string;
  goal?: string;
  dietary_restrictions?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserGoals {
  id?: string;
  user_id: string;
  calorie_goal?: number;
  protein_goal?: number;
  carb_goal?: number;
  fat_goal?: number;
  plan_duration?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ProfileContextType {
  profile: UserProfile | null;
  goals: UserGoals | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateGoals: (data: Partial<UserGoals>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile and goals data
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setGoals(null);
      setLoading(false);
      return;
    }

    async function fetchUserData() {
      setLoading(true);
      setError(null);

      try {
        // Use the authenticated user data to create a profile
        // This avoids database errors while the schema is being set up
        
        // Create profile from auth user data
        const userProfile: UserProfile = {
          user_id: user?.id || '',
          display_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
          height: undefined,
          weight: undefined,
          age: undefined,
          gender: undefined,
          activity_level: undefined,
          goal: undefined,
          dietary_restrictions: undefined
        };
        
        setProfile(userProfile);
        
        // Create default goals
        const defaultGoals: UserGoals = {
          user_id: user?.id || '',
          calorie_goal: 2000, // Default values that can be changed by the user
          protein_goal: 150,
          carb_goal: 200,
          fat_goal: 65,
          plan_duration: 30
        };
        
        setGoals(defaultGoals);
        
        // Database calls are commented out until the tables are ready
        /*
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          setError('Failed to fetch profile data');
        } else {
          setProfile(profileData || {
            user_id: user.id,
            display_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          });
        }

        // Fetch user goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (goalsError && goalsError.code !== 'PGRST116') {
          console.error('Error fetching goals:', goalsError);
          setError((prev) => prev ? `${prev}, Failed to fetch goals data` : 'Failed to fetch goals data');
        } else {
          setGoals(goalsData || { user_id: user.id });
        }
        */
      } catch (err) {
        console.error('Error in profile context:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user]);

  // Update user profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;

    setLoading(true);
    setError(null);

    try {
      // For now, just update the local state since the database is not ready
      // This avoids errors while the database schema is being set up
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
      
      // Comment out the actual database call until the table is ready
      /*
      const updatedProfile = {
        ...profile,
        ...data,
        user_id: user.id,
        updated_at: new Date(),
      };

      // Check if profile exists
      if (profile?.id) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update(updatedProfile)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('user_profiles')
          .insert({ ...updatedProfile, created_at: new Date() });

        if (error) throw error;
      }

      // Fetch updated profile
      const { data: newProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      setProfile(newProfile);
      */
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Update user goals
  const updateGoals = async (data: Partial<UserGoals>) => {
    if (!user || !goals) return;

    setLoading(true);
    setError(null);

    try {
      // For now, just update the local state since the database is not ready
      // This avoids errors while the database schema is being set up
      setGoals((prev) => (prev ? { ...prev, ...data } : null));
      
      // Comment out the actual database call until the table is ready
      /*
      const updatedGoals = {
        ...goals,
        ...data,
        user_id: user.id,
        updated_at: new Date(),
      };

      // Check if goals exist
      if (goals?.id) {
        // Update existing goals
        const { error } = await supabase
          .from('user_goals')
          .update(updatedGoals)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new goals
        const { error } = await supabase
          .from('user_goals')
          .insert({ ...updatedGoals, created_at: new Date() });

        if (error) throw error;
      }

      // Fetch updated goals
      const { data: newGoals, error: fetchError } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      setGoals(newGoals);
      */
    } catch (err) {
      console.error('Error updating goals:', err);
      setError('Failed to update goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        goals,
        loading,
        error,
        updateProfile,
        updateGoals,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
