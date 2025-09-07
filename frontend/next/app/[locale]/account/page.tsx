import React from 'react';

export const dynamic = 'force-static';

export default async function AccountPlaceholder() {
  return (
    <main className="relative z-10">
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Mi cuenta</h1>
        <p className="text-neutral-300">Pronto aquí podrás gestionar tu plan y tus RUTs.</p>
      </section>
    </main>
  );
}

