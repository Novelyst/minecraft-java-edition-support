import * as path from "path";
import { fs, types, util } from "vortex-api";

import { 
  FILE_EXT_MOD, FILE_EXT_PACK,
  MOD_TYPE_DEF, MOD_TYPE_RES_PACK, MOD_TYPE_DAT_PACK, MOD_TYPE_SHA_PACK 
} from "./common";

function doubleZip(
  files: string[],
  archiveExt: string
): boolean {
  return (files.filter(file => [archiveExt].includes(path.extname(file)))).length === files.length;
}

async function instructionsLoose(
  files: string[]
): Promise<types.IInstruction[]> {
  const filtered = files.filter(file => (!file.endsWith(path.sep)));

  return filtered.reduce((accum: types.IInstruction[], filePath: string) => {    
    accum.push({
      type: "copy",
      source: filePath,
      destination: path.basename(filePath),
    });

    return accum;
  }, []);
}

async function instructionsReZip(
  destinationPath: string,
  archivePath: string
): Promise<types.IInstruction> {
  const sevenZip = new util.SevenZip();
  const archiveName = path.basename(archivePath);
  const archiveInstallPath = path.join(destinationPath, archiveName);
  const rootRelPaths = await fs.readdirAsync(destinationPath);
  
  await sevenZip.add(archiveInstallPath, rootRelPaths.map(relPath => {
    return path.join(destinationPath, relPath);
  }), { raw: ["-r"] });

  const data = await fs.readFileAsync(archiveInstallPath);

  // I don't love that we're doing this, because this method apparently craps
  // out with files greater than 2 GB, but this is finally a working solution
  // so… unless I find a way to make the other way work, this is it.
  return {
    type: "generatefile",
    data: data,
    destination: archiveName
  };
}

export async function installMod(
  files: string[],
  destinationPath: string,
  _gameId: string,
  _progressDelegate: types.ProgressDelegate,
  _choices: any,
  _unattended: boolean,
  archivePath: string
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_DEF
  }
  
  if (doubleZip(files, FILE_EXT_MOD)) {
    const instructions: types.IInstruction[] = [...[modTypeAttr], ...await instructionsLoose(files)]

    return Promise.resolve({ instructions });
  } else {
    const instructions: types.IInstruction[] = [modTypeAttr, await instructionsReZip(destinationPath, archivePath)]
    
    return Promise.resolve({ instructions });
  }
}

export async function installResPack(
  files: string[],
  destinationPath: string,
  _gameId: string,
  _progressDelegate: types.ProgressDelegate,
  _choices: any,
  _unattended: boolean,
  archivePath: string
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_RES_PACK
  }

  if (doubleZip(files, FILE_EXT_PACK)) {
    const instructions: types.IInstruction[] = [...[modTypeAttr], ...await instructionsLoose(files)]

    return Promise.resolve({ instructions });
  } else {
    const instructions: types.IInstruction[] = [modTypeAttr, await instructionsReZip(destinationPath, archivePath)]
    
    return Promise.resolve({ instructions });
  }
}

// From what I can tell, this doesn't work right, even though it's literally
// just the plain archive unpacking behaviour. All I can say is that me and the
// "copy" instruction type aren't on good terms right now.
export async function installResPackLoose(
  files: string[],
  _destinationPath: string
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_RES_PACK
  }

  const instructions: types.IInstruction[] = [...[modTypeAttr], ...await instructionsLoose(files)]

  return Promise.resolve({ instructions });
}

export async function installShaPack(
  files: string[],
  destinationPath: string,
  _gameId: string,
  _progressDelegate: types.ProgressDelegate,
  _choices: any,
  _unattended: boolean,
  archivePath: string
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_SHA_PACK
  }

  if (doubleZip(files, FILE_EXT_PACK)) {
    const instructions: types.IInstruction[] = [...[modTypeAttr], ...await instructionsLoose(files)]

    return Promise.resolve({ instructions });
  } else {
    const instructions: types.IInstruction[] = [modTypeAttr, await instructionsReZip(destinationPath, archivePath)]
    
    return Promise.resolve({ instructions });
  }
}

export async function installDataPack(
  files: string[],
  destinationPath: string,
  _gameId: string,
  _progressDelegate: types.ProgressDelegate,
  _choices: any,
  _unattended: boolean,
  archivePath: string
): Promise<types.IInstallResult> {
  const modTypeAttr: types.IInstruction = {
    type: "setmodtype",
    value: MOD_TYPE_DAT_PACK
  }
  
  if (doubleZip(files, FILE_EXT_PACK)) {
    const instructions: types.IInstruction[] = [...[modTypeAttr], ...await instructionsLoose(files)]

    return Promise.resolve({ instructions });
  } else {
    const instructions: types.IInstruction[] = [modTypeAttr, await instructionsReZip(destinationPath, archivePath)]
    
    return Promise.resolve({ instructions });
  }
}