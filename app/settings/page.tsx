'use client';

import { useState, useEffect } from 'react';
import { Client, Databases } from 'appwrite';
import Link from 'next/link';
import { 
  HomeIcon, 
  TruckIcon, 
  InboxIcon, 
  ChartBarIcon, 
  CogIcon,
  BellIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { account } from '@/lib/appwrite';

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) 
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  shipmentUpdates: boolean;
  systemUpdates: boolean;
}

interface DisplayPreferences {
  timeZone: string;
  dateFormat: string;
  language: string;
}

export default function SettingsPage() {
  const pathname = usePathname();
  
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { href: '/shipments', label: 'Shipments', icon: TruckIcon },
    { href: '/inventory', label: 'Inventory', icon: InboxIcon },
    { href: '/analytics', label: 'Analytics', icon: ChartBarIcon },
    { href: '/products', label: 'Products', icon: InboxIcon },
    { href: '/settings', label: 'Settings', icon: CogIcon },
  ];
  
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: ''
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    shipmentUpdates: true,
    systemUpdates: true
  });

  const [preferences, setPreferences] = useState<DisplayPreferences>({
    timeZone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    language: 'en'
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    // Fetch user data from Appwrite
    const fetchUserData = async () => {
      try {
        const session = await account.get();
        if (!session) return;
        
        const userData = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
          session.$id
        );

        setUserData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          company: userData.company,
          jobTitle: userData.jobTitle
        });

        setNotifications({
          emailNotifications: userData.emailNotifications,
          smsNotifications: userData.smsNotifications,
          shipmentUpdates: userData.shipmentUpdates,
          systemUpdates: userData.systemUpdates
        });

        setPreferences({
          timeZone: userData.timeZone,
          dateFormat: userData.dateFormat,
          language: userData.language
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user settings');
      }
    };

    fetchUserData();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userData.firstName || !userData.lastName || !userData.email || !userData.company) {
      setError('All required fields must be filled.');
      return;
    }

    if (!validateEmail(userData.email)) {
      setError('Invalid email format.');
      return;
    }

    try {
      const session = await account.get();
      
      // Update user data in Appwrite
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        session.$id,
        {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          company: userData.company,
          jobTitle: userData.jobTitle
        }
      );

      // Update email in Appwrite account if changed
      const currentUser = await account.get();
      if (currentUser.email !== userData.email) {
        await account.updateEmail(userData.email, 'current-password');
      }

      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An error occurred while updating your profile');
    }
  };

  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const session = await account.get();
      
      // Update notification preferences in Appwrite
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        session.$id,
        {
          emailNotifications: notifications.emailNotifications,
          smsNotifications: notifications.smsNotifications,
          shipmentUpdates: notifications.shipmentUpdates,
          systemUpdates: notifications.systemUpdates,
          updated_at: new Date()
        }
      );

      setSuccess('Notification preferences updated successfully!');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setError('An error occurred while updating your notification preferences');
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  async function handleLogout(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
    event.preventDefault();
    try {
      await account.deleteSession('current');
      window.location.href = '/auth/login';
    } catch {
      setError('Logout failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toaster position="top-right" />
    
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-slate-800/80 backdrop-blur-md z-50 border-b border-slate-700">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <Link href="/dashboard" className="flex items-center text-white text-xl font-bold">
            <InboxIcon className="w-8 h-8 mr-2 text-indigo-500" />
            Supply<span className="text-green-500">Flow</span>
          </Link>
          <div className="flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center space-x-2 
                  ${pathname === link.href ? 'text-indigo-500' : 'text-gray-300 hover:text-white'}
                  transition-colors duration-300
                `}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            <Link
              href="#"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition-colors duration-300"
            >
              Logout
            </Link>
          </div>
        </div>
      </nav>
    
      <div className="flex min-h-screen pt-20">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-6 fixed left-0 top-16 bottom-0">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    flex items-center space-x-3 py-2 px-4 rounded-lg transition-all duration-300
                    ${pathname === link.href 
                      ? 'bg-gradient-to-r from-indigo-500 to-green-500 text-white'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'}
                  `}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
    
        {/* Main Content */}
        <div className="flex-grow bg-slate-900 p-6 ml-64">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400">Manage your account preferences</p>
            </div>
            
            {error && <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">{error}</div>}
            {success && <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">{success}</div>}
            
            {/* Profile Section */}
            <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
              <div className="flex items-center mb-6">
                <UserIcon className="w-6 h-6 text-indigo-500 mr-3" />
                <h2 className="text-xl font-semibold">Profile Information</h2>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                  <input
                    type="text"
                    value={userData.company}
                    onChange={(e) => setUserData({...userData, company: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={userData.jobTitle}
                    onChange={(e) => setUserData({...userData, jobTitle: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
                >
                  Update Profile
                </button>
              </form>
            </div>
            
            {/* Notification Preferences Section */}
            <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
              <div className="flex items-center mb-6">
                <BellIcon className="w-6 h-6 text-indigo-500 mr-3" />
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
              </div>
              
              <form onSubmit={handleNotificationUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="emailNotifications"
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                      className="h-5 w-5 text-indigo-500 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
                    />
                    <label htmlFor="emailNotifications" className="ml-3 block text-sm text-gray-300">
                      Email Notifications
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="smsNotifications"
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                      className="h-5 w-5 text-indigo-500 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
                    />
                    <label htmlFor="smsNotifications" className="ml-3 block text-sm text-gray-300">
                      SMS Notifications
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="shipmentUpdates"
                      type="checkbox"
                      checked={notifications.shipmentUpdates}
                      onChange={(e) => setNotifications({...notifications, shipmentUpdates: e.target.checked})}
                      className="h-5 w-5 text-indigo-500 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
                    />
                    <label htmlFor="shipmentUpdates" className="ml-3 block text-sm text-gray-300">
                      Shipment Updates
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="systemUpdates"
                      type="checkbox"
                      checked={notifications.systemUpdates}
                      onChange={(e) => setNotifications({...notifications, systemUpdates: e.target.checked})}
                      className="h-5 w-5 text-indigo-500 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
                    />
                    <label htmlFor="systemUpdates" className="ml-3 block text-sm text-gray-300">
                      System Updates
                    </label>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
                >
                  Update Notifications
                </button>
              </form>
            </div>
            
            {/* Display Preferences Section */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center mb-6">
                <GlobeAltIcon className="w-6 h-6 text-indigo-500 mr-3" />
                <h2 className="text-xl font-semibold">Display Preferences</h2>
              </div>
              
              <form className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Time Zone</label>
                    <select
                      value={preferences.timeZone}
                      onChange={(e) => setPreferences({...preferences, timeZone: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date Format</label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({...preferences, dateFormat: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-green-500 hover:from-indigo-600 hover:to-green-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
                >
                  Update Preferences
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}