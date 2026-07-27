'use client'
import Header from './Header'
import Footer from './Footer'
import AnnouncementBar from './AnnouncementBar'
export default function MainLayout({ children, hideFooter=false }) {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <AnnouncementBar/>
      <Header/>
      <main className="fade-up">{children}</main>
      {!hideFooter && <Footer/>}
    </div>
  )
}
