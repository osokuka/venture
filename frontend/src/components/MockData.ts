export interface Venture {
  id: string;
  email: string;
  role: 'venture';
  profile: {
    // Step 2: Basic Info
    companyName: string;
    sector: string;
    website: string;
    linkedinUrl: string;
    address: string;
    foundedYear: string;
    employeeCount: string;
    
    // Step 3: Founder & Team
    founderName: string;
    founderLinkedin: string;
    founderRole: string;
    teamMembers: Array<{ name: string; linkedin: string; role: string }>;
    
    // Step 4: Business Info
    market: string;
    problemStatement: string;
    solution: string;
    traction: string;
    fundingNeeds: string;
    fundingAmount: string;
    useOfFunds: string;
    
    // Additional fields
    shortDescription: string;
    customers: string;
    keyMetrics: string;
    needs: string[];
    logo: string;
    pitchDeckUrl: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    registeredAt: string;
  };
}

export interface Investor {
  id: string;
  email: string;
  role: 'investor';
  profile: {
    // Step 2: Basic Info
    investorType: 'individual' | 'firm' | 'corporate' | 'family-office';
    name: string;
    organizationName?: string;
    website?: string;
    linkedinUrl: string;
    phone?: string;
    address?: string;
    investmentExperience: string;
    
    // Step 3: Investment Preferences
    investmentStages: string[];
    industries: string[];
    geographicFocus: string[];
    minInvestment: string;
    maxInvestment: string;
    ticketSize: string;
    
    // Step 4: Profile & Visibility
    bio: string;
    investmentPhilosophy: string;
    notableInvestments?: string;
    isVisible: boolean;
    allowDirectContact: boolean;
    
    // Additional fields
    avatar: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    registeredAt: string;
    portfolioCount: number;
    totalInvested: string;
  };
}

export interface Mentor {
  id: string;
  email: string;
  role: 'mentor';
  profile: {
    // Step 2: Basic Info
    name: string;
    jobTitle: string;
    company: string;
    linkedinUrl: string;
    phone?: string;
    location?: string;
    
    // Step 3: Expertise
    expertise: string[];
    industries: string[];
    experienceYears: string;
    bio: string;
    workExperience: string;
    
    // Step 4: Availability
    availabilityType: string[];
    sessionFormat: string[];
    frequency: string;
    hourlyRate?: string;
    isProBono: boolean;
    maxMentees: string;
    isVisible: boolean;
    
    // Additional fields
    avatar: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    registeredAt: string;
    rating: number;
    totalSessions: number;
    activeMentees: number;
  };
}

// Mock Ventures
export const mockVentures: Venture[] = [
  {
    id: 'v1',
    email: 'sarah@techflow.ai',
    role: 'venture',
    profile: {
      companyName: 'TechFlow AI',
      sector: 'AI/ML',
      website: 'https://techflow.ai',
      linkedinUrl: 'https://linkedin.com/company/techflow-ai',
      address: 'San Francisco, CA, USA',
      foundedYear: '2023',
      employeeCount: '6-10',
      founderName: 'Sarah Chen',
      founderLinkedin: 'https://linkedin.com/in/sarahchen',
      founderRole: 'CEO & Co-founder',
      teamMembers: [
        { name: 'Mike Wang', linkedin: 'https://linkedin.com/in/mikewang', role: 'CTO' },
        { name: 'Lisa Park', linkedin: 'https://linkedin.com/in/lisapark', role: 'Head of Product' }
      ],
      market: 'Enterprise workflow automation for Fortune 500 companies',
      problemStatement: 'Enterprise teams waste 40% of their time on repetitive, manual workflows that could be automated',
      solution: 'AI-powered workflow automation that learns from existing processes and creates intelligent automation without coding',
      traction: '$200K ARR, 45% MoM growth, 15 enterprise customers including 3 Fortune 500 companies',
      fundingNeeds: 'Series A',
      fundingAmount: '$5M',
      useOfFunds: '60% product development, 25% sales & marketing, 15% team expansion',
      shortDescription: 'AI-powered workflow automation for enterprise teams',
      customers: 'Fortune 500 companies, enterprise teams, operations managers',
      keyMetrics: '$200K ARR, 45% MoM growth, 15 enterprise customers, 92% customer satisfaction',
      needs: ['Finance', 'Expert/consultant'],
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=60&h=60&fit=crop&crop=center',
      pitchDeckUrl: '/mock-pitch-decks/techflow-ai.pdf',
      approvalStatus: 'approved',
      registeredAt: '2024-11-15'
    }
  },
  {
    id: 'v2',
    email: 'marcus@greenspace.co',
    role: 'venture',
    profile: {
      companyName: 'GreenSpace',
      sector: 'CleanTech',
      website: 'https://greenspace.co',
      linkedinUrl: 'https://linkedin.com/company/greenspace',
      address: 'Portland, OR, USA',
      foundedYear: '2024',
      employeeCount: '2-5',
      founderName: 'Marcus Rodriguez',
      founderLinkedin: 'https://linkedin.com/in/marcusrodriguez',
      founderRole: 'CEO & Founder',
      teamMembers: [
        { name: 'Elena Vasquez', linkedin: 'https://linkedin.com/in/elenavasquez', role: 'COO' }
      ],
      market: 'Urban farming and sustainable food production for restaurants and retailers',
      problemStatement: 'Urban areas lack access to fresh, locally grown produce, leading to food insecurity and environmental impact',
      solution: 'Modular vertical farming systems that can be deployed in urban spaces with AI-optimized growing conditions',
      traction: '15 pilot customers, $50K MRR, partnerships with 3 major restaurant chains',
      fundingNeeds: 'Seed',
      fundingAmount: '$2M',
      useOfFunds: '50% R&D and product development, 30% market expansion, 20% team building',
      shortDescription: 'Sustainable urban farming solutions for the future of food',
      customers: 'Restaurants, grocery retailers, urban communities, institutions',
      keyMetrics: '$50K MRR, 15 pilot customers, 80% reduction in water usage vs traditional farming',
      needs: ['Finance', 'Access to markets'],
      logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=60&h=60&fit=crop&crop=center',
      pitchDeckUrl: '/mock-pitch-decks/greenspace.pdf',
      approvalStatus: 'approved',
      registeredAt: '2024-12-01'
    }
  },
  {
    id: 'v3',
    email: 'lisa@healthbridge.com',
    role: 'venture',
    profile: {
      companyName: 'HealthBridge',
      sector: 'HealthTech',
      website: 'https://healthbridge.com',
      linkedinUrl: 'https://linkedin.com/company/healthbridge',
      address: 'Boston, MA, USA',
      foundedYear: '2023',
      employeeCount: '11-25',
      founderName: 'Dr. Lisa Park',
      founderLinkedin: 'https://linkedin.com/in/drlisapark',
      founderRole: 'CEO & Co-founder',
      teamMembers: [
        { name: 'James Thompson', linkedin: 'https://linkedin.com/in/jamesthompson', role: 'CTO' },
        { name: 'Rachel Kim', linkedin: 'https://linkedin.com/in/rachelkim', role: 'Head of Clinical Affairs' }
      ],
      market: 'Healthcare providers and patients seeking personalized care solutions',
      problemStatement: 'Patients struggle to access personalized healthcare, leading to delayed diagnoses and suboptimal treatment outcomes',
      solution: 'AI-powered platform connecting patients with personalized care teams and treatment plans',
      traction: '10K active users, partnerships with 5 hospitals, 25% improvement in patient outcomes',
      fundingNeeds: 'Series A',
      fundingAmount: '$8M',
      useOfFunds: '40% product development, 35% clinical trials, 25% market expansion',
      shortDescription: 'Connecting patients with personalized healthcare through AI',
      customers: 'Healthcare providers, hospitals, patients, insurance companies',
      keyMetrics: '10K active users, 5 hospital partnerships, 25% improvement in patient outcomes',
      needs: ['Finance', 'Expert/consultant'],
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=60&h=60&fit=crop&crop=center',
      pitchDeckUrl: '/mock-pitch-decks/healthbridge.pdf',
      approvalStatus: 'approved',
      registeredAt: '2024-10-20'
    }
  },
  {
    id: 'v4',
    email: 'david@fintech-solutions.com',
    role: 'venture',
    profile: {
      companyName: 'FinTech Solutions',
      sector: 'FinTech',
      website: 'https://fintech-solutions.com',
      linkedinUrl: 'https://linkedin.com/company/fintech-solutions',
      address: 'New York, NY, USA',
      foundedYear: '2024',
      employeeCount: '6-10',
      founderName: 'David Chen',
      founderLinkedin: 'https://linkedin.com/in/davidchen',
      founderRole: 'CEO & Founder',
      teamMembers: [
        { name: 'Anna Liu', linkedin: 'https://linkedin.com/in/annaliu', role: 'CTO' },
        { name: 'Tom Wilson', linkedin: 'https://linkedin.com/in/tomwilson', role: 'Head of Finance' }
      ],
      market: 'Small and medium businesses seeking better financial management tools',
      problemStatement: 'SMBs struggle with complex financial management, leading to cash flow issues and poor decision making',
      solution: 'AI-powered financial management platform with automated bookkeeping and predictive analytics',
      traction: '$100K ARR, 200 paying customers, 30% MoM growth',
      fundingNeeds: 'Seed',
      fundingAmount: '$3M',
      useOfFunds: '50% product development, 30% customer acquisition, 20% team expansion',
      shortDescription: 'AI-powered financial management for SMBs',
      customers: 'Small and medium businesses, freelancers, accountants',
      keyMetrics: '$100K ARR, 200 paying customers, 30% MoM growth, 95% customer retention',
      needs: ['Finance', 'Access to markets'],
      logo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=60&h=60&fit=crop&crop=center',
      pitchDeckUrl: '/mock-pitch-decks/fintech-solutions.pdf',
      approvalStatus: 'approved',
      registeredAt: '2024-11-30'
    }
  }
];

// Mock Investors
export const mockInvestors: Investor[] = [
  {
    id: 'i1',
    email: 'sarah.chen@techventures.com',
    role: 'investor',
    profile: {
      investorType: 'firm',
      name: 'Sarah Chen',
      organizationName: 'TechVentures Capital',
      website: 'https://techventures.com',
      linkedinUrl: 'https://linkedin.com/in/sarahchen-vc',
      phone: '+1-555-0123',
      address: 'Palo Alto, CA, USA',
      investmentExperience: '8 years in venture capital, 45+ deals completed',
      investmentStages: ['Seed', 'Series A'],
      industries: ['AI/ML', 'FinTech', 'SaaS'],
      geographicFocus: ['North America', 'Europe'],
      minInvestment: '250k',
      maxInvestment: '5m',
      ticketSize: '$500K - $2M',
      bio: 'Partner at TechVentures Capital with 8 years of experience investing in early-stage technology companies. Former product manager at Google and Stanford MBA.',
      investmentPhilosophy: 'I focus on backing exceptional founders building transformative AI and fintech solutions. I look for strong product-market fit, scalable business models, and teams that can execute at speed.',
      notableInvestments: 'Portfolio includes 3 unicorns and 12 successful exits. Notable investments: DataCorp (acquired by Microsoft), AI Analytics (Series C), PayFlow (IPO 2023)',
      isVisible: true,
      allowDirectContact: true,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b60f163b?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-09-15',
      portfolioCount: 25,
      totalInvested: '$50M+'
    }
  },
  {
    id: 'i2',
    email: 'marcus@greentech-ventures.com',
    role: 'investor',
    profile: {
      investorType: 'firm',
      name: 'Marcus Rodriguez',
      organizationName: 'GreenTech Ventures',
      website: 'https://greentech-ventures.com',
      linkedinUrl: 'https://linkedin.com/in/marcusrodriguez-vc',
      phone: '+1-555-0456',
      address: 'Austin, TX, USA',
      investmentExperience: '12 years in cleantech investing, 60+ investments',
      investmentStages: ['Seed', 'Series A', 'Series B'],
      industries: ['CleanTech', 'Sustainability', 'Energy'],
      geographicFocus: ['North America', 'Europe'],
      minInvestment: '500k',
      maxInvestment: '10m',
      ticketSize: '$1M - $5M',
      bio: 'Managing Partner at GreenTech Ventures, leading investments in climate and sustainability startups. Former strategy consultant at McKinsey and MIT Sloan MBA.',
      investmentPhilosophy: 'Passionate about backing companies solving climate change and sustainability challenges. I invest in scalable solutions with strong unit economics and experienced teams.',
      notableInvestments: 'Portfolio includes leading cleantech companies: SolarFlow (unicorn), WaterTech (acquired by GE), CleanEnergy Systems (Series B)',
      isVisible: true,
      allowDirectContact: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-08-20',
      portfolioCount: 35,
      totalInvested: '$75M+'
    }
  },
  {
    id: 'i3',
    email: 'lisa@innovation-angels.com',
    role: 'investor',
    profile: {
      investorType: 'individual',
      name: 'Dr. Lisa Park',
      linkedinUrl: 'https://linkedin.com/in/drlisapark-angel',
      phone: '+1-555-0789',
      address: 'Boston, MA, USA',
      investmentExperience: '5 years angel investing, 20+ investments',
      investmentStages: ['Pre-Seed', 'Seed'],
      industries: ['HealthTech', 'AI/ML', 'Biotech'],
      geographicFocus: ['North America'],
      minInvestment: '100k',
      maxInvestment: '1m',
      ticketSize: '$100K - $500K',
      bio: 'Angel investor and former Chief Medical Officer at leading healthtech companies. MD from Harvard Medical School, focused on healthcare innovation.',
      investmentPhilosophy: 'I invest in healthcare technologies that improve patient outcomes and reduce costs. I look for founders with deep domain expertise and solutions addressing real clinical needs.',
      notableInvestments: 'Early investor in MedTech Solutions (acquired by Johnson & Johnson), HealthAI (Series A), Telemedicine Platform (IPO pending)',
      isVisible: true,
      allowDirectContact: true,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-10-05',
      portfolioCount: 18,
      totalInvested: '$5M+'
    }
  },
  {
    id: 'i4',
    email: 'robert@stealth-capital.com',
    role: 'investor',
    profile: {
      investorType: 'firm',
      name: 'Robert Kim',
      organizationName: 'Stealth Capital',
      linkedinUrl: 'https://linkedin.com/in/robertkim-vc',
      investmentExperience: '10 years in venture capital',
      investmentStages: ['Series A', 'Series B'],
      industries: ['Enterprise', 'SaaS', 'AI/ML'],
      geographicFocus: ['North America', 'Asia-Pacific'],
      minInvestment: '1m',
      maxInvestment: '25m',
      ticketSize: '$2M - $10M',
      bio: 'Principal at Stealth Capital focusing on enterprise software and AI investments.',
      investmentPhilosophy: 'Focus on scalable enterprise solutions with strong recurring revenue models.',
      isVisible: false, // Private investor
      allowDirectContact: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-09-01',
      portfolioCount: 15,
      totalInvested: '$30M+'
    }
  }
];

// Mock Mentors
export const mockMentors: Mentor[] = [
  {
    id: 'm1',
    email: 'james@stripe.com',
    role: 'mentor',
    profile: {
      name: 'James Wilson',
      jobTitle: 'VP of Sales',
      company: 'Stripe',
      linkedinUrl: 'https://linkedin.com/in/jameswilson',
      phone: '+1-555-1234',
      location: 'San Francisco, CA',
      expertise: ['Go-to-Market', 'Sales', 'Business Development'],
      industries: ['FinTech', 'SaaS', 'Enterprise'],
      experienceYears: '15-20',
      bio: 'VP of Sales at Stripe with 15+ years of experience scaling sales teams from 0 to $100M+ ARR. Previously led sales at Salesforce and founded two successful startups.',
      workExperience: 'Led sales organizations at high-growth companies including Stripe, Salesforce, and two successful startups. Expert in enterprise sales, go-to-market strategy, and international expansion.',
      availabilityType: ['both'],
      sessionFormat: ['Virtual/Video Call', 'Phone Call'],
      frequency: 'Monthly',
      hourlyRate: '$500',
      isProBono: false,
      maxMentees: '3-5',
      isVisible: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-08-15',
      rating: 4.9,
      totalSessions: 87,
      activeMentees: 4
    }
  },
  {
    id: 'm2',
    email: 'emily@entrepreneur.com',
    role: 'mentor',
    profile: {
      name: 'Emily Carter',
      jobTitle: 'Serial Entrepreneur',
      company: 'Carter Ventures',
      linkedinUrl: 'https://linkedin.com/in/emilycarter',
      phone: '+1-555-5678',
      location: 'New York, NY',
      expertise: ['Fundraising', 'Strategy', 'Operations'],
      industries: ['SaaS', 'E-commerce', 'Consumer'],
      experienceYears: '20+',
      bio: 'Serial entrepreneur with 3 successful exits totaling $200M+. Currently investor and advisor helping founders navigate fundraising and scaling challenges.',
      workExperience: 'Founded and scaled three companies: TechCorp (acquired by Oracle for $80M), ConsumerApp (IPO 2019), and DataPlatform (acquired by Microsoft for $120M).',
      availabilityType: ['pro-bono'],
      sessionFormat: ['Virtual/Video Call', 'Email/Async'],
      frequency: 'Bi-weekly',
      isProBono: true,
      maxMentees: '6-10',
      isVisible: true,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-09-10',
      rating: 4.8,
      totalSessions: 156,
      activeMentees: 8
    }
  },
  {
    id: 'm3',
    email: 'david@techcorp.com',
    role: 'mentor',
    profile: {
      name: 'David Zhang',
      jobTitle: 'Chief Technology Officer',
      company: 'TechCorp',
      linkedinUrl: 'https://linkedin.com/in/davidzhang',
      location: 'Seattle, WA',
      expertise: ['Product Development', 'Technology', 'AI/ML'],
      industries: ['AI/ML', 'SaaS', 'Enterprise'],
      experienceYears: '15-20',
      bio: 'CTO with deep expertise in AI/ML and scalable system architecture. Led engineering teams of 100+ developers at leading tech companies.',
      workExperience: 'CTO at TechCorp, former Principal Engineer at Amazon, and tech lead at early-stage startups. Expert in scaling engineering organizations and AI product development.',
      availabilityType: ['paid'],
      sessionFormat: ['Virtual/Video Call'],
      frequency: 'Monthly',
      hourlyRate: '$400',
      isProBono: false,
      maxMentees: '1-2',
      isVisible: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-10-12',
      rating: 4.7,
      totalSessions: 43,
      activeMentees: 2
    }
  },
  {
    id: 'm4',
    email: 'rachel@consulting.com',
    role: 'mentor',
    profile: {
      name: 'Rachel Green',
      jobTitle: 'Management Consultant',
      company: 'McKinsey & Company',
      linkedinUrl: 'https://linkedin.com/in/rachelgreen',
      location: 'Boston, MA',
      expertise: ['Strategy', 'Operations', 'Financial Planning'],
      industries: ['Healthcare', 'CleanTech', 'Consumer'],
      experienceYears: '10-15',
      bio: 'Management consultant specializing in growth strategy and operational excellence for startups and Fortune 500 companies.',
      workExperience: 'Senior consultant at McKinsey & Company with expertise in strategic planning, operational improvements, and market entry strategies.',
      availabilityType: ['both'],
      sessionFormat: ['Virtual/Video Call', 'In-Person'],
      frequency: 'Weekly',
      hourlyRate: '$300',
      isProBono: true,
      maxMentees: '3-5',
      isVisible: false, // Private mentor
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b60f163b?w=60&h=60&fit=crop&crop=face',
      approvalStatus: 'approved',
      registeredAt: '2024-11-01',
      rating: 4.9,
      totalSessions: 78,
      activeMentees: 5
    }
  }
];

// Mock Users for Login (combines all user types)
export const mockUsers = [
  ...mockVentures,
  ...mockInvestors,
  ...mockMentors
];

// Helper functions
export const getVentureById = (id: string): Venture | undefined => 
  mockVentures.find(v => v.id === id);

export const getInvestorById = (id: string): Investor | undefined => 
  mockInvestors.find(i => i.id === id);

export const getMentorById = (id: string): Mentor | undefined => 
  mockMentors.find(m => m.id === id);

export const getUserByEmail = (email: string) => 
  mockUsers.find(u => u.email === email);

export const getPublicInvestors = (): Investor[] => 
  mockInvestors.filter(investor => investor.profile.isVisible);

export const getPublicMentors = (): Mentor[] => 
  mockMentors.filter(mentor => mentor.profile.isVisible);

// Mock messages for the messaging system
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    senderId: 'i1',
    receiverId: 'v1',
    content: 'Hi Sarah, I\'m very interested in TechFlow AI. I\'d like to schedule a call to discuss your Series A round. Could we connect this week?',
    timestamp: '2024-12-10T14:30:00Z',
    read: false
  },
  {
    id: 'msg2',
    senderId: 'v1',
    receiverId: 'i1',
    content: 'Hi Sarah, thank you for reaching out! I\'d be happy to discuss our Series A. I\'m available Thursday or Friday afternoon. What works best for you?',
    timestamp: '2024-12-10T16:45:00Z',
    read: true
  },
  {
    id: 'msg3',
    senderId: 'm1',
    receiverId: 'v2',
    content: 'Marcus, I saw your profile and would love to help with your go-to-market strategy. I have experience scaling sales teams in the sustainability space.',
    timestamp: '2024-12-09T10:15:00Z',
    read: false
  }
];

export const getMessagesBetweenUsers = (userId1: string, userId2: string): Message[] => {
  return mockMessages.filter(msg => 
    (msg.senderId === userId1 && msg.receiverId === userId2) ||
    (msg.senderId === userId2 && msg.receiverId === userId1)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const getUnreadMessagesForUser = (userId: string): Message[] => {
  return mockMessages.filter(msg => msg.receiverId === userId && !msg.read);
};