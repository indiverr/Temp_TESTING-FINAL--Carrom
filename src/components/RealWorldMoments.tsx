import React, { useState } from 'react';
import { Camera, ShieldCheck, Eye } from 'lucide-react';

export const RealWorldMoments: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const gallery = [
    {
      image: '/assets/projects/iot-soil-testing-stall.jpg',
      title: 'Flagship Exhibition Stall — IOT BASED SOIL TESTING',
      caption: 'ANBU IoT founders, faculty mentors, and evaluators at Stall 019 demonstrating the working low-cost multi-sensor system and microgreens chamber.',
      category: 'Exhibition Stall 019'
    },
    {
      image: '/assets/recognition/dindigul-stage-award.jpg',
      title: 'District Fest Second Place Award Ceremony',
      caption: 'Official stage commendation and prize presentation at MSP Auditorium during the Dindigul Science, Technology and Startups Fest 2026.',
      category: 'District Award'
    },
    {
      image: '/assets/recognition/sns-ideathon-national-award.jpg',
      title: 'National Level Ideathon Award — SNS Institutions',
      caption: 'Stage award presentation at Dr. SNS Rajalakshmi College of Arts and Science / SNS Institutions during the National Level Ideathon.',
      category: 'National Award'
    },
    {
      image: '/assets/recognition/startuptn-stage-minister.png',
      title: 'Disbursement by Hon’ble MSME Minister Thiru T. M. Anbarasan',
      caption: 'Receiving the official framed sanction order under the Gramam Thorum Puthozhil Scheme at the StartupTN Chennai Office.',
      category: 'Ministerial Sanction'
    }
  ];

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2">
              <Camera className="w-3.5 h-3.5 text-brand-blue" />
              <span>Real Ground Evidence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy tracking-tight">
              Real-World Moments &amp; Live Demonstrations
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-600 max-w-md">
            Unstaged, authentic photographic documentation of our live stalls, national stage awards, and ministerial recognitions.
          </p>
        </div>

        {/* Curated 4-Grid Photo Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gallery.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-subtle hover:shadow-premium hover:border-brand-blue/40 transition-all duration-300 flex flex-col group"
            >
              {/* Photo Container with Intelligent Cropping */}
              <div
                className="relative aspect-[4/3] bg-slate-900 overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(item.image)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Category Pill */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm text-white border border-white/15">
                    {item.category}
                  </span>
                </div>

                {/* Hover zoom overlay */}
                <div className="absolute inset-0 bg-brand-navy/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-2 rounded-full bg-white/90 text-brand-navy shadow-lg">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Caption Content */}
              <div className="p-5 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="text-base font-bold text-brand-navy group-hover:text-brand-blue transition-colors mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.caption}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>Verified Showcase</span>
                  </span>
                  <span>Photo 0{idx + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-3 border border-slate-700">
            <img
              src={selectedImage}
              alt="Expanded real-world photo"
              className="max-h-[80vh] w-auto object-contain rounded-2xl mx-auto"
            />
            <div className="p-3 text-center text-xs text-slate-300 font-mono">
              Click anywhere to close full-resolution view
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
