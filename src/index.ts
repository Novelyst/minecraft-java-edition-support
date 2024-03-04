import fs from 'fs';
import path from 'path';
import vortex_api from 'vortex-api';

const GAME_ID = 'minecraft';
const MS_ID = 'Microsoft.4297127D64EC6';

const MOD_FILE_EXT = '.jar';
const RESOURCE_PACK_FILE_EXT = '.mcmeta'

function findGame() {
    try {
        return vortex_api.util.GameStoreHelper.findByAppId([MS_ID])
            .then(game => game.gamePath);
    } catch (err) {
        const LAUNCHER_DEFAULT = 'C:\\Program Files (x86)\\Minecraft Launcher\\MinecraftLauncher.exe'
        
        if (fs.existsSync(LAUNCHER_DEFAULT)) {
            return LAUNCHER_DEFAULT
        } else {
            throw new Error('no file exists');
        }
    }
}

function dataPath() {
    return path.join(vortex_api.util.getVortexPath('appData'), 'Roaming', '.minecraft');
}

function modsPath() {
    return path.join(dataPath(), '~mods');
}

function prepareForModding() {
    return vortex_api.fs.ensureDirAsync(modsPath());
}

function testMod(files, gameID) {
    let supported = (gameID === GAME_ID) &&
      (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);
  
    return Promise.resolve({
      supported,
      requiredFiles: [],
    });
}

function installMod(files) {
    const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
    const index = modFile.indexOf(path.basename(modFile));
    const rootPath = path.dirname(modFile);
    
    const filtered = files.filter(
        file => ((file.indexOf(rootPath) !== -1) && (!file.endsWith(path.sep)))
    );
  
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: path.join(file.substr(index)),
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
      (files.find(file => path.extname(file).toLowerCase() === RESOURCE_PACK_FILE_EXT) !== undefined);
  
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