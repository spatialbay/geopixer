# GeoPixer

Mapping SDK for Spatial Bay: GIS layers, Earth Engine data export, and
automated **QGIS-to-Blender style 3D terrain rendering**.

`TerrainRenderer` automates the workflow from the "3D georeferenced map"
QGIS+Blender tutorials: given a height-map PNG (elevation, black=low/white=high)
and a color-map PNG (hypsometric tint, NDVI, satellite imagery, etc.), it
calls a headless-Blender render service (Cycles, GPU) and returns a rendered
orthographic terrain image.

## Install

```bash
npm install geopixer
```

## Usage

```js
import { createTerrainRenderer } from "geopixer";

const renderer = createTerrainRenderer(); // Mac mini first, localhost fallback

const result = await renderer.render({
  heightPngUrl: "https://.../elevation.png",
  colorPngUrl: "https://.../color.png",
  samples: 150,
  resolution: 1024,
});

console.log(result.outputUrl, `${result.renderSeconds}s on ${result.target}`);
```

Render targets are tried in priority order and health-checked, so this
degrades gracefully: a shared GPU box first, the caller's own machine if it's
offline.

## Render service

The companion render service (`spatialbay/geopixer-render`) wraps headless
Blender: plane sized to the source image, Displace modifier (height map),
Subdivision Surface, Principled BSDF base color (color map), raking sun
light, orthographic top-down camera, Cycles GPU render.

## Status

Early scaffold (0.1.x). Planned: GeoServer/Earth-Engine data-source clients,
a unified CLI shared with `@geomotion/gm`, and docs/examples microsite
mirroring GeoMotion's `/gm` pattern.
