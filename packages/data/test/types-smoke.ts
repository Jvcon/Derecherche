import catalog, {
  engines,
  icons,
  type Engine,
} from "../generated/index.js";

const first: Engine | undefined = engines[0];

if (!catalog.catalogVersion) {
  throw new Error("catalogVersion is missing");
}

if (!icons.license) {
  throw new Error("icon license is missing");
}

if (first) {
  void first.id;
}
