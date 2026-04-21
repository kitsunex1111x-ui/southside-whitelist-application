import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { rawInsert } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Loader2, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface GangFormData {
  gangName: string;
  gangType: string;
  memberCount: string;
  leaderDiscord: string;
  membersList: string;
  backstory: string;
  experience: string;
  whyJoin: string;
}

const initialData: GangFormData = {
  gangName: "", gangType: "", memberCount: "", leaderDiscord: "",
  membersList: "", backstory: "", experience: "", whyJoin: "",
};

const GangApplication = () => {
  const { user } = useAuth();
  const [data, setData] = useState<GangFormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof GangFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!data.gangName.trim())   { toast.error("Enter your gang name"); return false; }
    if (!data.gangType)          { toast.error("Select a gang type"); return false; }
    if (!data.memberCount || parseInt(data.memberCount) < 1) {
      toast.error("Enter number of members"); return false;
    }
    if (!data.leaderDiscord.trim()) { toast.error("Enter leader Discord ID"); return false; }
    if (!data.membersList.trim())   { toast.error("Enter the members list"); return false; }
    if (!data.backstory.trim() || data.backstory.length < 100) {
      toast.error("Backstory must be at least 100 characters"); return false;
    }
    if (!data.experience.trim()) { toast.error("Describe your RP experience"); return false; }
    if (!data.whyJoin.trim())    { toast.error("Explain why you should be accepted"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user) { toast.error("Please login first"); return; }
    setSubmitting(true);
    try {
      const { error } = await rawInsert("applications", {
        user_id:    user.id,
        type:       "gang",
        real_name:  data.gangName,
        discord:    data.leaderDiscord,
        age:        parseInt(data.memberCount, 10) || 1,
        rdm:        data.gangType,
        vdm:        "N/A",
        metagaming: "N/A",
        powergaming: data.experience,
        char_name:  data.membersList,
        backstory:  data.backstory,
        traits:     data.whyJoin,
        status:     "pending",
      });
      if (error) {
        toast.error(error.message.includes("23505")
          ? "You already have a pending application!"
          : "Failed to submit: " + error.message);
      } else {
        setSubmitted(true);
        toast.success("Gang application submitted!");
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 mx-auto mb-6 flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-4">Application Submitted</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your gang application has been received. We'll review it and contact you via Discord.
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

          <div className="flex items-center gap-4 mb-8">
            <Link to="/apply" className="p-2 rounded-full hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-wider">Gang Application</h1>
              <p className="text-muted-foreground">Apply for official gang faction status</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/80">
              <strong>Requirements:</strong> Unique concept &amp; backstory, active Discord for communication.
              False information will result in immediate denial.
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6">

            {/* Gang Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Gang Name *</label>
              <input type="text" value={data.gangName} onChange={e => update("gangName", e.target.value)}
                placeholder="Enter your gang name"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>

            {/* Gang Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Gang Type *</label>
              <select value={data.gangType} onChange={e => update("gangType", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                <option value="">Select type...</option>
                <option value="street">Street Gang</option>
                <option value="organized">Organized Crime</option>
                <option value="motorcycle">Motorcycle Club</option>
                <option value="mafia">Mafia / Family</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Member Count — no minimum shown */}
            <div>
              <label className="block text-sm font-medium mb-2">Number of Members *</label>
              <input type="number" min="1" value={data.memberCount} onChange={e => update("memberCount", e.target.value)}
                placeholder="e.g. 5"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>

            {/* Leader Discord */}
            <div>
              <label className="block text-sm font-medium mb-2">Leader Discord ID *</label>
              <input type="text" value={data.leaderDiscord} onChange={e => update("leaderDiscord", e.target.value)}
                placeholder="username#0000 or Discord ID"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>

            {/* Members List */}
            <div>
              <label className="block text-sm font-medium mb-2">Members List * (Discord IDs)</label>
              <textarea value={data.membersList} onChange={e => update("membersList", e.target.value)}
                rows={4} className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder={"List all members with their Discord IDs and roles\nExample:\n- Leader: username#0000\n- Member 1: name#0000\n- Member 2: name#0000"} />
            </div>

            {/* Backstory */}
            <div>
              <label className="block text-sm font-medium mb-2">Gang Backstory * <span className="text-muted-foreground font-normal">(min 100 chars)</span></label>
              <textarea value={data.backstory} onChange={e => update("backstory", e.target.value)}
                rows={5} className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Describe your gang's history, how it formed, key events, and current status..." />
              <p className={`text-xs mt-1 ${data.backstory.length >= 100 ? "text-green-400" : "text-muted-foreground"}`}>
                {data.backstory.length}/100 characters
              </p>
            </div>

            {/* RP Experience */}
            <div>
              <label className="block text-sm font-medium mb-2">RP Experience *</label>
              <textarea value={data.experience} onChange={e => update("experience", e.target.value)}
                rows={3} className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Describe your RP experience, previous gangs, server history..." />
            </div>

            {/* Why Accept */}
            <div>
              <label className="block text-sm font-medium mb-2">Why Should We Accept You? *</label>
              <textarea value={data.whyJoin} onChange={e => update("whyJoin", e.target.value)}
                rows={3} className="w-full bg-secondary border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="What makes your gang unique? Why should you be official?" />
            </div>

            <div className="pt-4">
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-heading uppercase tracking-wider py-4 rounded-xl transition-all disabled:opacity-70">
                {submitting
                  ? <><Loader2 className="animate-spin" size={20} /> Submitting...</>
                  : <><Users size={20} /> Submit Gang Application</>}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GangApplication;
