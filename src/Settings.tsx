import React from "react";
import { ControlLabel, FormGroup, HelpBlock, Panel } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useSelector, useStore } from "react-redux";
import { Toggle, types } from "vortex-api";
import { setResourcePackExtraction } from "./actions";

function Settings() {

  const store = useStore();

  const resourcePackExtraction = useSelector((state: types.IState) =>
    state.settings["minecraft"]?.resourcePackExtraction);

  const setUseResourcePackExtraction = React.useCallback((enabled: boolean) => {
    store.dispatch(setResourcePackExtraction(enabled));
  }, []);
  
  const { t } = useTranslation();

  return (
    <form>
      <FormGroup controlId="default-disable">
        <Panel>
          <Panel.Body>
            <ControlLabel>{t("Minecraft: Java Edition")}</ControlLabel>
            <Toggle
              checked={resourcePackExtraction}
              onToggle={setUseResourcePackExtraction}
            >
              {t("Install resource packs as loose files by default")}
            </Toggle>
            <HelpBlock>
              {t(`If enabled, resource packs will be extracted on installation
              into loose files. This allows for more precise modding, but
              requires users to handle conflicts outside of Minecraft.`)}
            </HelpBlock>
          </Panel.Body>
        </Panel>
      </FormGroup>
    </form>
  );
}

export default Settings;