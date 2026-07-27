'use client'
import { useEffect, useState } from 'react'
import { catalogApi } from '@/lib/api'

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([])
  const [current, setCurrent] = useState(0)
  const shouldSlide = announcements.length > 1

  useEffect(() => {
    catalogApi.home()
      .then(data => {
        const messages = data.announcementBar?.messages?.filter(Boolean)
        setAnnouncements(messages || [])
      })
      .catch(() => setAnnouncements([]))
  }, [])

  useEffect(() => {
    setCurrent(0)
    if (!shouldSlide) return undefined
    const timer = window.setInterval(() => {
      setCurrent(index => (index + 1) % announcements.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [announcements.length, shouldSlide])

  if (!announcements.length) return null

  return (
    <div className="announcement-bar bg-primary text-white text-center text-xs tracking-[0.15em] uppercase font-bold font-body" aria-label="Store announcements">
      <div className={`announcement-bar__cube ${shouldSlide ? 'announcement-bar__cube--active' : ''}`} key={current}>
        <div className="announcement-bar__item px-3">
          {announcements[current]}
        </div>
      </div>
    </div>
  )
}
