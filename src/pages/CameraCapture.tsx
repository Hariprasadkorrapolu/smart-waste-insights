import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_WIDTH = 800;
const QUALITY_HIGH = 0.6;
const QUALITY_LOW = 0.4;
const MAX_SIZE_BYTES = 300 * 1024;

const CameraCapture: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("wasteFormData");
    if (!data) {
      toast({ title: "Missing Data", description: "Please fill in the form first.", variant: "destructive" });
      navigate("/submit");
    }
  }, [navigate, toast]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch {
      toast({ title: "Camera Error", description: "Unable to access camera. Please allow camera permissions.", variant: "destructive" });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStreaming(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const compressImage = useCallback((canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          if (blob.size <= MAX_SIZE_BYTES) {
            resolve(blob);
          } else {
            canvas.toBlob(
              (lowBlob) => {
                if (!lowBlob) return reject(new Error("Compression failed"));
                resolve(lowBlob);
              },
              "image/webp",
              QUALITY_LOW
            );
          }
        },
        "image/webp",
        QUALITY_HIGH
      );
    });
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ratio = Math.min(MAX_WIDTH / video.videoWidth, 1);
    canvas.width = video.videoWidth * ratio;
    canvas.height = video.videoHeight * ratio;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const blob = await compressImage(canvas);
      setCompressedBlob(blob);
      setCompressedSize(blob.size);
      setCapturedImage(canvas.toDataURL("image/webp", QUALITY_HIGH));
      stopCamera();
    } catch {
      toast({ title: "Error", description: "Image compression failed.", variant: "destructive" });
    }
    setIsCapturing(false);
  }, [compressImage, stopCamera, toast]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setCompressedBlob(null);
    startCamera();
  }, [startCamera]);

  const handleConfirm = async () => {
    if (!compressedBlob) return;
    setIsSubmitting(true);

    try {
      const formData = JSON.parse(sessionStorage.getItem("wasteFormData") || "{}");

      // Upload photo to storage
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("submission-photos")
        .upload(fileName, compressedBlob, { contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("submission-photos")
        .getPublicUrl(fileName);

      // Insert submission
      const { error: insertError } = await supabase.from("submissions").insert({
        name: formData.name,
        address: formData.address,
        gender: formData.gender,
        age: Number(formData.age),
        phone: formData.phone,
        email: formData.email,
        photo_url: urlData.publicUrl,
      });

      if (insertError) throw insertError;

      sessionStorage.removeItem("wasteFormData");
      toast({ title: "Success!", description: "Your submission has been recorded." });
      navigate("/success");
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Something went wrong.", variant: "destructive" });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-earth flex items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-lg bg-card rounded-3xl shadow-elevated p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate("/submit")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Form
        </button>

        <h1 className="text-2xl font-display font-bold text-foreground mb-1">Capture Photo</h1>
        <p className="text-sm text-muted-foreground mb-6">Take a photo for your submission. Images are compressed automatically.</p>

        <div className="relative rounded-2xl overflow-hidden bg-foreground/5 aspect-[4/3] mb-4">
          <AnimatePresence mode="wait">
            {capturedImage ? (
              <motion.img key="captured" src={capturedImage} alt="Captured" className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
            ) : (
              <motion.video key="video" ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            )}
          </AnimatePresence>
          {!capturedImage && streaming && (
            <div className="absolute inset-0 border-2 border-primary/30 rounded-2xl pointer-events-none" />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {compressedBlob && (
          <motion.div className="bg-secondary rounded-xl px-4 py-2 mb-4 flex items-center justify-between"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <span className="text-sm text-secondary-foreground">Compressed Size</span>
            <span className="text-sm font-semibold text-primary">{(compressedSize / 1024).toFixed(1)} KB</span>
          </motion.div>
        )}

        <div className="flex gap-3">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={retake} className="flex-1 rounded-full py-5">
                <RotateCcw className="w-4 h-4 mr-2" /> Retake
              </Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handleConfirm} disabled={isSubmitting} className="w-full rounded-full py-5 font-display font-semibold shadow-soft">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Confirm & Submit
                </Button>
              </motion.div>
            </>
          ) : (
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={capture} disabled={!streaming || isCapturing} className="w-full rounded-full py-5 font-display font-semibold shadow-soft">
                {isCapturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                Capture
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CameraCapture;
