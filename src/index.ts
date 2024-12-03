import * as path from "path";
import { fs, types, util } from "vortex-api";

import { 
  PATH_LAUNCH_DEF,
  FILE_LAUNCHER, FILE_GAME,
  ID_NEXUS, ID_MS,
  FILE_EXT_MOD, FILE_EXT_PACK, FILE_EXT_META,
  MOD_TYPE_DEF, MOD_TYPE_RES_PACK, MOD_TYPE_DAT_PACK, MOD_TYPE_SHA_PACK
} from "./common";

import { installMod, installResPack, installShaPack, installDataPack } from "./installers";

function findGame() {
  try {
    // I can't tell whether this works properly, but it can't hurt.
    return util.GameStoreHelper.findByAppId([ID_MS]).then((game) => game.gamePath);
  } catch (error) {
    try {
      fs.accessSync(path.join(PATH_LAUNCH_DEF, FILE_LAUNCHER), fs.constants.F_OK);

      return PATH_LAUNCH_DEF;
    } catch (error) {
      console.log("Minecraft was not found.");
    }
  }
}

function dataPath() {
  return path.join(util.getVortexPath("appData"), ".minecraft");
}

// Add some kind of check that the .minecraft directory is writeable. If not,
// whine to the user about it.

function modsPath() {
  return path.join(dataPath(), "mods");
}

function findExe(): string {
  return findGame() !== PATH_LAUNCH_DEF ? FILE_GAME : FILE_LAUNCHER;
}

function prepareForModding() {
  return fs.ensureDirAsync(modsPath());
}

function testMod(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, and that either the archive or a file in
  // the archive is a .jar file.
  let supported =
       gameID === ID_NEXUS
    && (path.extname(archive).toLowerCase() === FILE_EXT_MOD
    || path.extname(files[0]).toLowerCase() === FILE_EXT_MOD);

  return Promise.resolve({supported, requiredFiles: []});
}

function testResPackArch(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, that there is an "assets" folder, and
  // that it contains an .mcmeta file, or that there is a .zip within the .zip.
  let supported =
       gameID === ID_NEXUS
    && ((path.extname(archive).toLowerCase() === FILE_EXT_PACK
    && (files.find((file) => path.extname(file).toLowerCase() === FILE_EXT_META) !== undefined
    && files.find((file) => file.toLowerCase() === "assets\\") !== undefined))
    || files.find((file) => path.extname(file).toLowerCase() === FILE_EXT_PACK) !== undefined); 

  return Promise.resolve({supported, requiredFiles: []});
}

function testResPackLoose(files: string[], gameID: string, archive: string) {
  // Checking that it's not an archive in an archive.
  let supported =
       gameID === ID_NEXUS
    && !(path.extname(archive).toLowerCase() === FILE_EXT_MOD)
    && !(files.find((file) => path.extname(file).toLowerCase() === FILE_EXT_PACK) !== undefined); 

  return Promise.resolve({supported: false, requiredFiles: []});
}

function testShaPackArch(files: string[], gameID: string, archive: string) {
  // Check that the game is supported and that there is a "shaders" folder.
  let supported =
       gameID === ID_NEXUS
    && path.extname(archive).toLowerCase() === FILE_EXT_PACK
    && files.find((file) => file.toLowerCase() === "shaders\\") !== undefined;

  return Promise.resolve({supported, requiredFiles: []});
}

function testDatPackArch(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, that the archive isn't a .jar file, that
  // there is a "data" folder, and that it contains an .mcmeta file.
  let supported =
       gameID === ID_NEXUS
    && path.extname(archive).toLowerCase() === FILE_EXT_PACK
    && (files.find((file) => path.extname(file).toLowerCase() === FILE_EXT_META) !== undefined
    && files.find((file) => file.toLowerCase() === "data\\") !== undefined); 

  return Promise.resolve({supported: false, requiredFiles: []});
}

function main(context: types.IExtensionContext) {
  context.registerGame({
    id: ID_NEXUS,
    name: "Minecraft: Java Edition",
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: modsPath,
    logo: "gameart.jpg",
    executable: findExe,
    requiredFiles: [findExe()],
    setup: prepareForModding,
  });

  context.registerInstaller(MOD_TYPE_DEF, 25, testMod, installMod);
  context.registerInstaller(MOD_TYPE_RES_PACK, 25, testResPackArch, installResPack);
  // context.registerInstaller(MOD_TYPE_RES_PACK, 25, testResPackLoose, installResPackLoose);
  context.registerInstaller(MOD_TYPE_SHA_PACK, 25, testShaPackArch, installShaPack);
  // context.registerInstaller(MOD_TYPE_DAT_PACK, 25, testDatPackArch, installDataPackArch);

  context.registerModType(
    MOD_TYPE_DEF, 25, (gameID) => gameID === ID_NEXUS,
    modsPath, () => Promise.resolve(true),
    { name: "Default" }
  );
  context.registerModType(
    MOD_TYPE_RES_PACK, 25, (gameID) => gameID === ID_NEXUS,
    () => path.join(dataPath(), "resourcepacks"), () => Promise.resolve(true),
    { name: "Resource Pack" }
  );
  context.registerModType(
     MOD_TYPE_SHA_PACK, 25, (gameID) => gameID === ID_NEXUS,
     () => path.join(dataPath(), "shaderpacks"), () => Promise.resolve(true),
     { name: "Shader Pack" }
  );
  /* context.registerModType(
    MOD_TYPE_DATA_PACK, 25, (gameID) => gameID === ID_NEXUS,
    () => path.join(dataPath(), "saves", WORLD, "datapacks"), () => Promise.resolve(false),
    { name: "Data Pack" }
  ); */

  return true;
}

module.exports = {
  default: main
};