import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, FileText, Image, Paperclip, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen er for stor. Maksimum størrelse er 10MB.');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Filtype ikke understøttet. Upload billeder, PDF, Word eller Excel filer.');
      return;
    }

    setUploading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(data.path, 60 * 60 * 24); // 24 hours

      if (urlData?.signedUrl) {
        onFileUploaded(urlData.signedUrl, file.name, file.type);
        toast.success('Fil uploadet succesfuldt!');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Kunne ikke uploade filen. Prøv igen.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        disabled={disabled || uploading}
        className="w-8 h-8 p-0"
      >
        {uploading ? (
          <Upload className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

interface AttachmentPreviewProps {
  fileName: string;
  fileType: string;
  fileUrl?: string;
  onRemove: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ 
  fileName, 
  fileType, 
  fileUrl, 
  onRemove 
}) => {
  const getFileIcon = () => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <Card className="p-2 bg-muted/50">
      <div className="flex items-center gap-2">
        {getFileIcon()}
        <span className="text-sm truncate flex-1" title={fileName}>
          {fileName}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="w-6 h-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};

export { FileUpload, AttachmentPreview };
export type { FileUploadProps, AttachmentPreviewProps };