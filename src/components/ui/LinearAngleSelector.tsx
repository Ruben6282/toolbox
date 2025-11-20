import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  value: number;
  onChange: (val: number) => void;
}

export const LinearAngleSelector = ({ value, onChange }: Props) => {
  const circleRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));

  // Keep input in sync if the parent changes angle externally
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  // ---------------------------------------
  // Calculate angle from pointer position
  // ---------------------------------------
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

      // atan2 gives angle relative to +X axis (right)
      let deg = Math.atan2(dy, dx) * (180 / Math.PI);

      // Convert so 0° = top, increasing clockwise (CSS gradient semantics)
      deg = (deg + 90 + 360) % 360;

      const rounded = Math.round(deg);
      onChange(rounded);
      setInputValue(String(rounded));
    },
    [onChange]
  );

  // ---------------------------------------
  // Drag helpers
  // ---------------------------------------
  const stopDrag = useCallback(() => {
    setDragging(false);
    document.removeEventListener("mousemove", updateAngleFromEvent);
    document.removeEventListener("mouseup", stopDrag);

    document.removeEventListener("touchmove", updateAngleFromEvent);
    document.removeEventListener("touchend", stopDrag);
  }, [updateAngleFromEvent]);

  const startDrag = useCallback(() => {
    setDragging(true);

    document.addEventListener("mousemove", updateAngleFromEvent);
    document.addEventListener("mouseup", stopDrag);

    document.addEventListener("touchmove", updateAngleFromEvent, {
      passive: false,
    });
    document.addEventListener("touchend", stopDrag);
  }, [stopDrag, updateAngleFromEvent]);

  // ---------------------------------------
  // Manual input
  // ---------------------------------------
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

  // ---------------------------------------
  // Knob positioning
  // ---------------------------------------
  const radius = 24; // smaller and matches your reference UI

  // Offset angle: knob should visually match CSS gradient angle
  const visualAngle = value - 90;

  const knobStyle = {
    transform: `rotate(${visualAngle}deg) translateX(${radius}px)`,
    transformOrigin: "center",
  } as const;

  return (
    <div className="flex items-center gap-3">
      {/* Circle */}
      <div
        ref={circleRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="
          relative w-14 h-14 
          rounded-full border border-muted-foreground/70
          flex items-center justify-center cursor-pointer
        "
      >
        {/* Knob */}
        <div
          className="absolute w-2.5 h-2.5 bg-foreground rounded-full"
          style={knobStyle}
        />
      </div>

      {/* Angle input */}
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
