import React from 'react';

export default function SettingsAbout() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">About propertyPal</h2>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <img src="/propertyPal.png" alt="propertyPal" className="h-16 w-16" />
          <div>
            <h3 className="text-2xl font-bold">
              <span className="t-brand">property</span><span className="t-primary">Pal</span>
            </h3>
            <p className="t-secondary text-sm">Open Source Property Management</p>
            <p className="t-muted text-xs mt-1">Version 1.0.0 (Core)</p>
          </div>
        </div>

        <div className="card p-4">
          <p className="t-primary">
            propertyPal is a comprehensive property management tool designed for homeowners.
            Track maintenance, manage documents, monitor expenses, and stay on top of your property's needs.
          </p>
        </div>

        <div className="border-t border-themed pt-6">
          <h3 className="text-lg font-medium mb-4">Part of the palStack Ecosystem</h3>
          <p className="t-secondary text-sm mb-4">
            propertyPal is part of the palStack family of open-source tools designed to help you manage your life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { href: 'https://palstack.io',             emoji: '🏠', title: 'palStack.io',      sub: 'Explore the ecosystem' },
              { href: 'https://propertyPal.palstack.io', emoji: '📘', title: 'propertyPal Docs', sub: 'Documentation & guides' },
            ].map(({ href, emoji, title, sub }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="card p-4 transition-colors">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{emoji}</div>
                  <div>
                    <div className="font-medium t-primary">{title}</div>
                    <div className="text-sm t-secondary">{sub}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-themed pt-6">
          <h3 className="text-lg font-medium mb-4">Open Source</h3>
          <p className="t-secondary text-sm mb-4">
            propertyPal Core is open source and available on GitHub. Contributions are welcome!
          </p>
          <a href="https://github.com/palStack-io/propertypal-core" target="_blank" rel="noopener noreferrer"
            className="card inline-flex items-center px-4 py-2 transition-colors">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>

        <div className="border-t border-themed pt-6 text-center t-muted text-sm">
          <p>Made with ❤️ by the palStack team</p>
          <p className="mt-1">© 2024 palStack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
