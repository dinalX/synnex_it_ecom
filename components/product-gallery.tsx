"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || images[0];

  if (images.length === 0) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-main">
          <div className="product-gallery-placeholder">
            <span>No image</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <Image
          key={activeImage?.id}
          src={activeImage?.url || ""}
          alt={activeImage?.alt || productName}
          fill
          priority
          className="product-gallery-img"
          sizes="(max-width: 980px) 100vw, 60vw"
        />
      </div>
      {images.length > 1 && (
      <div className="product-gallery-thumbs">
        {images.map((img, i) => (
          <button
            key={img.id}
            className={`product-gallery-thumb ${i === activeIndex ? "active" : ""}`}
            type="button"
            onClick={() => setActiveIndex(i)}
          >
            <Image 
              src={img.url} 
              alt={img.alt || productName} 
              fill 
              sizes="80px"
              style={{ objectFit: "cover" }} 
            />
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
