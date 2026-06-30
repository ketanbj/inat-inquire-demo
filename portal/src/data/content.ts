import {
  Boxes,
  Building2,
  Database,
  FlaskConical,
  Gauge,
  Network,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AudienceKey = "director" | "researcher" | "rse";

export type AudienceMode = {
  key: AudienceKey;
  label: string;
  icon: LucideIcon;
  caption: string;
};

export type SceneNodeKey = "source" | "ingest" | "index" | "search" | "decision";

export type SceneNode = {
  key: SceneNodeKey;
  label: string;
  shortLabel: string;
  stat: string;
};

export type PersonaResource = {
  label: string;
  href: string;
  note: string;
};

export const audiences: AudienceMode[] = [
  {
    key: "director",
    label: "Director",
    icon: Building2,
    caption: "Resource view"
  },
  {
    key: "researcher",
    label: "PI / Researcher",
    icon: FlaskConical,
    caption: "Research view"
  },
  {
    key: "rse",
    label: "RSE / Architecture",
    icon: Network,
    caption: "System view"
  }
];

export const sceneNodes: SceneNode[] = [
  {
    key: "source",
    label: "iNaturalist Source Images",
    shortLabel: "Source",
    stat: "image, license, dimensions"
  },
  {
    key: "ingest",
    label: "INQUIRE Ingestion Path",
    shortLabel: "Ingest",
    stat: "bounded local slice"
  },
  {
    key: "index",
    label: "Vector Collection",
    shortLabel: "Index",
    stat: "searchable embeddings"
  },
  {
    key: "search",
    label: "Research Search Experience",
    shortLabel: "Search",
    stat: "query, score, latency"
  },
  {
    key: "decision",
    label: "Review And Scale Decision",
    shortLabel: "Review",
    stat: "quality gates and cost"
  }
];

export const personaResources: Record<AudienceKey, PersonaResource[]> = {
  director: [
    {
      label: "CSSE Engineering Team",
      href: "https://ssecenter.cc.gatech.edu/people/",
      note: "RSE staff"
    },
    {
      label: "CSSE Showcase",
      href: "https://gt-csse.github.io/project-showcase/",
      note: "Project portfolio"
    },
    {
      label: "Benchmark Evidence",
      href: "https://github.com/ketanbj/inat-inquire-demo/blob/main/data/evidence/benchmark-summary.json",
      note: "quality readout"
    },
    {
      label: "Readiness Evidence",
      href: "https://github.com/ketanbj/inat-inquire-demo/blob/main/data/evidence/production-readiness.json",
      note: "scale path"
    }
  ],
  researcher: [
    {
      label: "Ray Data",
      href: "https://docs.ray.io/en/latest/data/data.html",
      note: "parallel ingest"
    },
    {
      label: "Ray RAG",
      href: "https://docs.ray.io/en/latest/ray-overview/examples/e2e-rag/notebooks/03_Deploy_LLM_with_Ray_Serve.html",
      note: "distributed retrieval"
    },
    {
      label: "Qdrant",
      href: "https://qdrant.tech/documentation/",
      note: "vector index"
    },
    {
      label: "FastAPI",
      href: "https://fastapi.tiangolo.com/",
      note: "service boundary"
    }
  ],
  rse: [
    {
      label: "Demo API Docs",
      href: "http://localhost:8088/docs",
      note: "OpenAPI"
    },
    {
      label: "Run This Demo",
      href: "https://github.com/ketanbj/inat-inquire-demo#quick-start",
      note: "local quick start"
    },
    {
      label: "Demo Runbook",
      href: "https://github.com/ketanbj/inat-inquire-demo/blob/main/docs/operations-runbook.md",
      note: "self-guided run"
    },
    {
      label: "INQUIRE Repo",
      href: "https://github.com/inaturalist/Inquire-vector-search",
      note: "source"
    },
    {
      label: "Developer Guide",
      href: "https://github.com/inaturalist/Inquire-vector-search/blob/main/DEVELOPERS_GUIDE.md",
      note: "setup/API/bench"
    },
    {
      label: "Architecture Charts",
      href: "https://github.com/inaturalist/Inquire-vector-search/tree/main/charts",
      note: "diagrams"
    },
    {
      label: "Configs",
      href: "https://github.com/inaturalist/Inquire-vector-search/tree/main/configs",
      note: "environments"
    },
    {
      label: "Benchmarks",
      href: "https://github.com/inaturalist/Inquire-vector-search/tree/main/bench",
      note: "evaluation"
    },
    {
      label: "Known Limits",
      href: "https://github.com/ketanbj/inat-inquire-demo/blob/main/docs/project-plan.md#out-of-scope",
      note: "non-goals"
    }
  ]
};

export const architectureSteps = [
  {
    icon: Boxes,
    label: "Source Slice",
    copy:
      "A bounded iNaturalist image slice stands in for the larger biodiversity corpus so the evidence path is visible end to end."
  },
  {
    icon: Sparkles,
    label: "Image Evidence",
    copy:
      "Image URLs, object keys, dimensions, license text, and source metadata stay attached so search results can be inspected."
  },
  {
    icon: Search,
    label: "Embedding Path",
    copy:
      "The INQUIRE workflow turns images and text queries into comparable vectors, keeping model and collection details visible."
  },
  {
    icon: Database,
    label: "Search Index",
    copy:
      "The vector collection stores embeddings with payload metadata so result cards can show score, provenance, and source links."
  },
  {
    icon: Gauge,
    label: "New Arrival",
    copy:
      "A later image slice is appended to the same collection, proving that new records can enter the live review workflow."
  },
  {
    icon: ShieldCheck,
    label: "Scale Readout",
    copy:
      "Metrics, quality gates, recovery evidence, and cost assumptions keep the larger service path concrete."
  }
];

export const suggestedQueriesByAudience: Record<AudienceKey, string[]> = {
  director: [
    "nudibranch",
    "desert shrub",
    "harbor seals",
    "pink wildflower"
  ],
  researcher: [
    "nudibranch",
    "sea anemone",
    "pink wildflower",
    "small bird in grass"
  ],
  rse: [
    "nudibranch",
    "desert shrub",
    "harbor seals",
    "sea lions on rocks"
  ]
};
