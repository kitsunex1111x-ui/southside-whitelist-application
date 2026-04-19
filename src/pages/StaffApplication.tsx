import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Loader2, Shield, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface StaffFormData {
  position: string;
  realName: string;
  age: string;
  discord: string;
  timezone: string;
  availability: string;
  experience: string;
  whyStaff: string;
  scenarios: string;
  strengths: string;
  weaknesses: string;
}

const initialData: StaffFormData = {
  position: "", realName: "", age: "", discord: "", timezone: "",
  availability: "", experience: "", whyStaff: "", scenarios: "",
  strengths: "", weaknesses: ""
};

const positions = [
  { value: "support", label: "Support Staff - Help players with issues" },
  { value: "mod", label: "Moderator - Enforce rules, handle reports" },
  { value: "admin", label: "Admin - Full server management" },
  { value: "developer", label: "Developer - Scripts, systems, fixes" }
];

const StaffApplication = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StaffFormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof StaffFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!data.position) { toast.error("Select a position"); return false; }
    if (!data.realName.trim()) { toast.error("Enter your real name"); return false; }
    if (!data.age || parseInt(data.age) < 16) { toast.error("Must be 16+ years old"); return false; }
    if (!data.discord.trim()) { toast.error("Enter Discord ID"); return false; }
    if (!data.timezone.trim()) { toast.error("Enter your timezone"); return false; }
    if (!data.availability.trim()) { toast.error("Enter availability"); return false; }
    if (!data.experience.trim() || data.experience.length < 50) { 
      toast.error("Experience must be at least 50 characters"); return false; 
    }
    if (!data.whyStaff.trim() || data.whyStaff.length < 50) { 
      toast.error("Why staff must be at least 50 characters"); return false; 
    }
    if (!data.scenarios.trim()) { toast.error("Answer scenario questions"); return false; }
    if (!data.strengths.trim()) { toast.error("List your strengths"); return false; }
    if (!data.weaknesses.trim()) { toast.error("List your weaknesses"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) { toast.error("Please login first"); return; }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("applications").insert({
        user_id: user.id,
        type: "staff",
        real_name: data.realName,
        discord: data.discord,
        age: parseInt(data.age, 10) || 16, // DB is INTEGER
        rdm: data.position,
        vdm: data.timezone,
        metagaming: data.availability,
        powergaming: data.experience,
        char_name: data.strengths,
        backstory: data.whyStaff,
        traits: data.scenarios,
        status: "pending"
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a pending application!");
        } else {
          toast.error("Failed to submit: " + error.message);
        }
      } else {
        setSubmitted(true);
        toast.success("Staff application submitted!");
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 mx-auto mb-6 flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-4">
              Application Submitted
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your staff application has been received. We'll review your experience and contact you soon.
            </p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 gradient-red text-primary-foreground px-8 py-3 rounded-md font-heading uppercase tracking-wider hover:box-glow-red transition-all">
              Go to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/apply" className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-wider">
                Staff Application
              </h1>
              <p className="text-muted-foreground">Join our team and help the community</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
            
            {/* Position */}
            <div>
              <label className="block text-sm font-medium mb-2">Position Applying For *</label>
              <select
                value={data.position}
                onChange={(e) => update("position", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="">Select position...</option>
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>

            {/* Real Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Real Name *</label>
              <input
                type="text"
                value={data.realName}
                onChange={(e) => update("realName", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Your real name"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium mb-2">Age * (16+)</label>
              <input
                type="number"
                min="16"
                value={data.age}
                onChange={(e) => update("age", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="18"
              />
            </div>

            {/* Discord */}
            <div>
              <label className="block text-sm font-medium mb-2">Discord ID *</label>
              <input
                type="text"
                value={data.discord}
                onChange={(e) => update("discord", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="username#0000"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Clock size={16} /> Timezone *
              </label>
              <input
                type="text"
                value={data.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="e.g., EST, GMT+1, PST"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium mb-2">Weekly Availability *</label>
              <textarea
                value={data.availability}
                onChange={(e) => update("availability", e.target.value)}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="How many hours per week can you dedicate? What days/times?"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium mb-2">Staff/Admin Experience *</label>
              <textarea
                value={data.experience}
                onChange={(e) => update("experience", e.target.value)}
                rows={4}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="List previous staff positions, servers, responsibilities, duration..."
              />
              <p className="text-xs text-muted-foreground mt-1">{data.experience.length}/50 characters minimum</p>
            </div>

            {/* Why Staff */}
            <div>
              <label className="block text-sm font-medium mb-2">Why Do You Want to Be Staff? *</label>
              <textarea
                value={data.whyStaff}
                onChange={(e) => update("whyStaff", e.target.value)}
                rows={4}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Explain your motivation, what you bring to the team, why we should choose you..."
              />
              <p className="text-xs text-muted-foreground mt-1">{data.whyStaff.length}/50 characters minimum</p>
            </div>

            {/* Scenarios */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <MessageSquare size={16} /> Scenario Responses *
              </label>
              <div className="bg-secondary/50 rounded-lg p-4 mb-3 text-sm text-muted-foreground">
                <p className="mb-2"><strong>Scenario 1:</strong> A player reports being RDM'd but there's no evidence. What do you do?</p>
                <p className="mb-2"><strong>Scenario 2:</strong> Two gangs are arguing in OOC chat. How do you handle it?</p>
                <p><strong>Scenario 3:</strong> A friend breaks a rule. How do you respond?</p>
              </div>
              <textarea
                value={data.scenarios}
                onChange={(e) => update("scenarios", e.target.value)}
                rows={5}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Answer all three scenarios..."
              />
            </div>

            {/* Strengths */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Strengths *</label>
              <textarea
                value={data.strengths}
                onChange={(e) => update("strengths", e.target.value)}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="What makes you a good candidate? Communication, patience, problem-solving..."
              />
            </div>

            {/* Weaknesses */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Weaknesses *</label>
              <textarea
                value={data.weaknesses}
                onChange={(e) => update("weaknesses", e.target.value)}
                rows={2}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Be honest - what areas do you need to improve?"
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-heading uppercase tracking-wider py-4 rounded-xl transition-all disabled:opacity-70"
              >
                {submitting ? (
                  <><Loader2 className="animate-spin" size={20} /> Submitting...</>
                ) : (
                  <><Shield size={20} /> Submit Staff Application</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StaffApplication;
