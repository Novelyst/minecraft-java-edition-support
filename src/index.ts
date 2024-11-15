import * as path from "path";
import { fs, types, util } from "vortex-api";

import { 
  LAUNCH_DEF, LAUNCHER,
  GAME_ID, MS_ID,
  MOD_TYPE_DEF, MOD_TYPE_RES_PACK
 } from "./common";
import { setModType } from "vortex-api/lib/actions";

function findGame() {
  try {
    // I can't tell whether this works properly, but it can't hurt.
    return util.GameStoreHelper.findByAppId([MS_ID]).then((game) => game.gamePath);
  } catch (error) {
    try {
      fs.accessSync(path.join(LAUNCH_DEF, LAUNCHER), fs.constants.F_OK);

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
  return findGame() !== LAUNCH_DEF ? "Minecraft.exe" : LAUNCHER;
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

  return Promise.resolve({supported, requiredFiles: []});
}

function testResPackLoose(files: string[], gameID: string, archive: string) {
  // Checking that it's not an archive in an archive.
  let supported =
       gameID === GAME_ID
    && !(path.extname(archive).toLowerCase() === ".jar")
    && !(files.find((file) => path.extname(file).toLowerCase() === ".zip") !== undefined); 

  return Promise.resolve({supported: false, requiredFiles: []});
}

function testResPackArch(files: string[], gameID: string, archive: string) {
  // Check that the game is supported, that the archive isn't a .jar file, and
  // that it contains an .mcmeta file.
  let supported =
       gameID === GAME_ID
    && !(path.extname(archive).toLowerCase() === ".jar")
    && (files.find((file) => path.extname(file).toLowerCase() === ".mcmeta") !== undefined
    || files.find((file) => path.extname(file).toLowerCase() === ".zip") !== undefined); 

  return Promise.resolve({supported, requiredFiles: []});
}

async function installMod(
  files: string[],
  destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_DEF
  }
  
  if (files.length === 1) {
    const filePath = files[0];

    const instructions: types.IInstruction[] = [
      modTypeAttr, {
      type: "copy",
      source: filePath,
      destination: path.basename(filePath)
    }];

    return Promise.resolve({ instructions });
  } else {
    const sevenZip = new util.SevenZip();
    const archiveName = path.basename(destinationPath, '.installing') + '.jar';
    const archivePath = path.join(destinationPath, archiveName);
    const rootRelPaths = await fs.readdirAsync(destinationPath);
    
    await sevenZip.add(archivePath, rootRelPaths.map(relPath => {
      return path.join(destinationPath, relPath);
    }), { raw: ['-r'] });

    const data = await fs.readFileAsync(archivePath);
    
    // I don't love that we're doing this, because this method apparently craps
    // out with files greater than 2 GB, but this is finally a working solution
    // so… unless I find a way to make the other way work, this is it.
    const instructions: types.IInstruction[] = [
      modTypeAttr, {
      type: "generatefile",
      data: data,
      destination: archiveName
    }];

    return Promise.resolve({ instructions });
  }
}

// From what I can tell, this doesn't work right, even though it's literally
// just the plain archive unpacking behaviour. All I can say is that me and the
// "copy" instruction type aren't on good terms right now.
async function installResPackLoose(
  files: string[],
  _destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_RES_PACK
  }
  const instructions: types.IInstruction[] = files.reduce(
    (accum: types.IInstruction[], filePath: string) => {    
      accum.push({
        type: "copy",
        source: filePath,
        destination: path.basename(filePath)
      });

      return accum;
    }, [ modTypeAttr ]
  );

  return Promise.resolve({ instructions });
}

async function installResPackArch(
  files: string[],
  destinationPath: string,
  _gameID: string,
  _progressDelegate: types.ProgressDelegate
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_RES_PACK
  }
  const zipFiles = files.filter(file => ['.zip'].includes(path.extname(file)));

  if (zipFiles.length > 0) {
    const instructions: types.IInstruction[] = files.reduce(
      (accum: types.IInstruction[], filePath: string) => {    
        accum.push({
          type: "copy",
          source: filePath,
          destination: path.basename(filePath)
        });
  
        return accum;
      }, [ modTypeAttr ]
    );

    return Promise.resolve({ instructions });
  } else {
    const sevenZip = new util.SevenZip();
    const archiveName = path.basename(destinationPath, '.installing') + '.zip';
    const archivePath = path.join(destinationPath, archiveName);
    const rootRelPaths = await fs.readdirAsync(destinationPath);

    await sevenZip.add(archivePath, rootRelPaths.map(relPath => {
      return path.join(destinationPath, relPath);
    }), { raw: ['-r'] });

    const data = await fs.readFileAsync(archivePath);
    
    const instructions: types.IInstruction[] = [
      modTypeAttr, {
      type: "generatefile",
      data: data,
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

  context.registerInstaller(MOD_TYPE_DEF, 25, testMod, installMod);
  context.registerInstaller(MOD_TYPE_RES_PACK, 25, testResPackLoose, installResPackLoose);
  context.registerInstaller(MOD_TYPE_RES_PACK, 25, testResPackArch, installResPackArch);

  context.registerModType(
    MOD_TYPE_DEF, 25, (gameID) => gameID === GAME_ID,
    modsPath, () => Promise.resolve(true),
    { name: "Default" }
  );
  context.registerModType(
    MOD_TYPE_RES_PACK, 25, (gameID) => gameID === GAME_ID,
    () => path.join(dataPath(), "resourcepacks"), () => Promise.resolve(true),
    { name: "Resource Pack" }
  );

  return true;
}

module.exports = {
  default: main
};