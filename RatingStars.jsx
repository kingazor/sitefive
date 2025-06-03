import React from "react";
import { Star } from "lucide-react";

export default function RatingStars({ rating, size = "md", interactive = false, onChange }) {
  const sizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const handleClick = (starRating) => {
    if (interactive && onChange) {
      onChange(starRating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array(5).fill(0).map((_, i) => {
        const starRating = i + 1;
        const isActive = starRating <= rating;
        
        return (
          <Star
            key={i}
            className={`${sizes[size]} ${
              isActive ? 'text-yellow-500 fill-current' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => handleClick(starRating)}
          />
        );
      })}
    </div>
  );
}