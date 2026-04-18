import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Crown, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

const RequestOwner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login to request owner access");
      navigate('/auth');
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    setSubmitting(true);

    try {
      // Create owner request
      const { error } = await supabase
        .from('owner_requests')
        .insert({
          user_id: user.id,
          request_reason: reason.trim(),
          request_status: 'pending'
        });

      if (error) {
        toast.error("Failed to submit request: " + error.message);
      } else {
        toast.success("Owner access request submitted! We'll review it soon.");
        navigate('/dashboard');
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full gradient-red mx-auto mb-6 flex items-center justify-center">
              <Crown className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-4">
              Request <span className="text-primary text-glow-red">Owner</span> Access
            </h1>
            <p className="text-muted-foreground mb-8">
              Request owner access to manage the Southside RP server. All requests are reviewed by server administrators.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-8 animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wide">Request Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you need owner access..."
                  rows={4}
                  className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full gradient-red text-primary-foreground py-3 rounded-md font-heading uppercase tracking-wider text-sm hover:box-glow-red transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full border-4 border-t-primary border-r-transparent border-b-primary animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground transition-colors font-heading uppercase tracking-wide text-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RequestOwner;
