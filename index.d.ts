export interface TerrainRenderParams {
  heightPngUrl: string;
  colorPngUrl: string;
  samples?: number;
  resolution?: number;
  displaceStrength?: number;
  sunElevationDeg?: number;
  sunAzimuthDeg?: number;
  cameraOrthoScale?: number;
  subdivisions?: number;
  engine?: "CYCLES" | "BLENDER_EEVEE";
}

export interface TerrainRenderResult {
  jobId: string;
  renderSeconds: number;
  outputUrl: string;
  target: string;
}

export declare class TerrainRenderer {
  constructor(opts: { targets: string[]; healthTimeoutMs?: number });
  resolveTarget(): Promise<string>;
  render(params: TerrainRenderParams): Promise<TerrainRenderResult>;
}

export declare function createTerrainRenderer(opts?: {
  macMiniUrl?: string;
  localUrl?: string;
  extraTargets?: string[];
}): TerrainRenderer;

declare const _default: { TerrainRenderer: typeof TerrainRenderer; createTerrainRenderer: typeof createTerrainRenderer };
export default _default;
