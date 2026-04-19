import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Users, Shield, X } from "lucide-react";

interface ApplicationType {
  id: "gang" | "staff";
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requirements: string[];
}

const applicationTypes: ApplicationType[] = [
  {
    id: "gang",
    title: "Gang Application",
    description: "Apply to create or join an official gang faction. Build your empire, control territory, and rise through the ranks.",
    icon: <Users className="w-8 h-8" />,
    color: "from-red-600 to-red-800",
    requirements: [
      "Minimum 3 active members",
      "Unique gang concept & backstory",
      "Understanding of gang RP rules",
      "Discord for communication"
    ]
  },
  {
    id: "staff",
    title: "Staff Application",
    description: "Join our team as admin, moderator, or support staff. Help maintain the server and assist players.",
    icon: <Shield className="w-8 h-8" />,
    color: "from-blue-600 to-blue-800",
    requirements: [
      "Mature & professional attitude",
      "Experience with FiveM/server moderation",
      "Available time commitment",
      "Good communication skills"
    ]
  }
];

const ApplicationsHub = () => {
  const [selectedApp, setSelectedApp] = useState<ApplicationType | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-heading text-5xl font-bold uppercase tracking-wider mb-4">
              Choose Your <span className="text-primary text-glow-red">Path</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Select the application type that fits your goals. Each path has different requirements and responsibilities.
            </p>
          </div>

          {/* Application Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {applicationTypes.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="group relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${app.color} mb-6`}>
                    {app.icon}
                  </div>

                  {/* Title */}
                  <h2 className="font-heading text-2xl font-bold uppercase tracking-wide mb-3">
                    {app.title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {app.description}
                  </p>

                  {/* Requirements Preview */}
                  <div className="space-y-2 mb-6">
                    <p className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Requirements:</p>
                    <ul className="space-y-1">
                      {app.requirements.slice(0, 3).map((req, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-primary font-heading uppercase tracking-wider text-sm group-hover:gap-4 transition-all">
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Back to Dashboard */}
          <div className="text-center">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-8 animate-in fade-in zoom-in duration-200">
            {/* Close */}
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${selectedApp.color} mb-6`}>
              {selectedApp.icon}
            </div>

            {/* Title */}
            <h2 className="font-heading text-2xl font-bold uppercase tracking-wide mb-2">
              {selectedApp.title}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              {selectedApp.description}
            </p>

            {/* All Requirements */}
            <div className="bg-secondary/50 rounded-xl p-5 mb-6">
              <p className="text-sm font-medium text-foreground/80 uppercase tracking-wider mb-4">
                All Requirements:
              </p>
              <ul className="space-y-3">
                {selectedApp.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action */}
            <Link
              to={`/apply/${selectedApp.id}`}
              className={`block w-full text-center py-4 rounded-xl font-heading uppercase tracking-wider text-sm bg-gradient-to-r ${selectedApp.color} hover:opacity-90 transition-opacity`}
            >
              Start {selectedApp.title}
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ApplicationsHub;
