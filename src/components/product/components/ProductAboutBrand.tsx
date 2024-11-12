'use client'
import { useState } from 'react';
type AboutBrandProps = {
  info: string;
};
export default function AboutBrand({ info }: AboutBrandProps) {
  const [showMore, setShowMore] = useState(false);
    return (
      <section className="bg-white flex flex-col rounded-3xl p-5 border-gray mb-5">
        <h2 className="text-xl font-bold mb-3">About the Brand</h2>
        <p className="text-gray-500 font-normal">
          {showMore ? info : `${info.substring(0, 200)}...`}
        </p>
        <button
          className="text-blue-500 font-semibold"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Show less' : 'Show more'}
        </button>
      </section>
    );
  }
  