import axios from "axios";

export const isAuthenticated = async () => {
  try {
    const response = await axios.get("https://sharein-production.up.railway.app/api/auth/me", {
      withCredentials: true,
    });
    return response.data;
  } catch {
    return null;
  }
};
export const logout = async () => {
  try {
    await axios.post("https://sharein-production.up.railway.app/api/auth/logout", {}, { withCredentials: true, credentials: "include", });
  } catch (error) {
    console.error("Erreur lors du logout :", error);
  } finally {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("userLoggedOut"));
    localStorage.setItem("logout", Date.now());
    window.location.href = "https://share-in-1adx.vercel.app/login";
  }
};