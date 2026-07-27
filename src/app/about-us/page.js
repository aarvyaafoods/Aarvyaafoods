import MainLayout from '@/components/layout/MainLayout'

export default function AboutUsPage() {
  return (
    <MainLayout>
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-18">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">About Aarvya</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink md:text-5xl">Natural healthy laddus for everyday nourishment</h1>

        <div className="mt-8 space-y-6 text-base leading-8 text-ink-mid">
          <p>
            Aarvya is a natural healthy laddu-making brand. We make laddus like natural supplements that you can consume daily or three times a week. Our laddus help fulfil your daily vitamin and protein requirements.
          </p>
          <p>
            We provide natural laddus through a weekly subscription, with a menu that changes every week. Taste with health is at the heart of what we do: unique taste and unique variants for our unique customers.
          </p>
        </div>

        <section className="mt-10 rounded-2xl bg-surface-alt p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold text-ink">Our service</h2>
          <p className="mt-3 text-base leading-7 text-ink-mid">Natural healthy laddu supplier for all ages.</p>
        </section>
      </main>
    </MainLayout>
  )
}
