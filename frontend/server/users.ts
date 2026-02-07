// Client-side authentication functions
// These are now handled by the authClient directly in the components
// Keeping this file for backward compatibility but not using server actions

export const signIn = async (
  email: string, 
  password: string
) => {
  try {
    // This function is now deprecated in favor of authClient.signIn.email in components
    // The actual sign-in should be handled in the login/signup forms using authClient
    console.warn("signIn function is deprecated. Use authClient.signIn.email instead.");
    
    return {
      success: true,
      message: "Please use authClient.signIn.email in the login form.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const signUp = async (
   email: string,
   password: string,
   username: string
) => {
  try {
    // This function is now deprecated in favor of authClient.signUp.email in components
    // The actual sign-up should be handled in the signup form using authClient
    console.warn("signUp function is deprecated. Use authClient.signUp.email in the signup form.");
    
    return {
      success: true,
      message: "Please use authClient.signUp.email in the signup form.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};
