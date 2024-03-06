# Minecraft: Java Edition Support for Vortex

There is currently [an extension with support for Minecraft: Java Edition on the Nexus](https://www.nexusmods.com/site/mods/204). I felt I could improve on it.

Presently, this extension can manage manually installed mods that are archived. Plain .jar file mods and .zip file resource packs should be zipped up to use this "properly" (technically, when the installer fails, you can just drag the archive into the empty staging folder created) but in the future I'll look into a workaround for that.

Work so far has been done with extensive referencing of [Pickysaurus'](https://nexus-mods.github.io/vortex-api/2022/04/03/Creating-a-game-extension.html)
tutorial, the [official Baldur's Gate 3 extension](https://github.com/Nexus-Mods/vortex-games/tree/master/game-baldursgate3), and [Creative's Midnight Club 2 extension](https://github.com/casually-creative/vortex-mc2-plugin). Thanks also go to Creative for being friendly and helpful on the Nexus Mods Discord server.

## Planned Features for Release

- Installation of .jar and .zip archives without extraction.
- Deployment of mods and resource packs into the correct directories in .minecraft.
- Automatic recognition of regular mods and resource packs.

## Possible Future Additions

- Recognition of Forge and Fabric.
- Compatibility warnings.
