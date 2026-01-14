import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import { validatePassword, sanitizeInput } from '../utils/security';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Key,
  Trash2,
  Save,
  Moon,
  Sun,
  Globe,
  Mail,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { type User as UserType } from './MockData';

interface SettingsProps {
  user: UserType;
}

interface NotificationSettings {
  emailNewMatches: boolean;
  emailMessages: boolean;
  emailInvestmentUpdates: boolean;
  emailWeeklyDigest: boolean;
  pushNewMatches: boolean;
  pushMessages: boolean;
  pushInvestmentUpdates: boolean;
  smsImportantUpdates: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'network' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowDirectMessages: boolean;
  allowProfileSearch: boolean;
}

interface AccountSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  currency: string;
}

export function Settings({ user }: SettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('notifications');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNewMatches: true,
    emailMessages: true,
    emailInvestmentUpdates: true,
    emailWeeklyDigest: false,
    pushNewMatches: true,
    pushMessages: true,
    pushInvestmentUpdates: false,
    smsImportantUpdates: false,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'network',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowDirectMessages: true,
    allowProfileSearch: true,
  });

  // Account settings
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    theme: 'system',
    language: 'en',
    timezone: 'UTC-8',
    currency: 'USD',
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: any) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAccountChange = (key: keyof AccountSettings, value: any) => {
    setAccountSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordChange = (key: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    // Security: Validate and sanitize password inputs
    const currentPassword = sanitizeInput(passwordData.currentPassword, 128);
    const newPassword = sanitizeInput(passwordData.newPassword, 128);
    const confirmPassword = sanitizeInput(passwordData.confirmPassword, 128);
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    // Security: Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] || "Password does not meet requirements");
      return;
    }

    setIsLoading(true);
    try {
      // Call the password change API
      const { userService } = await import('../services/userService');
      await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      
      toast.success("Password changed successfully!");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    setIsLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Data export will be sent to your email within 24 hours");
    } catch (error) {
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    // This would handle account deletion
    toast.success("Account deletion request has been submitted");
  };

  const sectionTabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'data', label: 'Data & Account', icon: Download },
  ];

  const renderNotifications = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Email Notifications</span>
          </CardTitle>
          <CardDescription>
            Choose what email notifications you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Matches</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new investors, mentors, or startups match your criteria
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailNewMatches}
              onCheckedChange={(checked) => handleNotificationChange('emailNewMatches', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Messages</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new direct messages
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailMessages}
              onCheckedChange={(checked) => handleNotificationChange('emailMessages', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Investment Updates</Label>
              <p className="text-sm text-muted-foreground">
                Updates on your investments or funding applications
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailInvestmentUpdates}
              onCheckedChange={(checked) => handleNotificationChange('emailInvestmentUpdates', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Weekly summary of platform activity and opportunities
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailWeeklyDigest}
              onCheckedChange={(checked) => handleNotificationChange('emailWeeklyDigest', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>Push & SMS Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure mobile and SMS notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications for New Matches</Label>
              <p className="text-sm text-muted-foreground">
                Real-time notifications on your mobile device
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushNewMatches}
              onCheckedChange={(checked) => handleNotificationChange('pushNewMatches', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications for Messages</Label>
              <p className="text-sm text-muted-foreground">
                Instant alerts for new messages
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushMessages}
              onCheckedChange={(checked) => handleNotificationChange('pushMessages', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS for Important Updates</Label>
              <p className="text-sm text-muted-foreground">
                Critical updates via SMS (funding confirmations, security alerts)
              </p>
            </div>
            <Switch
              checked={notificationSettings.smsImportantUpdates}
              onCheckedChange={(checked) => handleNotificationChange('smsImportantUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
          <CardDescription>
            Control who can see your profile and information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select 
              value={privacySettings.profileVisibility} 
              onValueChange={(value: 'public' | 'network' | 'private') => handlePrivacyChange('profileVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="space-y-1">
                    <div className="font-medium">Public</div>
                    <div className="text-sm text-muted-foreground">Anyone can view your profile</div>
                  </div>
                </SelectItem>
                <SelectItem value="network">
                  <div className="space-y-1">
                    <div className="font-medium">Network Only</div>
                    <div className="text-sm text-muted-foreground">Only matched connections can view</div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="space-y-1">
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">Profile hidden from searches</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  Display your email on your public profile
                </p>
              </div>
              <Switch
                checked={privacySettings.showEmail}
                onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Phone Number</Label>
                <p className="text-sm text-muted-foreground">
                  Display your phone number on your public profile
                </p>
              </div>
              <Switch
                checked={privacySettings.showPhone}
                onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Location</Label>
                <p className="text-sm text-muted-foreground">
                  Display your location on your public profile
                </p>
              </div>
              <Switch
                checked={privacySettings.showLocation}
                onCheckedChange={(checked) => handlePrivacyChange('showLocation', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
          <CardDescription>
            Control how others can contact you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Direct Messages</Label>
              <p className="text-sm text-muted-foreground">
                Let matched users send you direct messages
              </p>
            </div>
            <Switch
              checked={privacySettings.allowDirectMessages}
              onCheckedChange={(checked) => handlePrivacyChange('allowDirectMessages', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Profile Search</Label>
              <p className="text-sm text-muted-foreground">
                Allow your profile to appear in search results
              </p>
            </div>
            <Switch
              checked={privacySettings.allowProfileSearch}
              onCheckedChange={(checked) => handlePrivacyChange('allowProfileSearch', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccount = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Regional Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your language, timezone, and currency preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={accountSettings.language} onValueChange={(value) => handleAccountChange('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={accountSettings.currency} onValueChange={(value) => handleAccountChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={accountSettings.timezone} onValueChange={(value) => handleAccountChange('timezone', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC-12">UTC-12 (Baker Island)</SelectItem>
                <SelectItem value="UTC-8">UTC-8 (Pacific Time)</SelectItem>
                <SelectItem value="UTC-5">UTC-5 (Eastern Time)</SelectItem>
                <SelectItem value="UTC+0">UTC+0 (GMT)</SelectItem>
                <SelectItem value="UTC+1">UTC+1 (Central European Time)</SelectItem>
                <SelectItem value="UTC+8">UTC+8 (Singapore Time)</SelectItem>
                <SelectItem value="UTC+9">UTC+9 (Japan Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sun className="w-5 h-5" />
            <span>Appearance</span>
          </CardTitle>
          <CardDescription>
            Customize the appearance of the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={accountSettings.theme} onValueChange={(value) => handleAccountChange('theme', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center space-x-2">
                    <SettingsIcon className="w-4 h-4" />
                    <span>System</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Enter your new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirm your new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <button 
            type="button" 
            onClick={changePassword} 
            className="btn-chrome-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Changing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Change Password</span>
              </div>
            )}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require a verification code when signing in
              </p>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage devices that are currently signed in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="font-medium">Current Session</div>
                <div className="text-sm text-muted-foreground">Chrome on macOS • Active now</div>
                <div className="text-xs text-muted-foreground">IP: 192.168.1.100</div>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Current
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataAndAccount = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Data Export</span>
          </CardTitle>
          <CardDescription>
            Download a copy of your data and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can request an export of your personal data, including your profile information, 
            messages, and activity history. The export will be sent to your registered email address.
          </p>
          
          <button 
            onClick={exportData} 
            className="btn-chrome-secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Preparing Export...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Request Data Export</span>
              </div>
            )}
          </button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="btn-chrome text-red-600 border-red-300 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Delete Account</span>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account 
                  and remove all your data from our servers, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Profile information and settings</li>
                    <li>All messages and conversations</li>
                    <li>Investment history and matches</li>
                    <li>Documents and files</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="btn-chrome-secondary">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={deleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'notifications':
        return renderNotifications();
      case 'privacy':
        return renderPrivacy();
      case 'account':
        return renderAccount();
      case 'security':
        return renderSecurity();
      case 'data':
        return renderDataAndAccount();
      default:
        return renderNotifications();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sectionTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === tab.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {renderContent()}
          
          {/* Save Button - Only show for non-destructive sections */}
          {activeSection !== 'data' && activeSection !== 'security' && (
            <div className="flex justify-end pt-6 border-t">
              <button 
                onClick={saveSettings} 
                className="btn-chrome-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}