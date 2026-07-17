import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Service } from "@/data/services";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border-border bg-card transition-shadow hover:shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-xl font-semibold text-card-foreground">
            {service.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {service.description}
          </p>
          <ul className="space-y-2">
            {service.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-card-foreground">
                <Check size={16} className="mt-0.5 shrink-0 text-secondary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-4 flex items-baseline justify-between border-t border-border">
            <div>
              <span className="font-display text-2xl font-bold text-foreground">{service.price} €</span>
              <span className="text-xs text-muted-foreground ml-1">{service.priceUnit}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/contact">En savoir plus</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
