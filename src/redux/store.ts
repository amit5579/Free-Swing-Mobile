import { configureStore } from "@reduxjs/toolkit";
import userScorecardReducer from "./slices/userScorecard.slice";
import authReducer from "./slices/auth.slice";
export const store = configureStore({
  
  reducer: {
    // we will add slices here later
    userScoreCard: userScorecardReducer,
    auth: authReducer,
  },
  
});

// Types (important for TS)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;