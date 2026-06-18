import { supabase } from './supabase';

export const setOnboardingCompleted = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    if (error) {
      console.error('Error saving onboarding status:', error);
    } else {
      console.log('✅ Onboarding marked as completed in database');
    }
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
};

export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    // Check if user has active session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    // Check onboarding_completed flag in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error reading onboarding status:', error);
      return false;
    }

    return profile?.onboarding_completed === true;
  } catch (error) {
    console.error('Error reading onboarding status:', error);
    return false;
  }
};

export const resetOnboarding = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No session found to reset');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: false })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error resetting onboarding status:', error);
    } else {
      console.log('✅ Onboarding reset in database');
    }
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
};
