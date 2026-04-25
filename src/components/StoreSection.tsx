import { ShoppingCart, Car, Home, Plane, Users, Wrench } from "lucide-react";

const storeItems = [
  { icon: Car, label: "Vehicles", price: "From 50 Dt" },
  { icon: Home, label: "Properties", price: "From 50 Dt" },
  { icon: Plane, label: "Air & Sea", price: "From 80 Dt" },
  { icon: Users, label: "Peds & Gangs", price: "From 50 Dt" },
  { icon: Wrench, label: "Upgrades", price: "From 20 Dt" },
];

const StoreSection = () => {
  return (
    <section id="store" className="py-24 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-primary text-sm uppercase tracking-wider mb-3">Official Store</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Southside <span className="text-primary">Store</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Buy premium addon vehicles, properties, peds, gang items and more. All purchases are permanent and delivered in-game within 24h.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {storeItems.map((item, index) => (
            <div
              key={index}
              className="group bg-card border border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <item.icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="font-heading text-sm uppercase tracking-wide mb-1">{item.label}</h3>
              <p className="text-muted-foreground text-xs">{item.price}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://store-site-khaki.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 gradient-red text-primary-foreground px-8 py-3 rounded-md font-heading text-sm uppercase tracking-wider hover:box-glow-red transition-all duration-300"
          >
            <ShoppingCart className="w-4 h-4" />
            Visit Store
          </a>
          <p className="text-muted-foreground text-xs mt-4">
            Payment via Ooredoo Money • Delivery in 24h
          </p>
        </div>
      </div>
    </section>
  );
};

export default StoreSection;
