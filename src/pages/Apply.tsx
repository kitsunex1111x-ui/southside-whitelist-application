import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  realName: string;
  discord: string;
  age: string;
  rdm: string;
  vdm: string;
  metagaming: string;
  powergaming: string;
  charName: string;
  backstory: string;
  traits: string;
}

const initialData: FormData = {
  realName: "", discord: "", age: "",
  rdm: "", vdm: "", metagaming: "", powergaming: "",
  charName: "", backstory: "", traits: "",
};

const stepTitles = ["Personal Info", "RP Knowledge", "Character Creation"];

const Apply = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationAttempts, setValidationAttempts] = useState<{[key: number]: boolean}>({});

  const update = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 0: // Personal Info
        if (!data.realName.trim()) {
          toast.error("Please enter your real name");
          return false;
        }
        if (!data.discord.trim()) {
          toast.error("Please enter your Discord ID");
          return false;
        }
        if (!data.age.trim()) {
          toast.error("Please enter your age");
          return false;
        }
        return true;
        
      case 1: // RP Knowledge
        if (!data.rdm.trim()) {
          toast.error("Please explain what RDM is");
          return false;
        }
        if (!data.vdm.trim()) {
          toast.error("Please explain what VDM is");
          return false;
        }
        if (!data.metagaming.trim()) {
          toast.error("Please explain what Metagaming is");
          return false;
        }
        if (!data.powergaming.trim()) {
          toast.error("Please explain what Powergaming is");
          return false;
        }
        return true;
        
      case 2: // Character Creation
        if (!data.charName.trim()) {
          toast.error("Please enter your character name");
          return false;
        }
        if (!data.backstory.trim()) {
          toast.error("Please write your character backstory");
          return false;
        }
        if (!data.traits.trim()) {
          toast.error("Please describe your character traits");
          return false;
        }
        return true;
        
      default:
        return false;
    }
  };

  const canProceedToNext = () => {
    const isValid = validateStep(step);
    if (!isValid) {
      setValidationAttempts(prev => ({ ...prev, [step]: true }));
    }
    return isValid;
  };

  // canSubmit just triggers error highlighting without toasts (toasts come from handleSubmit)
  const canSubmit = () => {
    const allFilled = ['realName', 'discord', 'age', 'rdm', 'vdm', 'metagaming', 'powergaming', 'charName', 'backstory', 'traits']
      .every(f => data[f as keyof FormData].trim() !== '');
    if (!allFilled) {
      setValidationAttempts({ 0: true, 1: true, 2: true });
    }
    return allFilled;
  };

  const validateForm = () => {
    const requiredFields = ['realName', 'discord', 'age', 'rdm', 'vdm', 'metagaming', 'powergaming', 'charName', 'backstory', 'traits'];
    const missingFields = requiredFields.filter(field => !data[field as keyof FormData].trim());
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    const ageStr = String(data.age).trim();
    if (!ageStr) {
      toast.error("Please enter your age");
      return false;
    }
    
    const ageNum = parseInt(ageStr, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      toast.error("Please enter a valid age between 1 and 100");
      return false;
    }
    
    const discordPattern = /^\d{17,19}$/;
    const cleanDiscord = data.discord.replace(/\D/g, '');
    if (!discordPattern.test(cleanDiscord)) {
      toast.error("Please enter a valid Discord ID (17-19 digits)");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit application");
      return;
    }
    const valid = validateForm();
    if (!valid) return;
    
    setSubmitting(true);

    try {
      // Check for existing pending application
      const { data: existing } = await supabase
        .from("applications")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "accepted"])
        .maybeSingle();

      if (existing) {
        if (existing.status === "accepted") {
          toast.error("Your application has already been accepted!");
        } else {
          toast.error("You already have a pending application. Check your dashboard.");
        }
        setSubmitting(false);
        return;
      }

      const insertData = {
        user_id: user.id,
        real_name: data.realName,
        discord: data.discord,
        age: data.age,
        rdm: data.rdm,
        vdm: data.vdm,
        metagaming: data.metagaming,
        powergaming: data.powergaming,
        char_name: data.charName,
        backstory: data.backstory,
        traits: data.traits,
      };
      
      // Insert with timeout and retry for slow Supabase free tier
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("timeout")), 8000)
          );
          
          const insertPromise = supabase.from("applications").insert(insertData);
          
          const result = await Promise.race([insertPromise, timeoutPromise]) as any;
          
          if (!result.error) {
            setSubmitted(true);
            toast.success("Application submitted successfully!");
            return;
          }
          
          lastError = result.error;
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 1000));
        } catch (e: any) {
          lastError = e;
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 1000));
        }
      }

      toast.error("Failed to submit after retries: " + (lastError?.message || "Unknown error"));
    } catch (e: any) {
      toast.error("Unexpected error: " + e.message);
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
            <div className="w-20 h-20 rounded-full gradient-red mx-auto mb-6 flex items-center justify-center">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-4xl font-bold uppercase tracking-wider mb-4">Application Submitted</h1>
            <p className="text-muted-foreground mb-8">We'll review your application and get back to you soon.</p>
            <Link to="/dashboard" className="gradient-red text-primary-foreground px-8 py-3 rounded-md font-heading uppercase tracking-wider hover:box-glow-red transition-all">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-center uppercase tracking-wider mb-2">
            Whitelist <span className="text-primary text-glow-red">Application</span>
          </h1>
          <p className="text-muted-foreground text-center mb-10">Show us you belong on the Southside.</p>

          <div className="flex items-center justify-center gap-2 mb-12">
            {stepTitles.map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading text-sm font-bold transition-all ${
                  i <= step ? "gradient-red text-primary-foreground box-glow-red" : "bg-secondary text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <span className="hidden sm:inline text-sm text-muted-foreground">{t}</span>
                {i < stepTitles.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl p-8 animate-fade-in" key={step}>
                {step === 0 && (
                  <div className="space-y-6">
                    <h2 className="font-heading text-2xl font-semibold uppercase tracking-wide mb-6">Personal Info</h2>
                    <InputField label="Real Name" value={data.realName} onChange={(v) => update("realName", v)} placeholder="e.g. Ahmed" required showErrors={validationAttempts[0] || false} />
                    <InputField label="Discord ID" value={data.discord} onChange={(v) => update("discord", v)} placeholder="e.g. 123456789012345678" required showErrors={validationAttempts[0] || false} />
                    <InputField label="Age" value={data.age} onChange={(v) => update("age", v)} placeholder="e.g. 18" type="number" required showErrors={validationAttempts[0] || false} />
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="font-heading text-2xl font-semibold uppercase tracking-wide mb-6">RP Knowledge</h2>
                    <TextAreaField label="What is RDM?" value={data.rdm} onChange={(v) => update("rdm", v)} placeholder="Explain Random Deathmatch..." required showErrors={validationAttempts[1] || false} />
                    <TextAreaField label="What is VDM?" value={data.vdm} onChange={(v) => update("vdm", v)} placeholder="Explain Vehicle Deathmatch..." required showErrors={validationAttempts[1] || false} />
                    <TextAreaField label="What is MetaGaming?" value={data.metagaming} onChange={(v) => update("metagaming", v)} placeholder="Explain MetaGaming..." required showErrors={validationAttempts[1] || false} />
                    <TextAreaField label="What is PowerGaming?" value={data.powergaming} onChange={(v) => update("powergaming", v)} placeholder="Explain PowerGaming..." required showErrors={validationAttempts[1] || false} />
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="font-heading text-2xl font-semibold uppercase tracking-wide mb-6">Character Creation</h2>
                    <InputField label="Character Name" value={data.charName} onChange={(v) => update("charName", v)} placeholder="e.g. Marcus 'Ghost' Rivera" required showErrors={validationAttempts[2] || false} />
                    <TextAreaField label="Backstory" value={data.backstory} onChange={(v) => update("backstory", v)} placeholder="Tell us your character's story..." rows={5} required showErrors={validationAttempts[2] || false} />
                    <TextAreaField label="Personality Traits" value={data.traits} onChange={(v) => update("traits", v)} placeholder="e.g. Loyal, Short-tempered, Street-smart" required showErrors={validationAttempts[2] || false} />
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(step - 1)}
                    disabled={step === 0}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors font-heading uppercase tracking-wide text-sm"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  {step < 2 ? (
                    <button
                      onClick={() => {
                        if (canProceedToNext()) {
                          setStep(step + 1);
                        }
                      }}
                      className="flex items-center gap-2 gradient-red text-primary-foreground px-6 py-2 rounded-md font-heading uppercase tracking-wide text-sm hover:box-glow-red transition-all"
                    >
                      Next <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canSubmit()) handleSubmit();
                      }}
                      disabled={submitting}
                      className="flex items-center gap-2 gradient-red text-primary-foreground px-8 py-2 rounded-md font-heading uppercase tracking-wide text-sm hover:box-glow-red transition-all disabled:opacity-70"
                    >
                      {submitting ? <><Loader2 className="animate-spin" size={16} /> Submitting...</> : "Submit Application"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-28">
                <h3 className="font-heading text-lg font-semibold uppercase tracking-wide mb-4 text-primary">Character Preview</h3>
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full gradient-red flex items-center justify-center font-heading text-2xl font-bold text-primary-foreground">
                    {data.charName ? data.charName[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                    <p className="font-heading text-lg">{data.charName || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Player</p>
                    <p className="text-sm">{data.discord || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Backstory</p>
                    <p className="text-sm text-muted-foreground line-clamp-4">{data.backstory || "No backstory yet..."}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Traits</p>
                    <p className="text-sm">{data.traits || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = "text", required = false, showErrors = false }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean; showErrors?: boolean }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-secondary border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
          !value.trim() && required && showErrors
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
            : 'border-border focus:border-primary focus:ring-primary'
        }`}
      />
      {!value.trim() && required && showErrors && (
        <p className="text-xs text-red-400 mt-1">This field is required</p>
      )}
    </div>
  );
};

const TextAreaField = ({ label, value, onChange, placeholder, rows = 3, required = false, showErrors = false }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number; required?: boolean; showErrors?: boolean }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full bg-secondary border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all resize-none ${
          !value.trim() && required && showErrors
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
            : 'border-border focus:border-primary focus:ring-primary'
        }`}
      />
      {!value.trim() && required && showErrors && (
        <p className="text-xs text-red-400 mt-1">This field is required</p>
      )}
    </div>
  );
};

export default Apply;
