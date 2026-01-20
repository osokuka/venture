import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { adminService, type UserListItem } from '../services/adminService';
import { Mail, Shield, CheckCircle, XCircle, Calendar, User, Eye, Globe, Briefcase, MapPin, Link, TrendingUp } from 'lucide-react';

/**
 * AdminUserView
 * Lightweight user detail page for admin to inspect accounts.
 * Opens in a new tab via /dashboard/admin/user-view?userId=...
 */
export function AdminUserView() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [user, setUser] = useState<UserListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setIsLoading(false);
        setError('Missing userId');
        return;
      }
      try {
        setIsLoading(true);
        const data = await adminService.getUserDetail(userId);
        setUser(data);
        setError(null);
      } catch (e: any) {
        console.error('Failed to load user detail', e);
        setError(e?.message || 'Failed to load user detail');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>User not found</CardTitle>
            <CardDescription>{error || 'Unable to load user data.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.close()}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const venture = user.venture_profile;
  const investor = user.investor_profile;
  const mentor = user.mentor_profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-gray-800" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Detail</h1>
              <p className="text-sm text-gray-600">{user.id}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.close()}>
            Close
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-700" />
              {user.full_name || user.email}
            </CardTitle>
            <CardDescription>Account overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm text-gray-700">
              <Badge className="bg-gray-100 text-gray-800">Role: {user.role}</Badge>
              <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {user.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge className={user.is_email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {user.is_email_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                {user.is_email_verified ? 'Email Verified' : 'Email Pending'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Joined</div>
                <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(user.date_joined).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific profile details */}
        {/* Venture profile – show whenever a VentureProfile exists for this user */}
        {venture && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Venture Profile
              </CardTitle>
              <CardDescription>Company, sector, and fundraising context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500">Company</div>
                  <div className="font-medium text-gray-900">{venture.company_name || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Sector</div>
                  <div className="font-medium text-gray-900">{venture.sector || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Website</div>
                  <div className="font-medium text-blue-700 inline-flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    {venture.website ? (
                      <a href={venture.website} target="_blank" rel="noopener noreferrer" className="underline">
                        {venture.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">LinkedIn</div>
                  <div className="font-medium text-blue-700 inline-flex items-center gap-2">
                    <Link className="w-4 h-4 text-gray-400" />
                    {venture.linkedin_url ? (
                      <a href={venture.linkedin_url} target="_blank" rel="noopener noreferrer" className="underline">
                        {venture.linkedin_url}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Location</div>
                  <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {venture.address || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Founded / Team Size</div>
                  <div className="font-medium text-gray-900">
                    {venture.year_founded || '—'} / {venture.employees_count ?? '—'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-1">Short Description</div>
                <div className="text-gray-900 whitespace-pre-wrap">
                  {venture.short_description || '—'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 mb-1">Customers</div>
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {venture.customers || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Key Metrics</div>
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {venture.key_metrics || '—'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-1">Needs / Interests</div>
                <div className="text-gray-900">
                  {Array.isArray(venture.needs) && venture.needs.length > 0
                    ? venture.needs.join(', ')
                    : '—'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investor profile – show whenever an InvestorProfile exists for this user */}
        {investor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Investor Profile
              </CardTitle>
              <CardDescription>Ticket size, stages, industries, and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {/* Basic Information Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Full Name</div>
                    <div className="font-medium text-gray-900">
                      {investor.full_name || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Organization</div>
                    <div className="font-medium text-gray-900">
                      {investor.organization_name || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Contact Email</div>
                    <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {investor.email || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Phone</div>
                    <div className="font-medium text-gray-900">
                      {investor.phone || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Address</div>
                    <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {investor.address || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Investor Type</div>
                    <div className="font-medium text-gray-900">
                      {investor.investor_type ? (
                        <Badge variant="outline">
                          {investor.investor_type === 'INDIVIDUAL' ? 'Individual' :
                           investor.investor_type === 'FIRM' ? 'Firm' :
                           investor.investor_type === 'CORPORATE' ? 'Corporate' :
                           investor.investor_type === 'FAMILY_OFFICE' ? 'Family Office' :
                           investor.investor_type}
                        </Badge>
                      ) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Website</div>
                    <div className="font-medium text-blue-700 inline-flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {investor.website ? (
                        <a
                          href={investor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {investor.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">LinkedIn</div>
                    <div className="font-medium text-blue-700 inline-flex items-center gap-2">
                      <Link className="w-4 h-4 text-gray-400" />
                      {investor.linkedin_url ? (
                        <a
                          href={investor.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {investor.linkedin_url}
                        </a>
                      ) : investor.linkedin_or_website ? (
                        <a
                          href={investor.linkedin_or_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {investor.linkedin_or_website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Background Section */}
              {(investor.bio || investor.investment_experience || investor.investment_philosophy || investor.notable_investments) && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Professional Background</h3>
                  {investor.bio && (
                    <div>
                      <div className="text-gray-500 mb-1">Bio</div>
                      <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {investor.bio}
                      </div>
                    </div>
                  )}
                  {investor.investment_experience && (
                    <div>
                      <div className="text-gray-500 mb-1">Investment Experience</div>
                      <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {investor.investment_experience}
                      </div>
                    </div>
                  )}
                  {investor.investment_philosophy && (
                    <div>
                      <div className="text-gray-500 mb-1">Investment Philosophy</div>
                      <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {investor.investment_philosophy}
                      </div>
                    </div>
                  )}
                  {investor.notable_investments && (
                    <div>
                      <div className="text-gray-500 mb-1">Notable Investments</div>
                      <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {investor.notable_investments}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Status Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Profile Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Status</div>
                    <div className="font-medium text-gray-900">
                      <Badge className={investor.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                       investor.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                       investor.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                                       'bg-gray-100 text-gray-800'}>
                        {investor.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Visible to Ventures</div>
                    <div className="font-medium text-gray-900">
                      {investor.visible_to_ventures ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">No</Badge>
                      )}
                    </div>
                  </div>
                  {investor.submitted_at && (
                    <div>
                      <div className="text-gray-500">Submitted At</div>
                      <div className="font-medium text-gray-900">
                        {new Date(investor.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {investor.approved_at && (
                    <div>
                      <div className="text-gray-500">Approved At</div>
                      <div className="font-medium text-gray-900">
                        {new Date(investor.approved_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Investment Focus Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Investment Focus</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(investor.min_investment || investor.max_investment) && (
                    <div>
                      <div className="text-gray-500">Investment Range</div>
                      <div className="font-medium text-gray-900">
                        {investor.min_investment && investor.max_investment
                          ? `${investor.min_investment} - ${investor.max_investment}`
                          : investor.min_investment
                            ? `Min: ${investor.min_investment}`
                            : `Max: ${investor.max_investment}`}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-500">Typical Ticket Size</div>
                    <div className="font-medium text-gray-900">
                      {investor.average_ticket_size ? (
                        <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
                          {investor.average_ticket_size}
                        </Badge>
                      ) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Investment Experience</div>
                    <div className="font-medium text-gray-900">
                      {investor.investment_experience_years !== undefined
                        ? `${investor.investment_experience_years} years`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Deals</div>
                    <div className="font-medium text-gray-900">
                      {investor.deals_count !== undefined && investor.deals_count !== null
                        ? investor.deals_count
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Allow Direct Contact</div>
                    <div className="font-medium text-gray-900">
                      {investor.allow_direct_contact !== false ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">No</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment Preferences Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Investment Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 mb-2">Investment Stages</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(investor.stage_preferences) && investor.stage_preferences.length > 0 ? (
                        investor.stage_preferences.map((stage, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {stage}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-2">Industries</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(investor.industry_preferences) && investor.industry_preferences.length > 0 ? (
                        investor.industry_preferences.map((industry, idx) => (
                          <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {industry}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                  {Array.isArray(investor.geographic_focus) && investor.geographic_focus.length > 0 && (
                    <div>
                      <div className="text-gray-500 mb-2">Geographic Focus</div>
                      <div className="flex flex-wrap gap-2">
                        {investor.geographic_focus.map((region, idx) => (
                          <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mentor profile – show whenever a MentorProfile exists for this user */}
        {mentor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Mentor Profile
              </CardTitle>
              <CardDescription>Expertise, industries, and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {/* Basic Information Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Full Name</div>
                    <div className="font-medium text-gray-900">
                      {mentor.full_name || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Contact Email</div>
                    <div className="font-medium text-gray-900 inline-flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {mentor.contact_email || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Job Title</div>
                    <div className="font-medium text-gray-900">
                      {mentor.job_title || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Company / Organization</div>
                    <div className="font-medium text-gray-900">
                      {mentor.company || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Phone</div>
                    <div className="font-medium text-gray-900">
                      {mentor.phone || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">LinkedIn / Website</div>
                    <div className="font-medium text-blue-700 inline-flex items-center gap-2">
                      <Link className="w-4 h-4 text-gray-400" />
                      {mentor.linkedin_or_website ? (
                        <a
                          href={mentor.linkedin_or_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {mentor.linkedin_or_website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Status Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Profile Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Status</div>
                    <div className="font-medium text-gray-900">
                      <Badge className={mentor.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                       mentor.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                       mentor.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                                       'bg-gray-100 text-gray-800'}>
                        {mentor.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Visible to Ventures</div>
                    <div className="font-medium text-gray-900">
                      {mentor.visible_to_ventures ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">No</Badge>
                      )}
                    </div>
                  </div>
                  {mentor.submitted_at && (
                    <div>
                      <div className="text-gray-500">Submitted At</div>
                      <div className="font-medium text-gray-900">
                        {new Date(mentor.submitted_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {mentor.approved_at && (
                    <div>
                      <div className="text-gray-500">Approved At</div>
                      <div className="font-medium text-gray-900">
                        {new Date(mentor.approved_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Background Section */}
              {mentor.experience_overview && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Professional Background</h3>
                  <div>
                    <div className="text-gray-500 mb-1">Experience Overview</div>
                    <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                      {mentor.experience_overview || '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Expertise & Industries Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Expertise & Industries</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 mb-2">Expertise Fields</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(mentor.expertise_fields) && mentor.expertise_fields.length > 0 ? (
                        mentor.expertise_fields.map((field, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {field}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-2">Industries of Interest</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(mentor.industries_of_interest) && mentor.industries_of_interest.length > 0 ? (
                        mentor.industries_of_interest.map((industry, idx) => (
                          <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {industry}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Details Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Engagement Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Engagement Type</div>
                    <div className="font-medium text-gray-900">
                      {mentor.engagement_type ? (
                        <Badge className={
                          mentor.engagement_type === 'PAID' ? 'bg-green-100 text-green-800' :
                          mentor.engagement_type === 'PRO_BONO' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }>
                          {mentor.engagement_type === 'PAID' ? 'Paid' :
                           mentor.engagement_type === 'PRO_BONO' ? 'Pro Bono' :
                           'Both'}
                        </Badge>
                      ) : '—'}
                    </div>
                  </div>
                  {mentor.engagement_type === 'PAID' || mentor.engagement_type === 'BOTH' ? (
                    <>
                      <div>
                        <div className="text-gray-500">Rate Type</div>
                        <div className="font-medium text-gray-900">
                          {mentor.paid_rate_type || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Rate Amount</div>
                        <div className="font-medium text-gray-900">
                          {mentor.paid_rate_amount ? `$${Number(mentor.paid_rate_amount).toLocaleString()}` : '—'}
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <div className="text-gray-500">Preferred Engagement</div>
                    <div className="font-medium text-gray-900">
                      {mentor.preferred_engagement ? (
                        <Badge variant="outline">
                          {mentor.preferred_engagement === 'VIRTUAL' ? 'Virtual' :
                           mentor.preferred_engagement === 'IN_PERSON' ? 'In Person' :
                           'Both'}
                        </Badge>
                      ) : '—'}
                    </div>
                  </div>
                  {Array.isArray(mentor.availability_types) && mentor.availability_types.length > 0 && (
                    <div>
                      <div className="text-gray-500 mb-2">Availability Types</div>
                      <div className="flex flex-wrap gap-2">
                        {mentor.availability_types.map((type, idx) => (
                          <Badge key={idx} variant="outline" className="bg-gray-50 text-gray-700">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

