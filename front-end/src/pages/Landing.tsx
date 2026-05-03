import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './Landing.css'

type LoginCard = {
  to: string
  initial: string
  avatarClass: string
  title: string
  description: string
}

const loginCards: LoginCard[] = [
  {
    to: '/admin/login',
    initial: 'A',
    avatarClass: 'landing-login-avatar--admin',
    title: 'Admin',
    description: 'Manage products, rates and inventory. Full system access.',
  },
  {
    to: '/admin/login',
    initial: 'S',
    avatarClass: 'landing-login-avatar--shop-user',
    title: 'Shop User',
    description: 'Place stock requests for your shop and view their status.',
  },
  {
    to: '/admin/login',
    initial: 'I',
    avatarClass: 'landing-login-avatar--inventory',
    title: 'Inventory User',
    description: 'View incoming requests, pack quantities and update dispatch.',
  },
]

export default function Landing() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="relative z-10 px-6 sm:px-8 py-5 flex items-center justify-between gap-3">
        <img src="/logo.png" alt="Kovilpatti Murukku & Snacks" className="h-12 sm:h-14 w-auto" />
        <div className="landing-header-badge px-4 py-2 rounded-lg hidden sm:block">
          <div className="text-xs text-[#FCD835] font-bold uppercase tracking-widest">Inventory Management System</div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="landing-welcome-card text-center mb-8 px-6 py-8 rounded-2xl bg-white">
            <img src="/logo.png" alt="Kovilpatti Murukku & Snacks" className="mx-auto w-56 sm:w-64 h-auto mb-4" />
            <p className="text-[#1F1F1F] text-base font-bold uppercase tracking-widest">Welcome — sign in to continue</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loginCards.map(({ to, initial, avatarClass, title, description }) => (
              <Link
                key={title}
                to={to}
                className="landing-cta-card group flex items-center gap-4 p-4 rounded-2xl text-[#1F1F1F] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                <div className={`landing-login-avatar ${avatarClass}`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold tracking-wide text-[#1F1F1F] uppercase">{title}</h2>
                  <p className="text-[#1F1F1F]/75 text-xs leading-snug font-medium mt-0.5">
                    {description}
                  </p>
                </div>
                <ArrowRight className="flex-shrink-0 w-5 h-5 text-[#1F1F1F] group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>

          <p className="landing-credentials text-center text-xs text-[#1F1F1F]/75 mt-8 px-4 py-2 rounded-lg inline-block w-full font-medium">
            Phase 1 demo — admin login: <code className="text-[#1F1F1F] font-bold">admin / admin123</code>
          </p>
        </div>
      </main>
    </div>
  )
}
