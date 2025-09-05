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
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
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

            {/* Contact Information */}
            <div className="flex items-center space-x-6 text-sm">
              <a
                href="tel:+905456422911"
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <Phone className="h-4 w-4 mr-1" />
                +90 545 642 29 11
              </a>
              <a
                href="mailto:bilgi@u-tronix.com"
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <Mail className="h-4 w-4 mr-1" />
                bilgi@u-tronix.com
              </a>
              <a
                href="https://www.u-tronix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-white hover:text-blue-200 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                www.u-tronix.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            {/* Logo and Title */}
            <div className="flex items-center">
              <img 
                src="/utronix-logo.png" 
                alt="UTRONIX Logo" 
                className="h-10 w-auto mr-4"
                onLoad={() => console.log('Logo loaded successfully')}
                onError={(e) => {
                  console.log('Logo failed to load, using fallback');
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<span class="text-white font-semibold text-2xl">UTRONIX</span>';
                  }
                }}
              />
              <div>
                <h1 className="text-lg text-white font-normal">Order Management System</h1>
              </div>
            </div>

            {/* User Information and Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {profile?.full_name || 'Username'}
                  </p>
                  <p className="text-xs text-blue-200">
                    {profile?.company_name || ''}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Customer'}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log-out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
