"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, title }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={images[active]}
          alt={`${title} - foto ${active + 1}`}
          fill
          sizes="(max-width:1024px) 100vw, 800px"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                active === i ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt={`thumbnail ${i + 1}`} fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
