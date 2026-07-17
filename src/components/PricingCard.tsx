import { Check, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Service } from "@/data/services";

interface PricingCardProps {
  plan: Service;
}

export function PricingCard({ plan }: PricingCardProps) {
  const isCustom = plan.price === "Sur mesure";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            <Star size={12} /> Populaire
          </span>
        </div>
      )}
      <Card
        className={`h-full flex flex-col ${
          plan.popular ? "border-primary shadow-md" : "border-border"
        } bg-card transition-shadow hover:shadow-lg`}
      >
        <CardHeader className="pb-4 text-center">
          <CardTitle className="font-display text-2xl font-semibold text-card-foreground">
            {plan.title}
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-6">
          <div className="text-center">
            <span className="font-display text-4xl font-bold text-foreground">
              {isCustom ? "Sur mesure" : `${plan.price} €`}
            </span>
            {plan.priceUnit && !isCustom && (
              <span className="text-sm text-muted-foreground ml-1">{plan.priceUnit}</span>
            )}
          </div>

          <ul className="space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3 text-sm text-card-foreground">
                <Check size={18} className="mt-0.5 shrink-0 text-secondary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            asChild
            className={`mt-auto w-full ${
              plan.popular
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
            }`}
          >
            <Link to="/contact">{isCustom ? "Demander un devis" : "Choisir cette offre"}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
