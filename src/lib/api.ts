export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const ADMIN_UPLOAD_CONFIGS = [
  {
    title: "Group Client Mapping",
    endpoint: "/upload/group-client-mapping/",
    savedAs: "reference_excel/GroupClient  Mapping_April26.xlsx",
  },
  {
    title: "Internet Facing & Criticality",
    endpoint: "/upload/internet-facing-criticality/",
    savedAs: "Internet facing Criticality VMware APR'26 (1) (1).xlsx",
  },
  {
    title: "VA Grouping Title",
    endpoint: "/upload/va-grouping-title/",
    savedAs: "VA Grouping Title - April'26.xlsx",
  },
] as const;

export const NEXPOSE_UPLOAD_CONFIG = {
  title: "Nexpose Raw Data",
  endpoint: "/upload/nexpose-raw-data/",
  savedAs: "reference_excel/Nexpose- raw data.xlsx",
} as const;

// Back-compat alias
export const UPLOAD_CONFIGS = [...ADMIN_UPLOAD_CONFIGS, NEXPOSE_UPLOAD_CONFIG] as const;