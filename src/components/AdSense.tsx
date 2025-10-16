interface AdSenseProps {
  slot?: string;
  format?: string;
  className?: string;
}

export const AdSense = ({ 
  slot = "auto", 
  format = "auto",
  className = "" 
}: AdSenseProps) => {
  return (
    <div className={`my-8 flex justify-center ${className}`}>
      <div className="w-full max-w-4xl min-h-[280px] flex items-center justify-center bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">Advertisement</p>
          <p className="text-xs text-muted-foreground/60 mt-1">AdSense Slot: {slot}</p>
        </div>
      </div>
    </div>
  );
};
