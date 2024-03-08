import * as path from "path";
import { fs, types, util } from "vortex-api";

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
    supported: false,
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

async function installMod(
  files: string[],
  destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate
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
    // Double-zipping method.
    const sevenZip = new util.SevenZip();
    const archiveName = path.basename(destinationPath, '.installing') + '.zip';
    const archivePath = path.join(destinationPath, archiveName);
    const rootRelPaths = await fs.readdirAsync(destinationPath);

    await sevenZip.add(archivePath, rootRelPaths.map(relPath => {
      return path.join(destinationPath, relPath);
    }), { raw: ['-r'] });

    const instructions: types.IInstruction[] = [{
      type: "copy",
      data: archiveName,
      destination: archiveName
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

async function installResPackArch(
  files: string[],
  destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate
): Promise<types.IInstallResult> {
  const zipFiles = files.filter(file => ['.zip'].includes(path.extname(file)));
  
  const modtypeAttr: types.IInstruction = {
    type: "setmodtype", value: "resource-pack"
  };

  if (zipFiles.length > 0) {
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
    // Double-zipping method.
    const sevenZip = new util.SevenZip();
    const archiveName = path.basename(destinationPath, '.installing') + '.zip';
    const archivePath = path.join(destinationPath, archiveName);
    const rootRelPaths = await fs.readdirAsync(destinationPath);

    await sevenZip.add(archivePath, rootRelPaths.map(relPath => {
      return path.join(destinationPath, relPath);
    }), { raw: ['-r'] });

    const instructions: types.IInstruction[] = [{
      type: "copy",
      data: archiveName,
      destination: archiveName
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
  default: main
};