import { basename, dirname, extname, join, sep } from 'path';
import { fs, util } from 'vortex-api';

import { IExtensionContext } from 'vortex-api/lib/types/IExtensionContext';

const GAME_ID = 'minecraft';
const MS_ID = 'Microsoft.4297127D64EC6';

const MOD_FILE_EXT = '.jar';
const RESOURCE_PACK_FILE_EXT = '.mcmeta'

function findGame() {
    try {
        return util.GameStoreHelper.findByAppId([MS_ID])
            .then(game => game.gamePath);
    } catch (error) {
        const LAUNCHER_DEFAULT = 'C:\\Program Files (x86)\\Minecraft Launcher\\MinecraftLauncher.exe'
        
        try {
            fs.accessSync(LAUNCHER_DEFAULT, fs.constants.F_OK);
            return LAUNCHER_DEFAULT;
        } catch (error) {
            throw new Error('no file exists');
        }
    }
}

function dataPath() {
    return join(util.getVortexPath('appData'), 'Roaming', '.minecraft');
}

function modsPath() {
    return join(dataPath(), '~mods');
}

function prepareForModding() {
    return fs.ensureDirAsync(modsPath());
}

function testMod(files, gameID) {
    let supported = (gameID === GAME_ID) &&
      (files.find(file => extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);
  
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
}

function installMod(files) {
    const modFile = files.find(file => extname(file).toLowerCase() === MOD_FILE_EXT);
    const index = modFile.indexOf(basename(modFile));
    const rootPath = dirname(modFile);
    
    const filtered = files.filter(
        file => ((file.indexOf(rootPath) !== -1) && (!file.endsWith(sep)))
    );
  
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: join(file.substr(index)),
        };
    });
  
    return Promise.resolve({ instructions });
}

function isResourcePack(api, files) {

}

function installResourcePack(files) {
    const modtypeAttr = { type: 'setmodtype', value: 'resource-pack' };
  
    const instructions = ''
  
    return Promise.resolve({ instructions });
}

function testResourcePack(files, gameID) {
    let supported = (gameID === GAME_ID) &&
      (files.find(file => extname(file).toLowerCase() === RESOURCE_PACK_FILE_EXT) !== undefined);
  
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
}

function main(context) {
    context.registerGame({
        id: GAME_ID,
        name: 'Minecraft: Java Edition',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: [],
        queryModPath: modsPath,
        logo: 'gameart.jpg',
        executable: () => 'MinecraftLauncher.exe',
        requiredFiles: ['MinecraftLauncher.exe'],
        setup: prepareForModding
    });
    context.registerInstaller('minecraft-mod', 25, testMod, installMod);
    context.registerInstaller('resource-pack', 25, testResourcePack, )
    context.registerModType(
        'resource-pack',
        25,
        (gameID) => gameID === GAME_ID,
        () => path.join(dataPath(), 'resourcepacks')
        instructions => isResourcePack(context.api, instructions),
        { name: 'Resource Pack' }
    );
    
	return true
}

module.exports = {
    default: main,
  };