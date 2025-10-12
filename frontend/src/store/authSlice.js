import { createSlice } from "@reduxjs/toolkit";

// Récupération sécurisée du token et de l'utilisateur depuis localStorage
const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");

let parsedUser = null;
try {
  parsedUser =
    storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
} catch (error) {
  console.warn(
    "Impossible de parser l'utilisateur depuis localStorage:",
    storedUser
  );
  parsedUser = null;
}

const initialState = {
  isAuthenticated: !!storedToken,
  token: storedToken || null,
  user: parsedUser,
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;

      // Sauvegarde dans localStorage
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;

      // Suppression du localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setAuthenticated, logout } = authSlice.actions;
export default authSlice.reducer;
