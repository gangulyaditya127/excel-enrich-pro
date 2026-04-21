export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const UPLOAD_CONFIGS = [
  {
    title: "Group Client Mapping",
    endpoint: "/upload/group-client-mapping/",
    savedAs: "reference_excel/GroupClient  Mapping_April26.xlsx",
  },
  {
    title: "Nexpose Raw Data",
    endpoint: "/upload/nexpose-raw-data/",
    savedAs: "reference_excel/Nexpose- raw data.xlsx",
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