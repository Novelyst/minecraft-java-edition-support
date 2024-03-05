import * as path from "path";
import { fs, types, util } from "vortex-api";

const GAME_ID = "minecraft";
const MS_ID = "Microsoft.4297127D64EC6";

const LAUNCH_DEF = "C:/Program Files (x86)/Minecraft Launcher/"

const WIN_EXE = "Minecraft.exe"
const LEG_EXE = "MinecraftLauncher.exe"

const MOD_FILE_EXT = ".jar";
const RES_PACK_FILE_EXT = ".mcmeta";
const RES_PACK_ARCH_EXT = ".zip";

function findGame() {
  try {
    return util.GameStoreHelper.findByAppId([MS_ID]).then(
      (game) => game.gamePath
      );
  } catch (error) {
    try {
      fs.accessSync(path.join(LAUNCH_DEF, LEG_EXE), fs.constants.F_OK);

      return LAUNCH_DEF;
    } catch (error) {
      throw new Error("no file exists");
    }
  }
}

function dataPath() {
  return path.join(util.getVortexPath("appData"), "Roaming", ".minecraft");
}

// Add some kind of check that the .minecraft directory is writeable. If not,
// whine to the user about it.

function modsPath() {
  return path.join(dataPath(), "~mods");
}

function findExe(): string {
  return findGame() !== LAUNCH_DEF ? WIN_EXE : LEG_EXE;
}

function prepareForModding() {
  return fs.ensureDirAsync(modsPath());
}

function isResourcePack(api: types.IExtensionApi, files: types.IInstruction[]) {
  // Just check if the installed thingy is a .zip archive, I guess.
  /* const origFile = files.find(
    (file) => path.extname(file).toLowerCase() === RESOURCE_PACK_ARCHIVE_EXT
  ) */
  
  console.log(api)
  console.log(files)

  return 1 === 1
    ? Promise.resolve(true)
    : Promise.resolve(false);
}

// We're checking for a .jar file.
function testMod(files: string[], gameID: string) {
  let supported = gameID === GAME_ID && files.find(
    (file) => path.extname(file).toLowerCase() === MOD_FILE_EXT
  ) !== undefined;

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

// Here we just want the .mcmeta file.
function testResourcePack(files: string[], gameID: string) {
  let supported = gameID === GAME_ID && files.find(
    (file) => path.extname(file).toLowerCase() === RES_PACK_FILE_EXT,
  ) !== undefined;

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

// Replaced this with Baldur's Gate 3's implementation.
function installMod(
  files: string[],
  destinationPath: string,
  gameId: string,
  progressDelegate: types.ProgressDelegate,
): Promise<types.IInstallResult> {
  files = files.filter(file => path.extname(file) !== '' && !file.endsWith(path.sep));

  files = files.filter(file => path.extname(file) === MOD_FILE_EXT);

  const instructions: types.IInstruction[] = files.reduce(
    (accum: types.IInstruction[], filePath: string) => {    
      accum.push({
        type: 'copy',
        source: filePath,
        destination: path.basename(filePath),
      });    
      return accum;
    }, []);
  return Promise.resolve({ instructions });
}

// Let's just, uh, yoink that archive.
function installResourcePack(
  files: string[],
  destinationPath: string,
  gameId: string,
  progressDelegate: types.ProgressDelegate,
  archivePath: string
): Promise<types.IInstallResult> {
  console.log(files)[0];

  const archive: string[] = [archivePath]

  const modtypeAttr: types.IInstruction = {
    type: "setmodtype", value: "resource-pack"
  };

  const instructions: types.IInstruction[] = archive.reduce(
    (accum: types.IInstruction[], chivePath: string) => {    
      accum.push({
        type: 'copy',
        source: chivePath,
        destination: path.basename(chivePath),
      });    
      return accum;
    }, [ modtypeAttr ]);
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

  context.registerInstaller(
    "minecraft-mod",
    25,
    testMod,
    installMod
  );
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