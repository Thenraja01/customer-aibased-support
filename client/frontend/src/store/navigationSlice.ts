import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NavigationState {
  /** Currently active page id (a `SidebarNavItem.id` from the portal config). */
  activePage: string | null;
  /** Optional params for the active page (e.g. detail pages). */
  params: Record<string, string>;
}

const initialState: NavigationState = {
  activePage: null,
  params: {},
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    setActivePage(
      state,
      action: PayloadAction<{ page: string | null; params?: Record<string, string> }>
    ) {
      state.activePage = action.payload.page;
      state.params = action.payload.params ?? {};
    },
  },
});

export const { setActivePage } = navigationSlice.actions;
export default navigationSlice.reducer;
