'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Phone, Mail, Instagram, Facebook, Linkedin, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AppHeaderProps {
  onSignOut: () => void
}

export function AppHeader({ onSignOut }: AppHeaderProps) {
  const { profile } = useAuth()

  const handleSignOut = async () => {
    await onSignOut()
    toast.success('Signed out successfully')
  }

  return (
    <>
      {/* Top Contact Bar */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-3 space-y-2 sm:space-y-0">
            {/* Social Media Links */}
            <div className="flex items-center space-x-4">
              <a
                href="https://www.instagram.com/utronixcom/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-200 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61579799001250"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-200 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/utronix-m%C3%BChendislik/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-200 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>

            {/* Contact Information - Hidden on mobile, shown on sm+ */}
            <div className="hidden sm:flex items-center space-x-4 lg:space-x-6 text-xs lg:text-sm">
              <a
                href="tel:+905456422911"
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <Phone className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                <span className="hidden lg:inline">+90 545 642 29 11</span>
                <span className="lg:hidden">+90 545 642 29 11</span>
              </a>
              <a
                href="mailto:bilgi@u-tronix.com"
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <Mail className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                <span className="hidden lg:inline">bilgi@u-tronix.com</span>
                <span className="lg:hidden">bilgi@u-tronix.com</span>
              </a>
              <a
                href="https://www.u-tronix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                <span className="hidden lg:inline">www.u-tronix.com</span>
                <span className="lg:hidden">www.u-tronix.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-5">
            {/* Logo and Title */}
            <div className="flex items-center min-w-0 flex-1">
              <img 
                src="/utronix-logo.png" 
                alt="UTRONIX Logo" 
                className="h-8 sm:h-10 lg:h-12 w-auto mr-2 sm:mr-4 flex-shrink-0"
                onLoad={() => console.log('Logo loaded successfully')}
                onError={(e) => {
                  console.log('Logo failed to load, using fallback');
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-white font-semibold text-lg sm:text-xl lg:text-2xl">UTRONIX</span>';
                  }
                }}
              />
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm text-white font-normal truncate">Order Management System</h1>
              </div>
            </div>

            {/* User Information and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* User Info - Hidden on mobile, shown on sm+ */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white truncate max-w-24">
                    {profile?.full_name || 'Username'}
                  </p>
                  <p className="text-xs text-blue-200 truncate max-w-24">
                    {profile?.company_name || ''}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Customer'}
                </span>
                <span className="sm:hidden">
                  {profile?.role ? profile.role.charAt(0).toUpperCase() : 'C'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log-out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
