import React from 'react';

export default function InstitutionalHeader() {
  return (
    <div className="w-full bg-[#1a3821] text-white py-6 px-6 md:px-12 flex flex-col items-center relative shadow-md">
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left Logo - Census of India */}
        <div className="flex-shrink-0">
          <img
            src="/census_logo.png"
            alt="Census of India"
            className="h-20 md:h-24 w-auto rounded-full bg-white p-1"
          />
        </div>

        {/* Center Content */}
        <div className="flex flex-col items-center text-center space-y-1">
          <img
            src="/emblem.png"
            alt="National Emblem"
            className="h-12 md:h-16 w-auto mb-2"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <h2 className="text-xs md:text-sm font-medium leading-tight">जनगणना कार्य निदेशालय, असम</h2>
          <h3 className="text-[10px] md:text-xs font-medium leading-tight">गृह मंत्रालय, भारत सरकार</h3>
          <div className="flex flex-col items-center w-fit">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight uppercase mt-1">
              Directorate of Census Operations, Assam
            </h1>
            {/* Tricolor Line matching text length */}
            <div className="w-full h-[3px] tricolor-line mt-1.5 mb-2 rounded-full shadow-sm opacity-90" />
          </div>

          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-90 pt-1">
            Ministry of Home Affairs, Government of India
          </p>
        </div>

        {/* Right Logo - Registration & Statistics */}
        <div className="flex-shrink-0">
          <img
            src="/unnamed.png"
            alt="Registration and Statistics"
            className="h-20 md:h-24 w-auto rounded-full bg-white p-1"
          />
        </div>
      </div>

      {/* Language Toggle (Top Right) */}
      {/* <div className="absolute right-6 top-6 hidden lg:flex">
        <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded border border-white/20 transition-all text-[10px] font-bold uppercase tracking-widest">
          <span>Hindi</span>
          <span className="opacity-70">|</span>
          <span>हिंदी</span>
        </button>
      </div> */}
    </div>
  );
}
