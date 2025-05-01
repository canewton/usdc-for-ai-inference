import { Upload, X } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import React, { useState } from 'react';

export interface ImageUploaderProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  preview: string;
  setPreview: (preview: string) => void;
  onImageUpload?: (file: File) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  isDisabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  preview,
  setPreview,
  inputRef,
  onImageUpload,
  maxSizeMB = 20,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg'],
  isDisabled = false,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (
    file: File,
    maxSizeMB: number,
    acceptedFormats: string[],
  ): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `File type not supported. Please upload ${acceptedFormats
        .map((format) => format.replace('image/', '.'))
        .join(', ')} files.`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File is too large. Maximum size is ${maxSizeMB}MB.`;
    }

    return null;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setError(null);

    const validationError = validateFile(file, maxSizeMB, acceptedFormats);
    if (validationError) {
      setError(validationError);
      return;
    }

    setImage(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const removeImage = () => {
    setImage(null);
    setPreview('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`w-full max-w-md mx-auto ${
        isDisabled ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'
      } overflow-hidden`}
      onClick={() =>
        !isDisabled && document.getElementById('image-upload')?.click()
      }
    >
      {!preview ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-colors duration-300 ease-in-out
            ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : error
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <form className="flex flex-col items-center justify-center space-y-4">
            <input
              ref={inputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleChange}
              className="hidden"
            />

            <Upload
              className={`w-12 h--12 mb-2 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`}
            />

            <p className="text-center text-sm font-medium text-gray-700">
              Click or drag to upload image
            </p>

            <p className="text-center text-xs text-gray-500">
              Supported: png, jpg, jpeg
              <br />
              Max: {maxSizeMB}MB
            </p>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </form>
        </div>
      ) : (
        <div className="relative border rounded-lg overflow-hidden">
          <div className="relative w-full aspect-square">
            <img
              src={preview}
              alt="Image preview"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="absolute top-2 right-2">
            <button
              onClick={removeImage}
              className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors shadow-sm"
              aria-label="Remove image"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {image && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 px-3 py-2">
              <p className="text-xs text-white truncate">{image.name}</p>
              <p className="text-xs text-gray-300">{formatBytes(image.size)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
