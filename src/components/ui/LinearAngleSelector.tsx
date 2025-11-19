import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  value: number;
  onChange: (val: number) => void;
}

export const LinearAngleSelector = ({ value, onChange }: Props) => {
  const circleRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [inputValue, setInputValue] = useState(String(value)); // allow empty

  // -------------------------
  // Convert pointer → angle
  // -------------------------
  const updateAngleFromEvent = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!circleRef.current) return;

      const rect = circleRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const x =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const y =
        "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const dx = x - cx;
      const dy = y - cy;

      let deg = Math.atan2(dy, dx) * (180 / Math.PI);
      deg = (deg + 90 + 360) % 360;

      const rounded = Math.round(deg);
      onChange(rounded);
      setInputValue(String(rounded));
    },
    [onChange]
  );

  // -------------------------
  // Drag start / stop
  // -------------------------
  const startDrag = () => {
    setDragging(true);
    document.addEventListener("mousemove", updateAngleFromEvent);
    document.addEventListener("mouseup", stopDrag);

    document.addEventListener("touchmove", updateAngleFromEvent);
    document.addEventListener("touchend", stopDrag);
  };

  const stopDrag = useCallback(() => {
    setDragging(false);
    document.removeEventListener("mousemove", updateAngleFromEvent);
    document.removeEventListener("mouseup", stopDrag);

    document.removeEventListener("touchmove", updateAngleFromEvent);
    document.removeEventListener("touchend", stopDrag);
  }, [updateAngleFromEvent]);

  // -------------------------
  // Manual input
  // -------------------------
  const handleInputChange = (val: string) => {
    setInputValue(val);

    if (val.trim() === "") {
      onChange(0);
      return;
    }

    const num = Number(val);
    if (!Number.isNaN(num)) {
      const clamped = Math.max(0, Math.min(360, num));
      onChange(clamped);
    }
  };

  // -------------------------
  // Knob position
  // -------------------------
  const radius = 32; // smaller circle

  const knobStyle = {
    transform: `rotate(${value}deg) translateY(-${radius}px)`,
  };

  return (
    <div className="flex items-center gap-3">
      {/* Circle */}
      <div
        ref={circleRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="
          relative w-16 h-16
          rounded-full border border-muted-foreground/80
          flex items-center justify-center cursor-pointer
        "
      >
        <div
          className="absolute w-2.5 h-2.5 bg-foreground rounded-full"
          style={knobStyle}
        />
      </div>

      {/* Number input */}
      <Input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        className="w-16 text-center"
        placeholder="0"
      />
      <span className="text-sm text-muted-foreground">deg</span>
    </div>
  );
};
