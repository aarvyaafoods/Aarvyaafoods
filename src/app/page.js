import MainLayout from '@/components/layout/MainLayout'
import HeroSection      from '@/components/home/HeroSection'
import CategoryStrip    from '@/components/home/CategoryStrip'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import PromoBanner      from '@/components/home/PromoBanner'
import NewArrivals      from '@/components/home/NewArrivals'
import SaleStrip        from '@/components/home/SaleStrip'
import UspStrip         from '@/components/home/UspStrip'
export default function Home() {
  return (
    <MainLayout>
      <HeroSection/>
      <CategoryStrip/>
      <FeaturedProducts/>
      <PromoBanner/>
      <NewArrivals/>
      <SaleStrip/>
      <UspStrip/>
    </MainLayout>
  )
}
