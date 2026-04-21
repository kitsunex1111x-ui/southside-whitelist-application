import { MessageSquare, BookOpen, FileText, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    num: "01", icon: MessageSquare, color: "from-[#5865F2] to-[#4752C3]",
    title: "Join Discord",
    desc: "Connect with the community, read announcements, and get all the information you need to get started.",
  },
  {
    num: "02", icon: BookOpen, color: "from-yellow-600 to-yellow-800",
    title: "Read the Rules",
    desc: "Take time to understand our standards. We expect serious, high-quality roleplay from every member.",
  },
  {
    num: "03", icon: FileText, color: "from-primary to-red-800",
    title: "Submit Application",
    desc: "Fill out the whitelist application. Show us your character, backstory, and RP knowledge.",
  },
  {
    num: "04", icon: CheckCircle, color: "from-green-600 to-green-800",
    title: "Get Accepted",
    desc: "Staff review your application within 24–48h. Once approved, welcome to the Southside.",
  },
];

const HowToJoin = () => {
  return (
    <section id="join" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-primary font-heading text-sm uppercase tracking-widest mb-3">Step by step</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
            How to <span className="text-primary text-glow-red">Join</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Four steps to the streets.</p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* desktop: horizontal timeline */}
          <div className="hidden md:grid grid-cols-4 gap-0 relative">
            {/* connecting line */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-col items-center text-center px-4 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 150}ms` }}>
                {/* icon circle */}
                <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <s.icon className="w-8 h-8 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center font-heading text-[10px] font-bold text-muted-foreground">
                    {s.num}
                  </span>
                </div>
                <h3 className="font-heading text-base font-semibold uppercase tracking-wide mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* mobile: vertical */}
          <div className="md:hidden space-y-6">
            {steps.map((s, i) => (
              <div key={s.num} className="flex gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-heading text-muted-foreground uppercase tracking-widest">{s.num}</span>
                    <h3 className="font-heading text-base font-semibold uppercase tracking-wide">{s.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/apply"
            className="inline-flex items-center gap-2 gradient-red text-primary-foreground px-10 py-4 rounded-md font-heading uppercase tracking-wider hover:box-glow-red transition-all duration-300">
            <FileText size={18} /> Start Your Application
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowToJoin;
