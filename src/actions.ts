import { createAction } from "redux-act";

export const setResourcePackExtraction = createAction("MCJE_SETTINGS_RES_PACK_EXTRACTION", (enabled: boolean) => enabled);