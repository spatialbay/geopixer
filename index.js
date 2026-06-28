/**
 * GeoPixer — mapping SDK.
 *
 * `TerrainRenderer` automates the QGIS-export -> Blender workflow: given a
 * height-map PNG + color-map PNG (e.g. from Earth Engine), it calls a Blender
 * render service to produce an orthographic 3D terrain image.
 *
 * Render targets are tried in order (e.g. a GPU Mac mini first, then the
 * caller's own localhost service) so the feature degrades gracefully when a
 * preferred box is offline.
 */

const DEFAULT_TIMEOUT_MS = 5000;

async function withTimeout(promise, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export class TerrainRenderer {
  /**
   * @param {object} opts
   * @param {string[]} opts.targets - render-service base URLs, tried in order.
   * @param {number} [opts.healthTimeoutMs]
   */
  constructor({ targets, healthTimeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    if (!targets || !targets.length) {
      throw new Error("TerrainRenderer requires at least one target URL (e.g. a localhost fallback).");
    }
    this.targets = targets;
    this.healthTimeoutMs = healthTimeoutMs;
  }

  /** Find the first healthy target, in priority order. */
  async resolveTarget() {
    for (const base of this.targets) {
      try {
        const ok = await withTimeout(
          (signal) => fetch(`${base}/health`, { signal }).then((r) => r.ok),
          this.healthTimeoutMs,
        );
        if (ok) return base;
      } catch {
        // try next target
      }
    }
    throw new Error(`No healthy render target among: ${this.targets.join(", ")}`);
  }

  /**
   * Render a 3D terrain from a height/color PNG pair.
   * @param {object} params
   * @param {string} params.heightPngUrl - greyscale elevation map (black=low, white=high).
   * @param {string} params.colorPngUrl - color/texture map draped over the terrain.
   * @param {number} [params.samples]
   * @param {number} [params.resolution]
   * @param {number} [params.displaceStrength]
   * @param {number} [params.sunElevationDeg]
   * @param {number} [params.sunAzimuthDeg]
   * @param {number} [params.cameraOrthoScale]
   * @param {number} [params.subdivisions]
   * @param {"CYCLES"|"BLENDER_EEVEE"} [params.engine]
   * @returns {Promise<{jobId: string, renderSeconds: number, outputUrl: string, target: string}>}
   */
  async render(params) {
    const base = await this.resolveTarget();
    const body = {
      height_png_url: params.heightPngUrl,
      color_png_url: params.colorPngUrl,
      samples: params.samples ?? 100,
      resolution: params.resolution ?? 1024,
      displace_strength: params.displaceStrength ?? 1.5,
      sun_elevation_deg: params.sunElevationDeg ?? 45,
      sun_azimuth_deg: params.sunAzimuthDeg ?? 45,
      camera_ortho_scale: params.cameraOrthoScale ?? 11,
      subdivisions: params.subdivisions ?? 300,
      engine: params.engine ?? "CYCLES",
    };
    const resp = await fetch(`${base}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      throw new Error(`Render failed on ${base}: ${resp.status} ${await resp.text()}`);
    }
    const data = await resp.json();
    return {
      jobId: data.job_id,
      renderSeconds: data.render_seconds,
      outputUrl: data.output_url,
      target: base,
    };
  }
}

/** Convenience factory: Mac mini funnel first, then a local dev fallback. */
export function createTerrainRenderer({
  macMiniUrl = "https://arvinds-mac-mini.taild9567c.ts.net:10001",
  localUrl = "http://localhost:8788",
  extraTargets = [],
} = {}) {
  return new TerrainRenderer({ targets: [macMiniUrl, ...extraTargets, localUrl] });
}

export default { TerrainRenderer, createTerrainRenderer };
