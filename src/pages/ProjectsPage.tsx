import React, { useState } from 'react';
import { ProjectCard } from '../components/ProjectCard';
import { projectsData } from '../data/projectsData';
import { SEO } from '../components/SEO';
import { CTASection } from '../components/CTASection';
import { Filter, Sparkles } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Smart Agriculture & Sensor Systems', 'Agricultural Automation & Embedded Control', 'Embedded Systems & Industrial IoT'];

  const filteredProjects = selectedCategory === 'All'
    ? projectsData
    : projectsData.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title="Projects & Case Studies — ANBU IoT"
        description="Explore working hardware prototypes, smart agriculture systems, soil testing instruments, and embedded electronics developed by ANBU IoT."
      />

      {/* Header */}
      <section className="pt-16 pb-20 bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-brand-blue/20 text-xs font-mono font-bold text-brand-blue uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span>Engineering Portfolio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-brand-navy tracking-tight leading-tight">
              Working Prototypes &amp; Field Architectures
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Every project represents a concrete problem translated into working physical hardware, validated through live demonstrations, competitive awards, and ecosystem recognition.
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-2 pt-6 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects List */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {filteredProjects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} featured={true} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <CTASection />
    </div>
  );
};
