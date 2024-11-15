# Minecraft: Java Edition Support for Vortex

There is currently [an extension with support for Minecraft: Java Edition on the Nexus](https://www.nexusmods.com/site/mods/204). I felt I could improve on it.

Presently, this extension can manage manually installed mods. Plain .jar file mods and .zip file resource packs can be installed so long as they are under 2 GB. Generally this is not an issue, as both minecraft mods and resource packs don't tend to exceed this limit (be thanked the low-res aesthetic), but I'm still hoping to find an alternative. Regular mods and resource packs are automatically recognised and will deploy to the correct folders, though for edge cases users can set that type manually.

## Planned Features for Release

- Installation of .jar and .zip archives without extraction.
- Deployment of mods and resource packs into the correct directories in .minecraft.
- Automatic recognition of regular mods and resource packs.
- Launching through Vortex as a tool.

## Possible Future Additions

- Recognition of Forge and Fabric.
- Compatibility warnings.
- Reading mod metadata in order to reduce user headache given lots of manual installation.
- Optional installation of resource packs loose, to allow for per-file conflict management (does anyone want this?).