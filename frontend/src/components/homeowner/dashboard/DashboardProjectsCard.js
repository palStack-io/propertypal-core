import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  planning:      { bar: '#38bdf8', badge: { background: 'rgba(56,189,248,0.15)',  color: '#38bdf8' }, progress: 15 },
  'in-progress': { bar: '#0ea5e9', badge: { background: 'rgba(14,165,233,0.15)',  color: '#7dd3fc' }, progress: 50 },
  'on-hold':     { bar: '#fb923c', badge: { background: 'rgba(251,146,60,0.15)',  color: '#fb923c' }, progress: 30 },
  completed:     { bar: '#4ade80', badge: { background: 'rgba(74,222,128,0.15)',  color: '#4ade80' }, progress: 100 },
};

function getProjectProgress(project) {
  if (project.status === 'completed') return 100;
  if (project.budget && project.spent) return Math.min(Math.round((project.spent / project.budget) * 100), 100);
  return STATUS_STYLES[project.status]?.progress ?? 0;
}

export default function DashboardProjectsCard({ projects, loadingDashboardData, formatCurrency }) {
  const Spinner = () => (
    <div className="text-center py-4">
      <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Current Projects</h2>
        <Link to="/projects" className="btn-secondary text-sm px-3 py-1 rounded-md">
          <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Project
        </Link>
      </div>

      {loadingDashboardData ? <Spinner /> : projects.length > 0 ? (
        <div>
          {projects.slice(0, 2).map((project, i) => {
            const styles = STATUS_STYLES[project.status] ?? STATUS_STYLES['in-progress'];
            const progress = getProjectProgress(project);
            const label = project.status
              ? project.status.charAt(0).toUpperCase() + project.status.slice(1).replace(/-/g, ' ')
              : 'In Progress';

            return (
              <div
                key={project.id}
                className="py-3"
                style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-medium">{project.name}</h4>
                  <span style={{ ...styles.badge, padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem' }}>
                    {label}
                  </span>
                </div>
                <div className="rounded-full h-2 mb-2" style={{ background: 'var(--bg-card-hover)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${progress}%`, background: styles.bar }} />
                </div>
                <div className="flex justify-between text-xs t-secondary">
                  <span>Budget: {formatCurrency(project.budget || 0)}</span>
                  <span>Spent: {formatCurrency(project.spent || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="t-secondary mb-4">No active projects</p>
          <Link to="/projects" className="t-brand hover:opacity-80">Create your first project</Link>
        </div>
      )}
    </div>
  );
}
