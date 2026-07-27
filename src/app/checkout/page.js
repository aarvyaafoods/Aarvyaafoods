import MainLayout    from '@/components/layout/MainLayout'
import CheckoutPage  from '@/components/checkout/CheckoutPage'
export const metadata = { title:'Checkout — StatureVogue' }
export default function Checkout() { return <MainLayout hideFooter><CheckoutPage/></MainLayout> }
