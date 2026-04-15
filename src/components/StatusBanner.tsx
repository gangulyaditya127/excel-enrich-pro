import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface StatusBannerProps {
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
}

const StatusBanner = ({ type, message, onDismiss }: StatusBannerProps) => {
  const isSuccess = type === "success";

  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-lg text-sm ${
        isSuccess ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default StatusBanner;
