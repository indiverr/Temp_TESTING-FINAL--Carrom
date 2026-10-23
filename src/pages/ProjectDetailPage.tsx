import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { projectsData } from '../data/projectsData';
import { SEO } from '../components/SEO';
import { ArrowLeft, ArrowRight, Cpu, Tag, CheckCircle2, ShieldCheck, Trophy, Layers, Sparkles, Compass, AlertCircle } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const project = projectsData.find((p) => p.id === id);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="flex flex-col flex-grow bg-white">
      <SEO
        title={`${project.title} — Technical Case Study`}
        description={project.description}
      />

      {/* Top Breadcrumbs & Hero */}
      <section className="pt-10 pb-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1E3E62_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-6">
            <Link to="/projects" className="hover:text-brand-lightSky flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Projects</span>
            </Link>
            <span>/</span>
            <span className="text-brand-orange">{project.category}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Title & Tagline (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-xs font-mono font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>{project.badge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {project.title}
              </h1>

              <p className="text-lg sm:text-xl font-semibold text-brand-lightSky">
                {project.subtitle}
              </p>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {project.description}
              </p>

              {/* Status Pill */}
              <div className="pt-2 flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Stage: {project.developmentStage}</span>
                </span>

                <span className="text-xs font-mono text-slate-400">
                  Ref: ANBU-ENG-#{project.id}
                </span>
              </div>
            </div>

            {/* Schematic Preview (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-[4/3] group">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* 1. Problem Definition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider">
                  // Section 01
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-1">
                  The Problem
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Ground-level friction and practical diagnostic constraints.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900">
                {project.problem.title}
              </h3>
              <p className="text-base text-slate-700 leading-relaxed">
                {project.problem.summary}
              </p>

              <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Key Pain Points Addressed</span>
                </h4>
                <ul className="space-y-2.5">
                  {project.problem.bulletPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 2. Engineering Approach */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider">
                  // Section 02
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-1">
                  The Engineering Approach
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  From physical signal acquisition to firmware calculation.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900">
                {project.approach.title}
              </h3>
              <p className="text-base text-slate-700 leading-relaxed">
                {project.approach.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.approach.steps.map((step, sIdx) => (
                  <div key={sIdx} className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-blue">
                        STEP 0{sIdx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-brand-navy mt-1 mb-2">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 3. Prototype Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider">
                  // Section 03
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-1">
                  Prototype &amp; Hardware
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Bill-of-materials and verified architectural specifications.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <p className="text-base text-slate-700 leading-relaxed">
                {project.prototypeDetails.overview}
              </p>

              {/* Hardware Specs Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                <div className="p-4 bg-slate-100/80 border-b border-slate-200 font-mono text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center justify-between">
                  <span>Hardware Specification Parameter</span>
                  <span>Architecture Value</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {project.prototypeDetails.hardwareSpecs.map((spec, specIdx) => (
                    <div key={specIdx} className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                      <span className="font-semibold text-slate-900 font-mono sm:col-span-1">
                        {spec.name}
                      </span>
                      <span className="text-slate-600 sm:col-span-2">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Technology Tags */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Verified Technologies Used</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-800 border border-slate-300 text-xs font-mono font-medium shadow-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 4. Demonstrations & Recognition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider">
                  // Section 04
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-1">
                  Demonstration &amp; Recognition
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Live reviews, exhibitions, and verified citations.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase mb-2">
                  <Trophy className="w-4 h-4" />
                  <span>{project.demonstration.event}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {project.demonstration.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {project.demonstration.details}
                </p>
                {project.recognitionInfo && (
                  <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 font-semibold">
                    ★ {project.recognitionInfo}
                  </div>
                )}
              </div>

              {/* Event Image if available */}
              {project.eventImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/9] relative group">
                  <img
                    src={project.eventImage}
                    alt={project.demonstration.imageCaption}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-black/75 backdrop-blur-sm text-white text-xs font-mono">
                    {project.demonstration.imageCaption}
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 5. Future Roadmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider">
                  // Section 05
                </span>
                <h2 className="text-2xl font-extrabold text-brand-navy mt-1">
                  Future Direction
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  Planned development and technical enhancements.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-xl font-bold text-slate-900">
                {project.futureDirection.title}
              </h3>
              <div className="space-y-3">
                {project.futureDirection.goals.map((goal, gIdx) => (
                  <div key={gIdx} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-700 font-medium">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Strong Contextual Enquiry CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-darkNavy via-brand-navy to-brand-slate text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-widest block mb-2">
            // COLLABORATIVE ENGINEERING
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Have a problem we can engineer around?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mb-8">
            Connect directly with our engineering team to discuss custom sensor nodes, agricultural automation, or prototype development.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-brand-blue to-brand-orange shadow-lg hover:shadow-glow-blue transition-all group"
          >
            <span>Start a Conversation</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
};
