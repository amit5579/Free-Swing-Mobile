import { getScorecardHandicap, getScoreCardOpen } from "@/api/modules/scoreCard.api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

//  THUNKS (connect Redux → API)
export const fetchScoreCardOpen = createAsyncThunk(
  "scorecard/fetchOpen",
  async (tournamentId: number, thunkAPI) => {
    try {
      const rawScoreCardData = await getScoreCardOpen(tournamentId);
      // console.log("rawScoreCardData", rawScoreCardData);
      // const scorecardData = rawScoreCardData.map((h: any) => ({
      //   ...h
      //   ,
      //   score: null,
      //   netScore: null,
      //   stablefordPoints: null,
      // }));
      // return scorecardData;
      return rawScoreCardData;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchHandicap = createAsyncThunk(
  "scorecard/fetchHandicap",
  async (teeBoxId: number, thunkAPI) => {
    try {
      const handicapData = await getScorecardHandicap(teeBoxId);
      return handicapData;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const userScorecardSlice = createSlice({
  name: "userScorecard",
  initialState: {
    loading: false,
    scorecardData: null as any,
    handicapData: null as any,
    error: null as string | null,
  },
  reducers: {
    resetScorecardState: (state) => {
      state.scorecardData = null;
      state.handicapData = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchScoreCardOpen
      .addCase(fetchScoreCardOpen.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScoreCardOpen.fulfilled, (state, action) => {
        state.loading = false;
        state.scorecardData = action.payload;
      })
      .addCase(fetchScoreCardOpen.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchHandicap
      .addCase(fetchHandicap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHandicap.fulfilled, (state, action) => {
        state.loading = false;
        state.handicapData = action.payload;
      })
      .addCase(fetchHandicap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetScorecardState } = userScorecardSlice.actions;
export default userScorecardSlice.reducer;