import * as path from "path";
import { fs, types, util } from "vortex-api";

const GAME_ID = "minecraft";
const MS_ID = "Microsoft.4297127D64EC6";

const LAUNCH_DEF = "C:/Program Files (x86)/Minecraft Launcher"

const WIN_EXE = "Minecraft.exe"
const LEG_EXE = "MinecraftLauncher.exe"

const MOD_FILE_EXT = ".jar";
const RES_PACK_FILE_EXT = ".mcmeta";
// const RES_PACK_ARCH_EXT = ".zip";

function findGame() {
  try {
    // This method doesn't seem to work, despite my being fairly certain of the
    // correctness of the Microsoft Store ID. It's harmless, though, so I'll
    // leave it in for now. Maybe it will end up working for somebody.
    return util.GameStoreHelper.findByAppId([MS_ID]).then((game) => game.gamePath);
  } catch (error) {
    try {
      fs.accessSync(path.join(LAUNCH_DEF, LEG_EXE), fs.constants.F_OK);

      return LAUNCH_DEF;
    } catch (error) {
      console.log("Minecraft was not found.")
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

function testResPack(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, that the archive isn't a .jar file, and
  // that it contains an .mcmeta file.
  let supported =
       gameID === GAME_ID
    && !(path.extname(archive).toLowerCase() === MOD_FILE_EXT)
    && files.find((file) => path.extname(file).toLowerCase() === RES_PACK_FILE_EXT) !== undefined; 

  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

// Replaced this with Baldur's Gate 3's implementation.
function installMod(
  files: string[],
  destinationPath: string,
  gameID: string,
  progressDelegate: types.ProgressDelegate,
  choices: any,
  unattended: any,
  archive: string
): Promise<types.IInstallResult> {
  const modtypeAttr: types.IInstruction = {
    type: "setmodtype", value: "minecraft-mod"
  };

  if (path.extname(archive).toLowerCase() === MOD_FILE_EXT) {
    const archives: string[] = [archive]

    const instructions: types.IInstruction[] = archives.reduce(
      (accum: types.IInstruction[], archivePath: string) => {    
        accum.push({
          type: 'copy',
          source: archivePath,
          destination: path.basename(archivePath)
        });    
        return accum;
      }, [ modtypeAttr ]
    );

    return Promise.resolve({ instructions });
  } else {
    const instructions: types.IInstruction[] = files.reduce(
      (accum: types.IInstruction[], filePath: string) => {    
        accum.push({
          type: 'copy',
          source: filePath,
          destination: path.basename(filePath)
        });
  
        return accum;
      }, [ modtypeAttr ]
    );

    return Promise.resolve({ instructions });
  }
}

// Let's just, uh, yoink that archive.
function installResPack(
  files: string[],
  destinationPath: string,
  gameID: string,
  progressDelegate: types.ProgressDelegate,
  choices: any,
  unattended: any,
  archive: string
): Promise<types.IInstallResult> {
  const modtypeAttr: types.IInstruction = {
    type: "setmodtype", value: "resource-pack"
  };

  const archives: string[] = [archive]

  const instructions: types.IInstruction[] = archives.reduce(
    (accum: types.IInstruction[], archivePath: string) => {    
      accum.push({
        type: 'copy',
        source: archivePath,
        destination: path.basename(archivePath)
      });    
      return accum;
    }, [ modtypeAttr ]
  );

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
    executable: findExe,
    requiredFiles: [findExe()],
    setup: prepareForModding,
  });
  context.registerInstaller("minecraft-mod", 25, testMod, installMod);
  context.registerInstaller("resource-pack", 25, testResPack, installResPack);
  context.registerModType(
    "minecraft-mod", 25, (gameID) => gameID === GAME_ID,
    modsPath, () => true,
    { name: "Default" }
  );
  context.registerModType(
    "resource-pack", 25, (gameID) => gameID === GAME_ID,
    () => path.join(dataPath(), "resourcepacks"), () => true,
    { name: "Resource Pack" }
  );

  return true;
}

module.exports = {
  default: main,
};