import { configureStore } from "@reduxjs/toolkit";
import userScorecardReducer from "./slices/userScorecard.slice";
import userTournamentReducer from "./slices/userTournament.slice";
import authReducer from "./slices/auth.slice";


export const store = configureStore({
  
  reducer: {
    userScoreCard: userScorecardReducer,
    userTournament: userTournamentReducer,
    auth: authReducer,
  },
  
});

// Types (important for TS)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;