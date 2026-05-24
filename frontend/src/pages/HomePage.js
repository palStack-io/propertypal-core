import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    color: '#38bdf8',
    title: 'Maintenance Tracking',
    desc: 'Seasonal checklists, reminders, and a full history of every task you\'ve completed.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    ),
  },
  {
    color: '#4ade80',
    title: 'Budget & Expenses',
    desc: 'Log home expenses, set category budgets, and export detailed financial reports.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    color: '#3b82f6',
    title: 'Document Storage',
    desc: 'Securely store warranties, contracts, and permits — all searchable and organised.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    color: '#a78bfa',
    title: 'Project Management',
    desc: 'Plan renovations, track progress, and keep contractor details in one place.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
  },
  {
    color: '#ED8936',
    title: 'Appliance Tracking',
    desc: 'Record warranties, service history, and maintenance schedules for every appliance.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    ),
  },
  {
    color: '#f87171',
    title: 'Reports & Analytics',
    desc: 'Generate PDF expense summaries, maintenance histories, and cost-per-room breakdowns.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
];

const ECOSYSTEM = [
  {
    name: 'property',
    suffix: 'Pal',
    color: '#38bdf8',
    status: 'current',
    desc: 'Manage your home, track maintenance, expenses, and documents all in one place.',
    img: '/propertyPal.png',
  },
  {
    name: 'car',
    suffix: 'Pal',
    color: '#f59e0b',
    status: 'soon',
    desc: 'Track vehicle maintenance, fuel economy, service history, and costs.',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </>
    ),
  },
  {
    name: 'pet',
    suffix: 'Pal',
    color: '#f472b6',
    status: 'soon',
    desc: 'Manage pet health records, vet appointments, medications, and care schedules.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    ),
  },
];

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-app)' }}>

      {/* Nav bar */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)' }}>
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/propertyPal.png" alt="propertyPal" className="h-8 w-8" />
            <span className="font-bold text-lg tracking-tight">
              <span className="property-text">property</span><span className="t-primary">Pal</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary px-4 py-2 rounded-md text-sm">Log in</Link>
            <Link to="/signup" className="btn-primary px-4 py-2 rounded-md text-sm">Sign up free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <div className="flex justify-center mb-6">
            <img src="/propertyPal.png" alt="propertyPal" className="h-20 w-20" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            <span className="property-text">property</span><span className="t-primary">Pal</span>
          </h1>
          <p className="text-xl t-secondary mb-3 font-medium">
            Your complete home management platform
          </p>
          <p className="t-muted mb-10 max-w-xl mx-auto leading-relaxed">
            Track maintenance, manage expenses, store documents, and monitor projects —
            everything your home needs, in one organised place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link to="/signup" className="btn-primary px-8 py-3 rounded-md text-base font-semibold">
              Get started free
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3 rounded-md text-base font-semibold">
              Log in
            </Link>
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { label: 'Open source', icon: '◆' },
              { label: 'Self-hostable', icon: '◆' },
              { label: 'Single-property', icon: '◆' },
              { label: 'Docker deploy', icon: '◆' },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-2">
                <span style={{ color: 'var(--brand-primary)', fontSize: '8px' }}>{icon}</span>
                <span className="text-sm t-secondary font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ background: 'var(--bg-sidebar)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything your home needs</h2>
            <p className="t-secondary max-w-xl mx-auto">
              Six core modules built to cover the full lifecycle of homeownership.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ color, title, desc, icon }) => (
              <div key={title} className="card p-6">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}1a` }}
                >
                  <svg className="h-5 w-5" fill="none" stroke={color} viewBox="0 0 24 24">
                    {icon}
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="t-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* palStack Ecosystem */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-block mb-3">
              <span className="badge badge-brand text-xs font-semibold px-3 py-1">palStack ecosystem</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">One family of apps</h2>
            <p className="t-secondary max-w-xl mx-auto">
              propertyPal is the first of a suite of open-source tools to help you manage every corner of your life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ECOSYSTEM.map(({ name, suffix, color, status, desc, img, icon }) => (
              <div
                key={name}
                className="card p-6"
                style={status === 'current' ? { border: `2px solid ${color}`, opacity: 1 } : { opacity: 0.65 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  {img ? (
                    <img src={img} alt={`${name}${suffix}`} className="h-10 w-10 rounded-xl" />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}1a` }}
                    >
                      <svg className="h-5 w-5" fill="none" stroke={color} viewBox="0 0 24 24">
                        {icon}
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-base">
                      <span style={{ color }}>{name}</span>
                      <span className="t-primary">{suffix}</span>
                    </div>
                    <span className={`badge text-xs ${status === 'current' ? 'badge-brand' : 'badge-neutral'}`}>
                      {status === 'current' ? 'Active' : 'Coming soon'}
                    </span>
                  </div>
                </div>
                <p className="t-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: 'var(--bg-sidebar)' }}>
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get organised?</h2>
          <p className="t-secondary mb-8">
            Self-host in minutes with Docker, or run locally for free — no SaaS subscriptions required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link to="/signup" className="btn-primary px-8 py-3 rounded-md text-base font-semibold">
              Get started free
            </Link>
            <a
              href="https://github.com/palStack-io/propertypal-core"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-8 py-3 rounded-md text-base font-semibold"
            >
              View on GitHub
            </a>
          </div>
          <p className="text-sm t-muted">
            Part of the{' '}
            <a href="https://palstack.io" target="_blank" rel="noopener noreferrer" className="t-brand hover:opacity-80">
              palStack
            </a>
            {' '}open-source ecosystem
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/propertyPal.png" alt="propertyPal" className="h-6 w-6" />
              <span className="font-semibold text-sm">
                <span className="property-text">property</span><span className="t-primary">Pal</span>
              </span>
              <span className="t-muted text-xs">by palStack</span>
            </div>
            <div className="flex gap-6 text-sm t-secondary">
              <a href="https://palstack.io" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">palStack.io</a>
              <a href="https://propertyPal.palstack.io" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">Docs</a>
              <a href="https://github.com/palStack-io/propertypal-core" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">GitHub</a>
            </div>
          </div>
          <div className="text-center t-muted text-xs mt-6">
            © 2025 palStack. Open source under MIT.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
