import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function FAQSection() {
  const faqs = [
    {
      question: "How does VentureLink's matching system work?",
      answer: "Our intelligent matching algorithm considers multiple factors including industry, funding stage, investment size, geographic preferences, and specific expertise needs. For investors, we match based on your stated investment criteria and portfolio focus. For mentors, we align your expertise areas with startup needs. Ventures are matched based on their industry, stage, and specific requirements."
    },
    {
      question: "What are the costs associated with using VentureLink?",
      answer: "VentureLink is free to join for all user types. Ventures can create profiles and connect with investors at no cost. Investors have free access to browse pre-vetted startups. Mentors can set their own rates for consulting services or offer pro-bono mentoring. We only charge a small success fee when funding rounds are completed through our platform."
    },
    {
      question: "How do you verify and vet users on the platform?",
      answer: "We have a comprehensive verification process for all users. Ventures undergo profile verification including company registration checks, founder background verification, and traction validation. Investors are verified through accreditation checks and investment history validation. Mentors are verified through professional background checks and expertise validation. This ensures high-quality connections for everyone."
    },
    {
      question: "What types of investors are active on VentureLink?",
      answer: "Our investor network includes angel investors, venture capital firms, family offices, corporate venture arms, and institutional investors. They span all stages from pre-seed to Series C+ and cover diverse industries including technology, healthcare, fintech, cleantech, consumer goods, and more. We have both local and international investors actively using the platform."
    },
    {
      question: "How long does the approval process take?",
      answer: "Most profiles are reviewed and approved within 24-48 hours. The timeline may vary based on the completeness of your application and any additional verification requirements. We prioritize thorough vetting to maintain platform quality, so some applications may require additional documentation or clarification before approval."
    },
    {
      question: "Can I control my visibility on the platform?",
      answer: "Yes, all users have comprehensive privacy controls. Investors can choose to browse startups anonymously and control when their information is shared. Mentors can set their availability and visibility preferences. Ventures can control which information is publicly visible and which requires approval to access. You have full control over your professional presence on the platform."
    },
    {
      question: "What kind of support does VentureLink provide?",
      answer: "We provide comprehensive support including onboarding assistance, profile optimization guidance, matching recommendations, and ongoing platform support. Our team includes experienced professionals who can help with fundraising strategy, investor preparation, and mentor matching. We also offer resources, webinars, and community events to help users succeed."
    },
    {
      question: "How do I get started if I'm not sure which category I fit into?",
      answer: "If you're unsure about your role or have multiple roles (e.g., you're both an investor and potential mentor), you can start by contacting our team. We offer consultation calls to help determine the best approach for your situation. You can also register in multiple categories if appropriate, though each will require separate profile verification."
    }
  ];

  return (
    <div className="py-20 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Get answers to common questions about VentureLink and how our platform works.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border rounded-lg px-6 data-[state=open]:bg-secondary/20"
            >
              <AccordionTrigger className="text-left hover:no-underline py-6">
                <span className="pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-2 text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@ventureuplink.com" 
              className="text-primary hover:underline"
            >
              support@ventureuplink.com
            </a>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <a 
              href="#contact" 
              className="text-primary hover:underline"
            >
              Contact our team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}