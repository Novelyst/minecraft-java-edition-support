# Minecraft: Java Edition Support for Vortex

There is currently [an extension with support for Minecraft: Java Edition on the Nexus](https://www.nexusmods.com/site/mods/204). I felt I could improve on it.

Presently, this extension can manage manually installed mods that are archived. Plain .jar file mods and .zip file resource packs should be zipped up to use this "properly" (technically, when the installer fails, you can just drag the archive into the empty staging folder created) but in the future I'll look into a workaround for that.

## Planned Features for Release

- Installation of .jar and .zip archives without extraction.
- Deployment of mods and resource packs into the correct directories in .minecraft.
- Automatic recognition of regular mods and resource packs.
- Launching through Vortex as a tool.

## Possible Future Additions

- Recognition of Forge and Fabric.
- Compatibility warnings.
- Reading mod metadata in order to reduce user headache given lots of manual installation.