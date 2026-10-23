import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { ArrowRight, CheckCircle2, Cpu, Tag, ExternalLink } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  index: number;
  featured?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, featured = false }) => {
  const isEven = index % 2 === 0;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-subtle hover:shadow-premium hover:border-brand-blue/40 transition-all duration-300 ${
        featured ? 'p-6 sm:p-8 lg:p-10' : 'p-6'
      }`}
    >
      <div className={`grid grid-cols-1 ${featured ? 'lg:grid-cols-12 gap-8 lg:gap-12 items-center' : 'gap-6'}`}>
        
        {/* Visual Frame */}
        <div className={`${featured ? `lg:col-span-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}` : ''}`}>
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/10] group">
            <img
              src={project.image}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Overlay Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-md bg-brand-navy/90 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/15">
                {project.category}
              </span>
            </div>

            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/95 backdrop-blur-md text-[11px] font-mono font-bold text-emerald-800 shadow-sm border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{project.developmentStage}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content Column */}
        <div className={`${featured ? `lg:col-span-6 ${isEven ? 'lg:order-2' : 'lg:order-1'}` : 'flex flex-col justify-between flex-grow'}`}>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-orange uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>PROJECT 0{index + 1} // {project.badge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight mb-3">
              {project.title}
            </h3>

            <p className="text-sm font-semibold text-slate-700 mb-3">
              {project.subtitle}
            </p>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              {project.description}
            </p>

            {/* Application Info */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide mb-1">
                Primary Target Application
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {project.application}
              </p>
            </div>

            {/* Tech Tags */}
            <div className="mb-8">
              <div className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-brand-blue" />
                <span>Verified Technologies</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.slice(0, 4).map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 4 && (
                  <span className="text-xs font-mono px-2 py-1 rounded-md bg-blue-50 text-brand-blue font-semibold">
                    +{project.technologies.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Link */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-navy hover:bg-brand-blue text-white text-sm font-bold shadow-sm transition-all duration-200 group"
            >
              <span>View Case Study &amp; Architecture</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <span className="text-xs font-mono font-semibold text-slate-400">
              ID: #{project.id}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
