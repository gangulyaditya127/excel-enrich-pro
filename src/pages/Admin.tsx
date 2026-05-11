import { useState } from "react";
import UploadCard from "@/components/UploadCard";
import { API_BASE, ADMIN_UPLOAD_CONFIGS } from "@/lib/api";

const Admin = () => {
  const [statuses, setStatuses] = useState<boolean[]>(ADMIN_UPLOAD_CONFIGS.map(() => false));

  const handleStatus = (i: number, success: boolean) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[i] = success;
      return next;
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin · Reference Files</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload or replace reference Excel files. These persist on the server and only need to be re-uploaded when they change.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADMIN_UPLOAD_CONFIGS.map((config, i) => (
          <UploadCard
            key={config.endpoint}
            title={config.title}
            endpoint={config.endpoint}
            savedAs={config.savedAs}
            baseUrl={API_BASE}
            onStatusChange={(s) => handleStatus(i, s)}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {statuses.filter(Boolean).length}/{ADMIN_UPLOAD_CONFIGS.length} files updated this session.
      </p>
    </div>
  );
};

export default Admin;