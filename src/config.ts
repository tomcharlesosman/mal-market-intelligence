import path from "node:path";

export type RuntimeConfig = {
  dataRoot: string;
  idealistaFixtureFile: string;
};

export function resolveConfig(
  overrides: Partial<RuntimeConfig> = {},
): RuntimeConfig {
  return {
    dataRoot: path.resolve(
      process.cwd(),
      overrides.dataRoot ?? process.env.MAL_DATA_DIR ?? ".mal",
    ),
    idealistaFixtureFile: path.resolve(
      process.cwd(),
      overrides.idealistaFixtureFile ??
        path.join("fixtures", "idealista-mallorca-snapshot.json"),
    ),
  };
}

export const config = resolveConfig();
