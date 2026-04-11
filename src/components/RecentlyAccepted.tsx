const players = [
  "DarkKnight_RP", "StreetKing_42", "ShadowX", "NightRider", "BlazeMaster",
  "GhostFace_RP", "VenomStrike", "ColdBlood", "IronFist", "SilentSnake",
];

const RecentlyAccepted = () => {
  const doubled = [...players, ...players];

  return (
    <section className="py-16 overflow-hidden border-y border-border">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="font-heading text-2xl font-bold text-center uppercase tracking-wider">
          Recently <span className="text-primary">Accepted</span>
        </h2>
      </div>
      <div className="relative">
        <div className="flex gap-4 animate-scroll-left">
          {doubled.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex-shrink-0 bg-card border border-border rounded-lg px-6 py-3 flex items-center gap-3 hover:border-primary/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-red flex items-center justify-center text-primary-foreground font-heading text-sm font-bold">
                {name[0]}
              </div>
              <span className="text-sm font-medium">{name}</span>
              <span className="text-xs text-primary font-semibold">✓ Accepted</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyAccepted;
