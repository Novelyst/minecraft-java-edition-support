import * as path from "path";
import { fs, types, util } from "vortex-api";

const GAME_ID = "minecraft";

// I don't know if this is the proper Microsoft Store ID, but I looked through
// the registry and a bit and searched around online and couldn't find something
// that looked more like the MS_ID of Skyrim SE, "BethesdaSoftworks.SkyrimSE-PC"
// so until I get told otherwise, I'll leave it at this.
const MS_ID = "Microsoft.4297127D64EC6";

const MOD_FILE_EXT = ".jar";
const RESOURCE_PACK_FILE_EXT = ".mcmeta";

function findGame() {
  try {
    return util.GameStoreHelper.findByAppId([MS_ID]).then(
      (game) => game.gamePath,
    );
  } catch (error) {
    // We're checking for the default install location of the legacy
    // installer. I don't know where I'd find this path in the registry.
    const LAUNCHER_DEFAULT =
      "C:\\Program Files (x86)\\Minecraft Launcher\\MinecraftLauncher.exe";

    try {
      fs.accessSync(LAUNCHER_DEFAULT, fs.constants.F_OK);
      return LAUNCHER_DEFAULT;
    } catch (error) {
      throw new Error("no file exists");
    }
  }
}

function dataPath() {
  return path.join(util.getVortexPath("appData"), "Roaming", ".minecraft");
}

function modsPath() {
  return path.join(dataPath(), "~mods");
}

function prepareForModding() {
  return fs.ensureDirAsync(modsPath());
}

function isResourcePack(api: types.IExtensionApi, files: types.IInstruction[]) {
  // If I'm understanding the parameter of registerModType correctly, I should
  // be checking for a .zip file here.
}

// We're checking for a .jar file.
function testMod(files: string[], gameID: string) {
  let supported =
    gameID === GAME_ID &&
    files.find((file) => path.extname(file).toLowerCase() === MOD_FILE_EXT) !==
      undefined;

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

// Here we just want the .mcmeta file.
function testResourcePack(files: string[], gameID: string) {
  let supported =
    gameID === GAME_ID &&
    files.find(
      (file) => path.extname(file).toLowerCase() === RESOURCE_PACK_FILE_EXT,
    ) !== undefined;

  return Promise.resolve({
    supported: true,
    requiredFiles: [],
  });
}

// I confess I still have no idea what's going on here. This is copied from
// Picky/Mike's implementation, and since I just wanted to do the same thing
// he was doing but with .pak files, I figured I'd be fine.
function installMod(
  files: string[],
  destinationPath: string,
  gameId: string,
  progressDelegate: types.ProgressDelegate,
) {
  const modFile = files.find(
    (file) => path.extname(file).toLowerCase() === MOD_FILE_EXT,
  );
  const index = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);

  const filtered = files.filter(
    (file) => file.indexOf(rootPath) !== -1 && !file.endsWith(path.sep),
  );

  const instructions = filtered.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: path.join(file.substr(index)),
    };
  });

  return Promise.resolve({ instructions });
}

// Here I've still got to figure out how to make it install the archive as an
// archive. Probably going to reference Creative's extension for this?
function installResourcePack(
  files: string[],
  destinationPath: string,
  gameId: string,
  progressDelegate: types.ProgressDelegate,
) {
  const modtypeAttr = { type: "setmodtype", value: "resource-pack" };

  const instructions = "";

  return Promise.resolve({ instructions });
}

function main(context: types.IExtensionContext) {
  context.registerGame({
    id: GAME_ID,
    name: "Minecraft: Java Edition",
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: modsPath,
    logo: "gameart.jpg",
    executable: () => "MinecraftLauncher.exe",
    requiredFiles: ["MinecraftLauncher.exe"],
    setup: prepareForModding,
  });

  context.registerInstaller("minecraft-mod", 25, testMod, installMod);
  context.registerInstaller(
    "resource-pack",
    25,
    testResourcePack,
    installResourcePack,
  );
  context.registerModType(
    "resource-pack",
    25,
    (gameID) => gameID === GAME_ID,
    () => path.join(dataPath(), "resourcepacks"),
    (instructions) => isResourcePack(context.api, instructions),
    { name: "Resource Pack" },
  );

  return true;
}

module.exports = {
  default: main,
};
