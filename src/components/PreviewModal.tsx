import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Monitor } from 'lucide-react';
import { firebaseOrderService, OrderRecord } from "@/domain/services/firebase/orderService";
import { firebaseStorageService } from "@/domain/services/firebase/storageService";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, orderId }) => {
  const [contentData, setContentData] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log('PreviewModal: isOpen:', isOpen, 'orderId:', orderId);
    if (isOpen && orderId) {
      console.log('PreviewModal: Fetching content for order:', orderId);
      fetchContent();
    } else {
      console.log('PreviewModal: Not fetching - isOpen:', isOpen, 'orderId:', orderId);
    }
  }, [isOpen, orderId]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      console.log('PreviewModal: Querying order:', orderId);
      const data = await firebaseOrderService.getOrderById(orderId);

      if (!data) {
        console.warn('PreviewModal: No content found for order', orderId);
        setContentData(null);
        setMediaUrl(null);
        return;
      }

      console.log('PreviewModal: Content loaded:', data);
      setContentData(data);

      if (data.file_path) {
        const url = await firebaseStorageService.getPublicUrl(data.file_path);
        setMediaUrl(url);
      } else {
        setMediaUrl(null);
      }
    } catch (error) {
      console.error('PreviewModal: Error in fetchContent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isImage = contentData?.file_type?.startsWith('image/');
  const isVideo = contentData?.file_type?.startsWith('video/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0 bg-black overflow-hidden">
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
          >
            ✕
          </button>
          
          {isLoading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading preview...</p>
            </div>
          ) : contentData?.file_path ? (
            <div className="w-full h-full flex items-center justify-center">
              {isImage && (
                <img
                  src={mediaUrl ?? ''}
                  alt={contentData.file_name}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('PreviewModal: Image loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('PreviewModal: Image failed to load:', contentData.file_path);
                    console.error('PreviewModal: URL:', mediaUrl);
                  }}
                />
              )}

              {isVideo && (
                <video
                  autoPlay
                  muted
                  loop
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('PreviewModal: Video failed to load:', contentData.file_path);
                    console.error('PreviewModal: URL:', mediaUrl);
                    console.error('PreviewModal: File type:', contentData.file_type);
                  }}
                  onLoadedData={() => {
                    console.log('PreviewModal: Video loaded successfully:', contentData.file_name);
                  }}
                >
                  {/* Use original file type as primary source */}
                  <source src={mediaUrl ?? undefined} type={contentData.file_type || 'video/mp4'} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div className="text-center text-white">
              <Monitor className="h-32 w-32 mx-auto mb-4 opacity-50" />
              <p className="text-2xl opacity-50">No media to display</p>
              <p className="text-sm opacity-30 mt-2">Order ID: {orderId || 'None'}</p>
              <p className="text-sm opacity-30">Has file_path: {contentData?.file_path ? 'Yes' : 'No'}</p>
              <p className="text-sm opacity-30">File type: {contentData?.file_type || 'Unknown'}</p>
              {!contentData?.file_path && (
                <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/50 max-w-md mx-auto">
                  <p className="text-yellow-200 text-sm">
                    This content was uploaded before the file storage fix. Please re-upload this file to enable preview.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal;