import * as path from "path";
import { fs, types, util } from "vortex-api";
import { IExtensionApi, IInstruction } from "vortex-api/lib/types/IExtensionContext";

const GAME_ID = "minecraft";
const MS_ID = "Microsoft.4297127D64EC6";

const LAUNCH_DEF = "C:/Program Files (x86)/Minecraft Launcher";
const SETTINGS = "./settings.json";

const WIN_EXE = "Minecraft.exe";
const LEG_EXE = "MinecraftLauncher.exe";

const MOD_FILE_EXT = ".jar";
const RES_PACK_FILE_EXT = ".mcmeta";
const RES_PACK_ARCH_EXT = ".zip";

function findGame() {
  try {
    // I can't tell whether this works properly, but it can't hurt.
    return util.GameStoreHelper.findByAppId([MS_ID]).then((game) => game.gamePath);
  } catch (error) {
    try {
      fs.accessSync(path.join(LAUNCH_DEF, LEG_EXE), fs.constants.F_OK);

      return LAUNCH_DEF;
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
  return findGame() !== LAUNCH_DEF ? WIN_EXE : LEG_EXE;
}

function prepareForModding() {
  return fs.ensureDirAsync(modsPath());
}

function isResPackLoose(api: IExtensionApi, instructions: IInstruction[]): Promise<boolean> {
  const userPref = JSON.parse(fs.readFileAsync(SETTINGS, { encoding: "utf8" }));
  
  if (userPref.extractResourcePacks !== null) {
    return Promise.resolve(userPref.extractResourcePacks);
  }
  const installationType = api.showDialog("question", "Confirm insallation type", {
    text: "Would you like to extract this resource pack "
      + "and install it as loose files?"
  }, [
    { label: "No"}, { label: "Yes", default: true }
  ]).then(result => result.action === "Yes");

  // Comment this later? Most other things here are more readable.
  if (userPref.askAboutPreference !== false) {
    userPref.askAboutPreference = api.showDialog("question", "Confirm installation preference", {
      text: "Would you like to install resource packs according to that "
      + "preference by default in the future?"
    }, [
      { label: "No"}, { label: "Yes", default: true }, { label: "Don't ask me again" }
    ]).then(result => {
      if (result.action === "Yes") {
        userPref.extractResourcePacks = installationType
      } else
      return result.action !== "Don't ask me again";
    });
    fs.writeFileAsync(SETTINGS, JSON.stringify(userPref));
  }
  return Promise.resolve(installationType);
}

function testMod(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, and that either the archive or a file in
  // the archive is a .jar file.
  let supported =
       gameID === GAME_ID
    && (path.extname(archive).toLowerCase() === MOD_FILE_EXT
    || path.extname(files[0]).toLowerCase() === MOD_FILE_EXT);

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function testResPackLoose(files: string[], gameID: string, archive: string) {
  // Checking that it's not an archive in an archive.
  let supported =
       gameID === GAME_ID
    && !(path.extname(archive).toLowerCase() === MOD_FILE_EXT)
    && !(files.find((file) => path.extname(file).toLowerCase() === RES_PACK_ARCH_EXT) !== undefined); 

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
    && !(path.extname(archive).toLowerCase() === MOD_FILE_EXT)
    && (files.find((file) => path.extname(file).toLowerCase() === RES_PACK_FILE_EXT) !== undefined
    || files.find((file) => path.extname(file).toLowerCase() === RES_PACK_ARCH_EXT) !== undefined); 

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

function installMod(
  files: string[],
  destinationPath: string,
  gameID: string,
  progressDelegate: types.ProgressDelegate,
  choices: any,
  unattended: any,
  archivePath: string
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype", value: "minecraft-mod"
  };
  
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
  destinationPath: string,
  gameID: string,
  progressDelegate: types.ProgressDelegate
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
  destinationPath: string,
  gameID: string,
  progressDelegate: types.ProgressDelegate,
  choices: any,
  unattended: any,
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