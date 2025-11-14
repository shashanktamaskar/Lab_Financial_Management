// Mock authentication hook for demo
export function useAuth() {
  return {
    user: {
      id: "demo-user",
      email: "demo@lab.com",
      name: "Demo User",
    },
    logout: () => {
      console.log("Logout called");
    },
    isAuthenticated: true,
  };
}
