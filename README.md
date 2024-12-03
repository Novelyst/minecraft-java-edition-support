# Minecraft: Java Edition Support for Vortex

There is currently [an extension with support for Minecraft: Java Edition on the Nexus](https://www.nexusmods.com/site/mods/204). I felt I could improve on it.

Presently, this extension can manage manually installed mods. Plain .jar file mods and .zip file resource packs can be installed so long as they are under 2 GB. Generally this is not an issue, as both minecraft mods and resource packs don't tend to exceed this limit (be thanked the low-res aesthetic), but I'm still hoping to find an alternative. Regular mods, resource packs, and shader packs are automatically recognised and will deploy to the correct folders, though for edge cases users can set that type manually.

## Current Features

- Installation of .jar and .zip archives without extraction.
- Deployment of mods into the correct directories in .minecraft.
- Automatic recognition of regular mods, resource packs, and shader packs.

## Possible Future Additions

- Recognition of mod loaders.
- Compatibility warnings.
- Reading mod metadata in order to reduce user headache given lots of manual installation.
- Optional installation of resource packs loose, to allow for per-file conflict management (does anyone want this?).
- Support for data packs.
- Save management.
