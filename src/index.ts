import * as path from "path";
import { useSelector, useStore } from "react-redux";
import { fs, types, util } from "vortex-api";
import { IExtensionApi, IInstruction } from "vortex-api/lib/types/IExtensionContext";
import * as actions from "./actions";

const LAUNCH_DEF = "C:/Program Files (x86)/Minecraft Launcher";

const GAME_ID = "minecraft";
const MS_ID = "Microsoft.4297127D64EC6";

function findGame() {
  try {
    // I can't tell whether this works properly, but it can't hurt.
    return util.GameStoreHelper.findByAppId([MS_ID]).then((game) => game.gamePath);
  } catch (error) {
    try {
      fs.accessSync(path.join(LAUNCH_DEF, "MinecraftLauncher.exe"), fs.constants.F_OK);

      return LAUNCH_DEF;
    } catch (error) {
      console.log("Minecraft was not found.");
    }
  }
}

function dataPath() {
  return path.join(util.getVortexPath("appData"), GAME_ID);
}

// Add some kind of check that the .minecraft directory is writeable. If not,
// whine to the user about it.

function modsPath() {
  return path.join(dataPath(), "mods");
}

function findExe(): string {
  return findGame() !== LAUNCH_DEF ? "Minecraft.exe" : "MinecraftLauncher.exe";
}

function prepareForModding() {
  return fs.ensureDirAsync(modsPath());
}

function isResPackLoose(_api: IExtensionApi, _instructions: IInstruction[]): Promise<boolean> {
  const userPref: boolean = useSelector((state: types.IState) => {
    return state.settings[GAME_ID]?.resourcePackExtraction;
  });
  
  return userPref !== null ? Promise.resolve(userPref) : Promise.resolve(false);
}

function testMod(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, and that either the archive or a file in
  // the archive is a .jar file.
  let supported =
       gameID === GAME_ID
    && (path.extname(archive).toLowerCase() === ".jar"
    || path.extname(files[0]).toLowerCase() === ".jar");

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function testResPackLoose(files: string[], gameID: string, archive: string) {
  // Checking that it's not an archive in an archive.
  let supported =
       gameID === GAME_ID
    && !(path.extname(archive).toLowerCase() === ".jar")
    && !(files.find((file) => path.extname(file).toLowerCase() === ".zip") !== undefined); 

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function testResPackArch(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, that the archive isn't a .jar file, and
  // that it contains an .mcmeta file.
  let supported =
       gameID === GAME_ID
    && !(path.extname(archive).toLowerCase() === ".jar")
    && (files.find((file) => path.extname(file).toLowerCase() === ".mcmeta") !== undefined
    || files.find((file) => path.extname(file).toLowerCase() === ".zip") !== undefined); 

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function installMod(
  files: string[],
  _destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate,
  _choices: any,
  _unattended: any,
  archivePath: string
): Promise<types.IInstallResult> {
  if (files.length === 1) {
    const filePath = files[0];
    const instructions: types.IInstruction[] = [
      {    
        type: "copy",
        source: filePath,
        destination: path.basename(filePath)
      }
    ];

    return Promise.resolve({ instructions });
  } else {
    // The new, magical method?
    const archive: string = fs.readFileAsync(archivePath);

    const instructions: types.IInstruction[] = [{
      type: "generatefile",
      data: archive,
      destination: path.basename(archivePath)
    }];

    return Promise.resolve({ instructions });
  }
}

function installResPackLoose(
  files: string[],
  _destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate
): Promise<types.IInstallResult> {
  const modtypeAttr: types.IInstruction = {
    type: "setmodtype", value: "resource-pack"
  };
  
  const instructions: types.IInstruction[] = files.reduce(
    (accum: types.IInstruction[], filePath: string) => {    
      accum.push({
        type: "copy",
        source: filePath,
        destination: path.basename(filePath)
      });

      return accum;
    }, [ modtypeAttr ]
  );

  return Promise.resolve({ instructions });
}

function installResPackArch(
  files: string[],
  _destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate,
  _choices: any,
  _unattended: any,
  archivePath: string
): Promise<types.IInstallResult> {
  const modtypeAttr: types.IInstruction = {
    type: "setmodtype", value: "resource-pack"
  };

  if (files.length === 1) {
    const instructions: types.IInstruction[] = files.reduce(
      (accum: types.IInstruction[], filePath: string) => {    
        accum.push({
          type: "copy",
          source: filePath,
          destination: path.basename(filePath)
        });
  
        return accum;
      }, [ modtypeAttr ]
    );

    return Promise.resolve({ instructions });
  } else {
    // Same goes here.
    const archive: string = fs.readFileAsync(archivePath);

    const instructions: types.IInstruction[] = [{
      type: "generatefile",
      data: archive,
      destination: path.basename(archivePath)
    }];

    return Promise.resolve({ instructions });
  }
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
    executable: findExe,
    requiredFiles: [findExe()],
    setup: prepareForModding,
  });
  context.registerInstaller("minecraft-mod", 25, testMod, installMod);
  context.registerInstaller("resource-pack", 25, testResPackLoose, installResPackLoose);
  context.registerInstaller("resource-pack", 25, testResPackArch, installResPackArch);
  context.registerModType(
    "minecraft-mod", 25, (gameID) => gameID === GAME_ID,
    modsPath,
    () => true,
    { name: "Default" }
  );
  context.registerModType(
    "resource-pack", 25, (gameID) => gameID === GAME_ID,
    () => path.join(dataPath(), "resourcepacks"),
    instructions => isResPackLoose(context.api, instructions),
    { name: "Resource Pack" }
  );

  return true;
}

module.exports = {
  default: main
};