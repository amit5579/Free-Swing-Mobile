import { getAddedPlayers, getMembersList } from "@/api/modules/admin/tournaments.api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


export const fetchMembers = createAsyncThunk(
  "userTournament/fetchMembers",
  async (_, thunkAPI) => {
    try {
      const members = await getMembersList() ;
      return members;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchAddedPlayers = createAsyncThunk(
  "userTournament/fetchAddedPlayers",
  async (tournamentId: number, thunkAPI) => {
    try {
      const addedPlayers = await getAddedPlayers(Number(tournamentId)) ;
      return addedPlayers;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const UserTournamentSlice = createSlice({
  name: "userTournament",
  initialState: {
    loading: false,
    membersData: [] as any[],
    addedPlayersData: [] as any[],
    error: null as string | null,
  },
  reducers: {
    resetUserTournamentState: (state) => {
      state.membersData = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchMembers
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.membersData = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAddedPlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddedPlayers.fulfilled, (state, action) => {
        state.loading = false;
        state.addedPlayersData = action.payload;
      })
      .addCase(fetchAddedPlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      ;
  },
});

export const { resetUserTournamentState } = UserTournamentSlice.actions;
export default UserTournamentSlice.reducer;