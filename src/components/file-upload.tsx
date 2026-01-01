"use client";

import { useState, useCallback, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  Delete02Icon,
  FileValidationIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  /**
   * Accepted file types (e.g., ".pdf,.doc,.docx" or "image/*")
   */
  accept?: string;
  /**
   * Maximum file size in bytes (default: 5MB)
   */
  maxSize?: number;
  /**
   * Callback when file is selected
   */
  onFileSelect: (file: File | null) => void;
  /**
   * Current file value
   */
  value?: File | null;
  /**
   * Custom label for the dropzone
   */
  label?: string;
  /**
   * Custom description text
   */
  description?: string;
  /**
   * Disable the dropzone
   */
  disabled?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Show file preview details
   */
  showPreview?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const getAcceptedFormats = (accept?: string): string => {
  if (!accept) return "All files";
  const formats = accept
    .split(",")
    .map((format) => format.trim().replace(".", "").toUpperCase());
  return formats.join(", ");
};

export const FileUpload = ({
  accept = ".pdf,.doc,.docx",
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileSelect,
  value,
  label = "Upload your file",
  description,
  disabled = false,
  className,
  showPreview = true,
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file size
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${formatFileSize(maxSize)}`);
        return false;
      }

      // Check file type
      if (accept && accept !== "*") {
        const acceptedTypes = accept.split(",").map((type) => type.trim());
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isAccepted = acceptedTypes.some((type) => {
          if (type.includes("*")) {
            // Handle mime type wildcards like "image/*"
            const [category] = type.split("/");
            return file.type.startsWith(category);
          }
          return type === fileExtension || type === file.type;
        });

        if (!isAccepted) {
          toast.error(
            `File type not accepted. Please upload: ${getAcceptedFormats(accept)}`,
          );
          return false;
        }
      }

      return true;
    },
    [accept, maxSize],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileSelect(file);
        toast.success("File uploaded successfully");
      }
    },
    [validateFile, onFileSelect],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handleRemove = useCallback(() => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("File removed");
  }, [onFileSelect]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const defaultDescription =
    description ||
    `Drag and drop your file here, or click to browse. Accepted formats: ${getAcceptedFormats(accept)}. Max size: ${formatFileSize(maxSize)}.`;

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      {!value ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!disabled ? handleBrowseClick : undefined}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
            disabled && "cursor-not-allowed opacity-50",
            !disabled && "cursor-pointer",
            "min-h-[240px]",
          )}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Icon */}
            <div
              className={cn(
                "rounded-full p-4 transition-colors",
                isDragging ? "bg-primary/10" : "bg-accent",
              )}
            >
              <HugeiconsIcon
                icon={Upload04Icon}
                className={cn(
                  "h-10 w-10 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={1.5}
              />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{label}</h3>
              <p className="text-muted-foreground max-w-xs text-sm">
                {defaultDescription}
              </p>
            </div>

            {/* Button */}
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              Browse Files
            </Button>
          </div>
        </div>
      ) : (
        showPreview && (
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-4">
              {/* File Icon */}
              <div className="bg-primary/10 shrink-0 rounded-lg p-3">
                <HugeiconsIcon
                  icon={FileValidationIcon}
                  className="text-primary h-8 w-8"
                  strokeWidth={1.5}
                />
              </div>

              {/* File Details */}
              <div className="min-w-0 flex-1">
                <h4
                  className="font-medium text-wrap break-all"
                  title={value.name}
                >
                  {value.name}
                </h4>
                <p className="text-muted-foreground mt-1 text-sm">
                  {formatFileSize(value.size)} • {value.type || "Unknown type"}
                </p>
              </div>

              {/* Remove Button */}
              <div className="flex w-10 shrink-0 items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
