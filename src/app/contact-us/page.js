import MainLayout from '@/components/layout/MainLayout'

const contacts = [
  ['Phone', '7331167628', 'tel:7331167628'],
  ['Email', 'aarvyaa.foods@gmail.com', 'mailto:aarvyaa.foods@gmail.com'],
  ['Address', 'Plot no 10, Chaitanya Nagar, HB Colony, Moulali, Hyderabad - 500040'],
]

const socialLinks = [
  ['Facebook', 'https://www.facebook.com/share/188Zeu7wE5/'],
  ['Instagram', 'https://www.instagram.com/foodsaarvya?igsh=MTByaG9mYnV4Y256Mg=='],
]

export default function ContactUsPage() {
  return (
    <MainLayout>
      <main className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-18">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Contact Aarvya</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink md:text-5xl">We would love to hear from you</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-mid">For natural healthy laddus and weekly subscriptions, contact us using the details below.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {contacts.map(([label, value, href]) => (
            <div key={label} className="rounded-2xl border border-line bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</p>
              {href ? <a href={href} className="mt-2 block text-base font-semibold leading-7 text-ink hover:text-primary">{value}</a> : <p className="mt-2 text-base font-semibold leading-7 text-ink">{value}</p>}
            </div>
          ))}
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Business hours</p>
            <p className="mt-2 text-base font-semibold leading-7 text-ink">Monday to Saturday: 9:00 AM to 7:00 PM</p>
            <p className="text-base font-semibold leading-7 text-ink">Sunday: Holiday</p>
          </div>
        </div>

        <section className="mt-10 rounded-2xl bg-surface-alt p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold text-ink">Follow us</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {socialLinks.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark">
                {label}
              </a>
            ))}
          </div>
        </section>
      </main>
    </MainLayout>
  )
}
